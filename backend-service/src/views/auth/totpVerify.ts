import { NodeLogger } from '@unconventional-code/observability-sdk';
import { getConfig } from '@unconventional-jackson/gently-common-service';
import { UserModel } from '@unconventional-jackson/gently-database-service';
import {
  AuthTOTPVerifyRequestBody,
  AuthUser,
  ErrorResponse,
  TotpVerify200Response,
} from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import * as speakeasy from 'speakeasy';

import { AccessTokenPayload, RefreshTokenPayload } from '../../utils/auth';
import { ACCESS_TOKEN_TIMEOUT, REFRESH_TOKEN_TIMEOUT } from '../../utils/constants';

export async function totpVerify(
  req: Request<unknown, unknown, AuthTOTPVerifyRequestBody>,
  res: Response<TotpVerify200Response | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/Auth/totpVerify',
  });

  try {
    if (!req.body.email) {
      res.status(400).json({ error: 'Missing email in the body.' });
      return;
    }
    if (!req.body.token) {
      res.status(400).json({ error: 'Missing token in the body.' });
      return;
    }

    const { email, token } = req.body;

    const user = await UserModel.findOne({ where: { email } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (!user.auth_totp_secret) {
      res.status(400).json({ error: 'TOTP not set up' });
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

    if (!user?.auth_totp_enabled) {
      log.info('Enabling TOTP for user', { user_id: user.user_id });
      await user.update({
        auth_totp_enabled: true,
      });
    }

    await user.update({
      auth_totp_verified_at: new Date(),
    });

    const config = await getConfig();
    const accessTokenPayload: AccessTokenPayload = {
      email: user.email,
      user_id: user.user_id,
    };
    const accessToken = jwt.sign(accessTokenPayload, config.ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_TIMEOUT,
    });

    const refreshTokenPayload: RefreshTokenPayload = {
      email: user.email,
      user_id: user.user_id,
    };
    const refreshToken = jwt.sign(refreshTokenPayload, config.ACCESS_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_TIMEOUT,
    });

    const authUser: AuthUser = {
      email: user.email,
      user_id: user.user_id,
      access_token: accessToken,
      refresh_token: refreshToken,
      auth_email_verified: user.auth_email_verified,
      auth_totp_verified_at: user.auth_totp_verified_at?.toISOString() || null,
      auth_totp_enabled: user.auth_totp_enabled,
    };

    res.status(200).json({
      message: 'TOTP verified successfully',
      user: authUser,
    });
    return;
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: String(error) });
  }
}
