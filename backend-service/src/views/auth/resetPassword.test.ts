import { getUserId, UserModel } from '@unconventional-jackson/gently-database-service';
import {
  ErrorResponse,
  ResetPassword200Response,
} from '@unconventional-jackson/gently-openapi-service';
import { compare } from 'bcrypt';
import { Express } from 'express';
import * as speakeasy from 'speakeasy';
import request from 'supertest';

import { main } from '../../app';
describe('views/Auth/resetPassword', () => {
  let app: Express;

  beforeAll(async () => {
    app = await main(true);
  });

  describe('success cases', () => {
    describe('when the password reset is successful', () => {
      it('updates the password and returns success', async () => {
        // Sign up a user
        const email = getUserId();
        await request(app).post('/auth/signup').send({
          email,
          password: 'old_password',
        });

        const user = await UserModel.findOne({ where: { email } });
        const token = speakeasy.totp({
          secret: user?.auth_totp_secret ?? '',
          encoding: 'ascii',
          digits: 6,
        });

        // Call the reset-password endpoint
        const response = await request(app).post('/auth/reset-password').send({
          email,
          new_password: 'newPassword123',
          token,
        });

        const body = response.body as ResetPassword200Response;
        expect(response.status).toBe(200);
        expect(body.message).toBe('Password updated');

        // Verify the password was updated
        const updatedUser = await UserModel.findOne({
          where: { email },
        });
        if (updatedUser?.auth_password_hash) {
          const isPasswordUpdated = await compare('newPassword123', updatedUser.auth_password_hash);
          expect(isPasswordUpdated).toBe(true);
        } else {
          throw new Error('Password hash is not set');
        }
      });
    });
  });

  describe('failure cases', () => {
    describe('when the new password is missing', () => {
      it('throws an error', async () => {
        const response = await request(app).post('/auth/reset-password').send({
          email: getUserId(),
          token: 'valid_token',
        });

        const body = response.body as ErrorResponse;
        expect(response.status).toBe(400);
        expect(body.error).toBe('Missing new_password in the body.');
      });
    });

    describe('when the token is missing', () => {
      it('throws an error', async () => {
        const response = await request(app).post('/auth/reset-password').send({
          email: getUserId(),
          new_password: 'newPassword123',
        });

        const body = response.body as ErrorResponse;
        expect(response.status).toBe(400);
        expect(body.error).toBe('Missing token in the body.');
      });
    });

    describe('when the user is not found', () => {
      it('throws an error', async () => {
        const response = await request(app).post('/auth/reset-password').send({
          email: getUserId(),
          new_password: 'newPassword123',
          token: 'non_existent_token',
        });

        const body = response.body as ErrorResponse;
        expect(response.status).toBe(404);
        expect(body.error).toBe('User not found');
      });
    });

    describe('when the token is invalid', () => {
      it('throws an error', async () => {
        // Sign up a user and set a valid token
        const email = getUserId();
        await request(app).post('/auth/signup').send({
          email,
          password: 'password123',
        });

        // Call reset password with an invalid token
        const response = await request(app).post('/auth/reset-password').send({
          email,
          new_password: 'newPassword123',
          token: 'invalid_token', // Incorrect token
        });

        const body = response.body as ErrorResponse;
        expect(response.status).toBe(400);
        expect(body.error).toBe('Invalid TOTP token');
      });
    });
  });
});
