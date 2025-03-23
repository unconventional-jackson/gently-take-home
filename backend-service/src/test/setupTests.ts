/* eslint-disable no-console */

import { IConfig } from '@unconventional-jackson/gently-common-service';
import * as Config from '@unconventional-jackson/gently-common-service/dist/config';
import { getDatabaseConnection } from '@unconventional-jackson/gently-database-service';
import { Settings } from 'luxon';

/**
 * Generally, the only thing we'll do in this file is to mock the console methods to prevent them from logging to the console.
 *
 * Logging to the console can be useful for debugging, but it can also be annoying when running tests, especially when we're running a lot of tests; it can make it hard to see the output of the tests themselves, and more importantly, logging for a lot of tests can be performance-intensive and slow, so preventing logging can make sure your tests run quickly.
 *
 * If you want to enable logging for debugging failing tests, explicitly pass in the environment variable with a truthy value, e.g.
 *
 *
 * ```sh
 * LOGGING_ENABLED=1 npm run test:unit
 * ```
 *
 * In addition to spying on the console methods, we need to mock the `NodeLogger` class from the `@unconventional-code/observability-sdk` package.
 */
if (!process.env.LOGGING_ENABLED) {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.spyOn(console, 'debug').mockImplementation(() => undefined);

  jest.mock('@unconventional-code/observability-sdk', () => {
    return {
      NodeLogger: jest.fn(() => ({
        error: jest.fn(),
        info: jest.fn(),
        log: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        setContext: jest.fn(),
      })),
    };
  });
}

/**
 * This file is used to setup the test environment with any global test setup we want.
 */
beforeEach(async () => {
  const config: IConfig = {
    AWS_REGION: 'test',
    POSTGRES_HOST: 'localhost',
    POSTGRES_USER: '',
    POSTGRES_PASSWORD: '',
    POSTGRES_DB: 'postgres',
    POSTGRES_PORT: 5555,
    APPLICATION_PORT: 4000,
    SENDGRID_API_KEY: 'sg.test',
    SENDGRID_SOURCE_EMAIL_ADDRESS: 'test@unconventionalcode.com',
    ACCESS_TOKEN_SECRET: 'secret',
    ENV: 'test',
    CLIENT: 'test',
    SERVICE: 'test',
  };
  jest.spyOn(Config, 'getConfig').mockResolvedValue(config);

  /**
   * Set a default time zone for tests as UTC instead of local time.
   */
  Settings.defaultZone = 'utc';

  if (!process.env.LOGGING_ENABLED) {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'debug').mockImplementation(() => undefined);

    jest.mock('@unconventional-code/observability-sdk', () => {
      return {
        NodeLogger: jest.fn(() => ({
          error: jest.fn(),
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          setContext: jest.fn(),
        })),
      };
    });
  }
  /**
   * Create a global connection to the database before running any tests.
   */
  const sequelize = await getDatabaseConnection();

  /**
   * Clears the database between tests to avoid unintentional flakiness from collisions between database records.
   */
  try {
    await sequelize.sync({ force: true });
  } catch (error) {
    console.log(error);
  }
});

afterEach(() => {
  jest.restoreAllMocks();
});
