import { getConfig } from '@unconventional-jackson/gently-common-service';
import { UserModel } from '@unconventional-jackson/gently-database-service';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

export async function ensureToken(req: Request, res: Response, next: NextFunction) {
  try {
    const config = await getConfig();

    const authorizationHeader = req.headers['Authorization'] ?? req.headers['authorization'] ?? '';
    const bearerToken = authorizationHeader.toString().split(' ').pop();

    if (bearerToken) {
      // First, verify if this is a user
      const decodedToken = jwt.verify(bearerToken, config.ACCESS_TOKEN_SECRET);
      if (typeof decodedToken !== 'string' && 'user_id' in decodedToken) {
        const user = await UserModel.findByPk(decodedToken.user_id);
        if (user) {
          res.locals.user_id = user.user_id;
          next();
          return;
        }
      }
    }
    res.status(401).json({ error: 'Missing Authorization' });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token Expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid Token' });
    } else if (error instanceof jwt.NotBeforeError) {
      res.status(401).json({ error: 'Token Not Active' });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
