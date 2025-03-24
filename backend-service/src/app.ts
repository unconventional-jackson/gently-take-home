import { NodeLogger } from '@unconventional-code/observability-sdk';
import { getConfig, IConfig } from '@unconventional-jackson/gently-common-service';
import { getDatabaseConnection } from '@unconventional-jackson/gently-database-service';
import cors from 'cors';
import express, { Express, json } from 'express';

import {
  correlationMiddleware,
  requestEndedMiddleware,
  requestStartedMiddleware,
} from './middlewares/correlation';
import { routes } from './views';

const log = new NodeLogger({ name: 'app' });

let app: Express | null = null;

function checkAllowedOrigins(config: IConfig, origin: string | undefined): boolean {
  let origins: RegExp[] = [];
  if (config.ENV === 'local') {
    origins = [
      /^http:\/\/localhost/, // allow localhost for testing on local machine
      /^http:\/\/localhost:\d+$/, // allow localhost for testing on local machine
      /^http:\/\/10\.0\.0\.\d+:\d+$/, // allow 10.0.0.x for testing on mobile on local network
      /^http:\/\/192\.168\.1\.\d+:\d+$/, // allow 192.168.1.x for testing on mobile on local network
    ];
  } else if (config.ENV === 'dev') {
    origins = [
      /^http:\/\/localhost/, // allow localhost for testing on local machine
      /^http:\/\/localhost:\d+$/, // allow localhost for testing on local machine
      /^http:\/\/10\.0\.0\.\d+:\d+$/, // allow 10.0.0.x for testing on mobile on local network
      /^http:\/\/192\.168\.1\.\d+:\d+$/, // allow 192.168.1.x for testing on mobile on local network
      /^https:\/\/dev\.gentlytakehome\.com$/,
      /^https:\/\/api\.dev\.gentlytakehome\.com$/,
    ];
  } else if (config.ENV === 'prod') {
    origins = [
      // disallow localhost / 10.0.0.x / 192.168.1.x in production
      /^https:\/\/api\.prod\.gentlytakehome\.com$/,
      /^https:\/\/prod\.gentlytakehome\.com$/,
      /^https:\/\/gentlytakehome\.com$/,
    ];
  }

  return !origin || origins.some((regex) => regex.test(origin));
}

export async function getExpressApp(config: IConfig, testEnvironment = false) {
  if (!app) {
    app = express();

    //  Connect all our routes to our application
    app.use(correlationMiddleware);
    app.use(requestStartedMiddleware);
    app.use(requestEndedMiddleware);
    app.use(
      cors({
        origin: (origin, callback) => {
          if (checkAllowedOrigins(config, origin)) {
            callback(null, true); // Allow the request
          } else {
            callback(new Error('Not allowed by CORS')); // Block the request
          }
        },
        credentials: true, // Allow cookies to be sent with requests
      })
    );
    app.use(json({ limit: '10mb' }));
    app.use('/', routes);
    if (!testEnvironment) {
      const port = config.APPLICATION_PORT;
      app.listen(port, () => {
        log.info(`Server listening on port ${port}`);
      });
    }
  }

  return Promise.resolve(app);
}

export async function main(testEnvironment = false) {
  // First, get the configuration
  log.info('Getting the configuration');
  const config = await getConfig();

  // Connect to the database
  log.info('Connecting to the database');
  await getDatabaseConnection({
    isTestEnvironment: testEnvironment,
  });

  // Get the express app
  log.info('Connecting to the express app');
  const expressApp = await getExpressApp(config, testEnvironment);

  log.info('Returning the Express app');
  return expressApp;
}
