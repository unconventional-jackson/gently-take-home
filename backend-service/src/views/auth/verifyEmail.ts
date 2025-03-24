import { NodeLogger } from '@unconventional-code/observability-sdk';
import { UserModel } from '@unconventional-jackson/gently-database-service';
import {
  AuthUser,
  AuthVerifyEmailRequestBody,
  ErrorResponse,
  VerifyEmail200Response,
} from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';
import * as speakeasy from 'speakeasy';

export async function verifyEmail(
  req: Request<unknown, unknown, AuthVerifyEmailRequestBody>,
  res: Response<VerifyEmail200Response | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/Auth/verifyEmail',
  });

  try {
    const { email, token } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Missing email in the body.' });
      return;
    }
    if (!token) {
      res.status(400).json({ error: 'Missing token in the body.' });
      return;
    }
    const user = await UserModel.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.auth_totp_secret) {
      res.status(400).json({ error: 'No TOTP secret found for user' });
      return;
    }

    const isValidToken = speakeasy.totp.verify({
      secret: user.auth_totp_secret,
      encoding: 'ascii',
      token,
      digits: 6,
      window: 1,
    });

    if (!isValidToken) {
      res.status(400).json({ error: 'Invalid or expired verification code' });
      return;
    }

    await user.update({
      auth_email_verified: true,
    });

    const authUser: AuthUser = {
      user_id: user.user_id,
      email: user.email,
      auth_email_verified: user.auth_email_verified,
      auth_totp_enabled: user.auth_totp_enabled,
      auth_totp_verified_at: user?.auth_totp_verified_at?.toISOString() || null,
    };

    res.status(200).json({ message: 'Email verified successfully.', user: authUser });
    return;
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: String(error) });
  }
}
