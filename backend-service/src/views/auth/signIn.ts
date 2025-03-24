import { NodeLogger } from '@unconventional-code/observability-sdk';
import { getConfig } from '@unconventional-jackson/gently-common-service';
import { UserModel } from '@unconventional-jackson/gently-database-service';
import {
  AuthSignInRequestBody,
  AuthUser,
  ErrorResponse,
  SignIn200Response,
} from '@unconventional-jackson/gently-openapi-service';
import { compare } from 'bcrypt';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { DateTime } from 'luxon';
import ms from 'ms';

import { AccessTokenPayload, RefreshTokenPayload } from '../../utils/auth';
import {
  ACCESS_TOKEN_TIMEOUT,
  REFRESH_TOKEN_TIMEOUT,
  TOTP_VERIFY_TIMEOUT,
} from '../../utils/constants';

export async function signIn(
  req: Request<unknown, unknown, AuthSignInRequestBody>,
  res: Response<SignIn200Response | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/Auth/signIn',
  });

  try {
    if (!req.body.email) {
      res.status(400).json({ error: 'Missing email in the body.' });
      return;
    }
    const email = req.body.email;

    if (!req.body.password) {
      res.status(400).json({ error: 'Missing password in the body.' });
      return;
    }
    const password = req.body.password;

    const user = await UserModel.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if the email is verified before proceeding with password validation
    if (!user.auth_email_verified) {
      res.status(401).json({ error: 'Email not verified' });
      return;
    }

    if (!user.auth_password_hash) {
      res.status(500).json({ error: 'User does not have a password hash yet' });
      return;
    }

    let isValidPassword = false;
    try {
      isValidPassword = await compare(password, user.auth_password_hash);
    } catch (error) {
      log.error(error);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (
      user.auth_totp_verified_at &&
      DateTime.fromJSDate(user.auth_totp_verified_at).diffNow().toMillis() > ms(TOTP_VERIFY_TIMEOUT)
    ) {
      const unchallengedAuthUser: AuthUser = {
        user_id: user.user_id,
        email: user.email,
        auth_email_verified: user.auth_email_verified,
        auth_totp_verified_at: user.auth_totp_verified_at?.toISOString() || null,
        // auth_totp_enabled: user.auth_totp_enabled,
      };
      res.status(200).json({ message: 'TOTP verification expired', user: unchallengedAuthUser });
      return;
    }

    // Generate session JWT here
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
      user_id: user.user_id,
      email: user.email,
      access_token: accessToken,
      refresh_token: refreshToken,
      auth_email_verified: user.auth_email_verified,
      auth_totp_verified_at: user.auth_totp_verified_at?.toISOString() || null,
      auth_totp_enabled: user.auth_totp_enabled,
    };

    res.status(200).json({
      message: 'Sign-in successful',
      user: authUser,
    });
    return;
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: String(error) });
  }
}
