import { NodeLogger } from '@unconventional-code/observability-sdk';
import { UserModel } from '@unconventional-jackson/gently-database-service';
import {
  AuthTOTPSetupRequestBody,
  ErrorResponse,
  TotpSetup200Response,
} from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';
import * as speakeasy from 'speakeasy';

import { TOTP_DOMAIN } from '../../utils/constants';

export type AuthTOTPSetupResponseBody = {
  otpauth_url?: string;
  error?: unknown;
};

export async function totpSetup(
  req: Request<unknown, unknown, AuthTOTPSetupRequestBody>,
  res: Response<TotpSetup200Response | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/Auth/totpSetup',
  });

  try {
    if (!req.body.email) {
      res.status(400).json({ error: 'Missing email in the body.' });
      return;
    }
    const email = req.body.email;

    const user = await UserModel.findOne({ where: { email } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    let auth_totp_secret = user.auth_totp_secret;
    if (!auth_totp_secret) {
      log.info('User does not have TOTP secret set up, generating one', {
        user_id: user.user_id,
      });
      const secret = speakeasy.generateSecret({ length: 20, name: TOTP_DOMAIN });
      auth_totp_secret = secret.ascii;
      user.auth_totp_secret = auth_totp_secret;
      await user.save();
    }

    const otpauth_url = speakeasy.otpauthURL({
      secret: auth_totp_secret,
      label: email,
      issuer: TOTP_DOMAIN,
    });

    res.status(200).json({ otpauth_url });
    return;
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: String(error) });
  }
}
