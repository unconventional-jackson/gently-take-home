import { NodeLogger } from '@unconventional-code/observability-sdk';
import { UserModel } from '@unconventional-jackson/gently-database-service';
import {
  AuthResetPasswordBody,
  ErrorResponse,
  ResetPassword200Response,
} from '@unconventional-jackson/gently-openapi-service';
import { hash } from 'bcrypt';
import { Request, Response } from 'express';
import * as speakeasy from 'speakeasy';

export async function resetPassword(
  req: Request<unknown, unknown, AuthResetPasswordBody>,
  res: Response<ResetPassword200Response | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/Auth/resetPassword',
  });

  try {
    if (!req.body.email) {
      res.status(400).json({ error: 'Missing email in the body.' });
      return;
    }

    if (!req.body.new_password) {
      res.status(400).json({ error: 'Missing new_password in the body.' });
      return;
    }
    const newPassword = req.body.new_password;

    if (!req.body.token) {
      res.status(400).json({ error: 'Missing token in the body.' });
      return;
    }
    const token = req.body.token;

    const user = await UserModel.findOne({ where: { email: req.body.email } });

    // else if (res.locals.user_id) {
    //   user = await UserModel.findByPk(res.locals.user_id);
    // }
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.auth_totp_secret) {
      res.status(404).json({ error: 'TOTP not set up' });
      return;
    }

    const verified = speakeasy.totp.verify({
      secret: user.auth_totp_secret,
      encoding: 'ascii',
      token,
    });

    if (!verified) {
      res.status(400).json({ error: 'Invalid TOTP token' });
      return;
    }

    /**
     * Hash the new password and update the user
     */
    const authPasswordHash = await hash(newPassword, 10);
    await user.update({
      auth_password_hash: authPasswordHash,
    });

    res.status(200).json({ message: 'Password updated' });
    return;
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: String(error) });
  }
}
