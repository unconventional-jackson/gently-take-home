import { NodeLogger } from '@unconventional-code/observability-sdk';
import { NextFunction, Request, Response } from 'express';
import { v4 } from 'uuid';

export const correlationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlation = v4();
  res.locals.correlation = correlation;
  next();
};

export const requestStartedMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'requestStartedMiddleware',
  });
  const method = req.method;
  const url = req.url;
  log.info(`${method} ${url}`);
  next();
};

export const requestEndedMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Capture a high-resolution start time
  const startTime = process.hrtime();
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'requestEndedMiddleware',
  });

  // The 'finish' event is emitted when the response has been sent
  res.on('finish', () => {
    // Calculate the duration in milliseconds
    const diff = process.hrtime(startTime);
    const duration = diff[0] * 1000 + diff[1] / 1e6;

    if (res.statusCode >= 400) {
      log.error(req.body);
    }
    log.info(`${req.method} ${req.url} ${res.statusCode} ${duration.toFixed(2)}ms`, {
      endpoint: req.url,
      durationMs: duration,
      status: res.statusCode,
    });
  });

  next();
};
