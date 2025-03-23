import { NodeLogger } from '@unconventional-code/observability-sdk';
import { UserModel } from '@unconventional-jackson/gently-database-service';
import { AuthResendVerificationRequestBody } from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';
import * as speakeasy from 'speakeasy';

import { sendSendGridEmail } from '../../services/sendSendGridEmail';

export type AuthResendVerificationResponseBody = {
  message?: string;
  error?: unknown;
};

export async function resendVerification(
  req: Request<unknown, unknown, AuthResendVerificationRequestBody>,
  res: Response<AuthResendVerificationResponseBody>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/Auth/resendVerification',
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

    if (user.auth_email_verified) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    if (!user?.auth_totp_secret) {
      res.status(400).json({ error: 'TOTP not set up' });
      return;
    }

    const verificationCode = speakeasy.totp({
      secret: user.auth_totp_secret,
      encoding: 'ascii',
      digits: 6,
    });

    await sendSendGridEmail({
      to: [email],
      subject: 'Verify Your Email',
      body: `Your new verification code is: ${verificationCode}`,
      correlation: res.locals.correlation,
    });
    res.status(201).json({ message: 'Verification email resent. Verify your email.' });
    return;
  } catch (error) {
    log.error(error);
    res.status(500).json({ error });
  }
}
