/**
 * Generally, we use this file to set environment variables that are required for testing.
 *
 * A lot of our code will depend on environment variables and throw errors if they are not set; for example, we might have something like:
 *
 * ```typescript
 * if (!process.env.ENVIRONMENT_VARIABLE) {
 *   throw new Error('ENVIRONMENT_VARIABLE is not set');
 * }
 * const environmentVariable = process.env.ENVIRONMENT_VARIABLE;
 * ```
 *
 * If that code executes as part of the total call stack, it will throw an error because `process.env.ENVIRONMENT_VARIABLE` is not set.
 *
 * In our `setup.ts`, any environment variables like this, set to a reasonable, generally fake value (like `test`, etc), so that the code can execute without throwing an error, but without providing real credentials or access keys to real resources (i.e. we don't want to allow our unit tests to hit the real APIs or databases, for example).
 */
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';
process.env.AWS_REGION = 'test';
process.env.AWS_ACCOUNT_ID = 'test';
/**
 * This specifically appears to cause flaky behavior around S3 in tests
 * https://github.com/freshollie/jest-dynalite/issues/79
 */
process.env.AWS_PROFILE = '';
process.env.ENV = 'test';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_USER = '';
process.env.POSTGRES_PASSWORD = '';
process.env.POSTGRES_DB = 'postgres';
process.env.POSTGRES_PORT = '5432';

import * as Config from '@unconventional-jackson/gently-common-service/dist/config';

jest.spyOn(Config, 'getConfig').mockImplementation(async () =>
  Promise.resolve({
    AWS_REGION: 'test',
    ENV: 'test',
    CLIENT: 'test',
    SERVICE: 'test',
    POSTGRES_HOST: 'localhost',
    POSTGRES_USER: '',
    POSTGRES_PASSWORD: '',
    POSTGRES_DB: 'postgres',
    POSTGRES_PORT: 5432,
    APPLICATION_PORT: 4000,
    SENDGRID_API_KEY: 'sg.test',
    SENDGRID_SOURCE_EMAIL_ADDRESS: 'test@unconventionalcode.com',
    ACCESS_TOKEN_SECRET: 'secret',
  })
);

/**
 * This part is simply necessary for TypeScript to compile this file.
 */
export {};
