import { getUserId, UserModel } from '@unconventional-jackson/gently-database-service';
import {
  ErrorResponse,
  VerifyEmail200Response,
} from '@unconventional-jackson/gently-openapi-service';
import { Express } from 'express';
import * as speakeasy from 'speakeasy';
import request from 'supertest';

import { main } from '../../app';
import * as SendGrid from '../../services/sendSendGridEmail';

describe('views/Auth/verifyEmail', () => {
  let app: Express;

  beforeAll(async () => {
    app = await main(true);
    jest.spyOn(SendGrid, 'sendSendGridEmail').mockResolvedValue();
  });

  describe('success cases', () => {
    describe('when the email and token are valid', () => {
      it('should verify the email successfully', async () => {
        const userModelFindOneSpy = jest.spyOn(UserModel, 'findOne');

        const email = getUserId();

        // Sign up the user first
        await request(app).post('/auth/signup').send({
          email,
          password: 'password123',
        });

        const user = await UserModel.findOne({ where: { email } });
        const token = speakeasy.totp({
          secret: user?.auth_totp_secret ?? '',
          encoding: 'ascii',
          digits: 6,
        });

        // Perform verify email request (without using user_id in headers)
        const response = await request(app).post('/auth/verify-email').send({
          email,
          token,
        });

        const body = response.body as VerifyEmail200Response;
        expect(response.status).toBe(200);
        expect(body.message).toBe('Email verified successfully.');

        // Verify the user was updated in the database
        const updatedUser = await UserModel.findOne({ where: { email } });
        expect(userModelFindOneSpy).toHaveBeenCalledWith({
          where: { email },
        });
        expect(updatedUser?.auth_email_verified).toBe(true);
      });
    });
  });

  describe('failure cases', () => {
    describe('when the email is missing', () => {
      it('throws an error', async () => {
        const response = await request(app).post('/auth/verify-email').send({
          token: 'valid_token',
        });

        const body = response.body as ErrorResponse;
        expect(response.status).toBe(400);
        expect(body.error).toBe('Missing email in the body.');
      });
    });

    describe('when the token is missing', () => {
      it('throws an error', async () => {
        const response = await request(app).post('/auth/verify-email').send({
          email: 'test@example.com',
        });

        const body = response.body as ErrorResponse;
        expect(response.status).toBe(400);
        expect(body.error).toBe('Missing token in the body.');
      });
    });

    describe('when the user is not found', () => {
      it('throws an error', async () => {
        const response = await request(app).post('/auth/verify-email').send({
          email: 'nonexistent@example.com',
          token: 'valid_token',
        });

        const body = response.body as ErrorResponse;
        expect(response.status).toBe(404);
        expect(body.error).toBe('User not found');
      });
    });

    describe('when the email is invalid', () => {
      it('throws an error', async () => {
        // Sign up the user first
        const email = getUserId();
        await request(app).post('/auth/signup').send({
          email,
          password: 'password123',
        });

        const user = await UserModel.findOne({ where: { email } });

        const token = speakeasy.totp({
          secret: user?.auth_totp_secret ?? '',
          encoding: 'ascii',
          digits: 6,
        });

        const response = await request(app).post('/auth/verify-email').send({
          email: 'test@example.com', // Incorrect email
          token,
        });

        const body = response.body as ErrorResponse;
        // Adjusted expected status to 404 instead of 400
        expect(response.status).toBe(404);
        expect(body.error).toBe('User not found');
      });
    });

    describe('when the token is invalid', () => {
      it('throws an error', async () => {
        // Sign up the user first
        await request(app).post('/auth/signup').send({
          email: 'test@example.com',
          password: 'password123',
        });

        const response = await request(app).post('/auth/verify-email').send({
          email: 'test@example.com',
          token: 'invalid_token', // Incorrect token
        });

        const body = response.body as ErrorResponse;
        expect(response.status).toBe(400);
        expect(body.error).toBe('Invalid or expired verification code');
      });
    });
  });
});
