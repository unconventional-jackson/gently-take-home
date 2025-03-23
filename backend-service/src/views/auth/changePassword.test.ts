/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { getUserId, UserModel } from '@unconventional-jackson/gently-database-service';
import { ErrorResponse, SignIn200Response } from '@unconventional-jackson/gently-openapi-service';
import { compare } from 'bcrypt';
import { Express } from 'express';
import request from 'supertest';

import { main } from '../../app';
import { AuthChangePasswordResponseBody } from './changePassword';

describe('views/Auth/changePassword', () => {
  let app: Express;
  beforeAll(async () => {
    app = await main(true);
  });

  describe('success cases', () => {
    describe('when the password change is successful', () => {
      it('updates the password and returns success', async () => {
        // Step 1: Sign up an user
        await request(app).post('/auth/signup').send({
          email: 'test@example.com',
          password: 'old_password',
        });

        // Simulate email verification
        await UserModel.update(
          { auth_email_verified: true },
          { where: { email: 'test@example.com' } }
        );

        // Step 2: Sign in the user (to simulate a session)
        const signInResponse = await request(app).post('/auth/signin').send({
          email: 'test@example.com',
          password: 'old_password',
        });

        const email = (signInResponse.body as SignIn200Response)?.user?.email; // Extract email
        expect(email).toBeDefined(); // Ensure email is defined
        expect(signInResponse.status).toBe(200);

        // Step 3: Change the password using the email
        const response = await request(app).post('/auth/change-password').send({
          email,
          current_password: 'old_password',
          new_password: 'newPassword123',
        });

        const body = response.body as AuthChangePasswordResponseBody;
        expect(response.status).toBe(200);
        expect(body.message).toBe('Password updated');

        // Step 4: Verify the password was updated
        const updatedUser = await UserModel.findOne({
          where: { email: 'test@example.com' },
        });
        const isPasswordUpdated =
          !!updatedUser?.auth_password_hash &&
          (await compare('newPassword123', updatedUser?.auth_password_hash));
        expect(isPasswordUpdated).toBe(true);
      });
    });
  });

  describe('failure cases', () => {
    describe('when the current password is missing', () => {
      it('throws an error', async () => {
        const response = await request(app).post('/auth/change-password').send({
          email: getUserId(),
          new_password: 'newPassword123',
        });

        const body = response.body as AuthChangePasswordResponseBody;
        expect(response.status).toBe(400);
        expect(body.message).toBe('Missing current_password in the body.');
      });
    });

    describe('when the new password is missing', () => {
      it('throws an error', async () => {
        const response = await request(app).post('/auth/change-password').send({
          email: getUserId(),
          current_password: 'old_password',
        });

        const body = response.body as AuthChangePasswordResponseBody;
        expect(response.status).toBe(400);
        expect(body.message).toBe('Missing new_password in the body.');
      });
    });

    describe('when the user is not found', () => {
      it('throws an error', async () => {
        const email = 'nonexistent@example.com'; // Use a non-existent email
        const response = await request(app)
          .post('/auth/change-password')
          .send({
            email,
            current_password: 'old_password',
            new_password: 'newPassword123',
          })
          .set('email', email);

        const body = response.body as ErrorResponse;
        expect(response.status).toBe(400);
        expect(body.error).toBe('User not found');
      });
    });
    describe('when the user has no password set', () => {
      it('throws an error', async () => {
        // Create a user without a password
        const user = await UserModel.create({
          user_id: getUserId(),
          email: 'test_no_password@example.com',
          auth_email_verified: false,
          auth_password_hash: null, // No password set
          auth_totp_secret: 'totp_secret',
        });

        const response = await request(app).post('/auth/change-password').send({
          email: user.email,
          current_password: 'old_password',
          new_password: 'newPassword123',
        });

        const body = response.body as ErrorResponse;
        expect(response.status).toBe(400);
        expect(body.error).toBe('User has no password');
      });
    });

    describe('when the current password does not match', () => {
      it('throws an error', async () => {
        // Step 1: Sign up a user
        const email = 'test@example.com';
        await request(app).post('/auth/signup').send({
          email,
          password: 'correct_password',
        });

        // Simulate email verification
        await UserModel.update({ auth_email_verified: true }, { where: { email } });

        // Step 3: Try changing the password with an incorrect current password
        const response = await request(app).post('/auth/change-password').send({
          email,
          current_password: 'wrong_password',
          new_password: 'newPassword123',
        });

        const body = response.body as ErrorResponse;
        expect(response.status).toBe(400);
        expect(body.error).toBe('Password does not match');
      });
    });
  });
});
