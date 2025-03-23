import { NodeLogger } from '@unconventional-code/observability-sdk';
import { getConfig } from '@unconventional-jackson/gently-common-service';
import { UserModel } from '@unconventional-jackson/gently-database-service';
import {
  AuthRefreshTokenRequestBody,
  ErrorResponse,
  RefreshToken200Response,
} from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

import { AccessTokenPayload, RefreshTokenPayload } from '../../utils/auth';
import { ACCESS_TOKEN_TIMEOUT } from '../../utils/constants';

export async function refreshToken(
  req: Request<unknown, unknown, AuthRefreshTokenRequestBody>,
  res: Response<RefreshToken200Response | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/Auth/refreshToken',
  });

  try {
    if (!req.body.refresh_token) {
      res.status(400).json({ error: 'Missing refresh_token in the body' });
      return;
    }

    const config = await getConfig();

    const decoded = jwt.verify(req.body.refresh_token, config.ACCESS_TOKEN_SECRET);
    if (typeof decoded !== 'object') {
      throw new Error('Invalid refresh token');
    }

    const typeSafeDecoded = decoded as RefreshTokenPayload;
    const userId = typeSafeDecoded.user_id;
    const user = await UserModel.findByPk(userId);

    if (
      !user?.auth_refresh_token ||
      user?.auth_refresh_token !== req.body.refresh_token ||
      !user?.email ||
      !user?.user_id
    ) {
      throw new Error('Missing or invalid properties for token');
    }
    log.info('User is refreshing their token', {
      user_id: user.user_id,
    });
    const accessTokenPayload: AccessTokenPayload = {
      email: user.email,
      user_id: user.user_id,
    };
    const accessToken = jwt.sign(accessTokenPayload, config.ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_TIMEOUT,
    });

    res.status(200).json({
      access_token: accessToken,
    });
    return;
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}
