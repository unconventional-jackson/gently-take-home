import { NodeLogger } from '@unconventional-code/observability-sdk';
import { UserModel } from '@unconventional-jackson/gently-database-service';
import { AuthForgotPasswordRequestBody } from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';
import * as speakeasy from 'speakeasy';

import { sendSendGridEmail } from '../../services/sendSendGridEmail';

export type AuthForgotPasswordResponseBody = {
  message?: string;
  error?: unknown;
};

export async function forgotPassword(
  req: Request<unknown, unknown, AuthForgotPasswordRequestBody>,
  res: Response<AuthForgotPasswordResponseBody>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/Auth/forgotPassword',
  });

  try {
    if (!req.body.email) {
      res.status(400).json({ message: 'Missing email in the body.' });
      return;
    }
    const email = req.body.email;

    const user = await UserModel.findOne({
      where: {
        email,
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.auth_totp_secret) {
      res.status(400).json({ error: 'TOTP not set up' });
      return;
    }
    // TODO: Generate a random password reset token
    const resetToken = speakeasy.totp({
      secret: user.auth_totp_secret,
      encoding: 'ascii',
      digits: 6,
    });

    // TODO: Do we need to store the reset token in the database?

    // TODO: Send email with reset token
    await sendSendGridEmail({
      to: [email],
      subject: 'Reset Your Password',
      body: `Your password reset token is: ${resetToken}`,
      correlation: res.locals.correlation,
    });
    res.status(200).json({ message: 'Password reset token sent' });
    return;
  } catch (error) {
    log.error(error);
    res.status(500).json({ error });
  }
}
