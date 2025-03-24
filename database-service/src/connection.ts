import { Signer } from '@aws-sdk/rds-signer';
import { type Options, Sequelize } from '@sequelize/core';
import { PostgresDialect } from '@sequelize/postgres';
import { NodeLogger } from '@unconventional-code/observability-sdk';
import { getConfig } from '@unconventional-jackson/gently-common-service';

import { AttributeModel } from './models/Attributes';
import { ProductAttributeLookupModel } from './models/ProductAttributeLookups';
import { ProductModel } from './models/Products';
import { UserModel } from './models/Users';

const log = new NodeLogger({ name: 'database-service/connection' });

export const defaultPostgresConfig: Options<PostgresDialect> = {
  dialect: PostgresDialect,
  pool: {
    min: 1, // POSTGRES_MAX
    max: 2, // POSTGRES_MIN
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: true,
  },
  models: [AttributeModel, ProductAttributeLookupModel, ProductModel, UserModel],
};

interface GetDatabaseConfigOptions {
  readonly?: boolean;
  useProxy?: boolean;
  useRds?: boolean;
  isTestEnvironment?: boolean;
  isAcceptanceTestEnvironment?: boolean;
}
export async function getDatabaseConfig(args?: GetDatabaseConfigOptions) {
  try {
    // TODO: Figure out a better way to handle test environments
    if (
      process.env.JEST_WORKER_ID ||
      args?.isTestEnvironment ||
      args?.isAcceptanceTestEnvironment
    ) {
      return {
        ...defaultPostgresConfig,
        host: 'localhost',
        port: 5555,
        user: '',
        password: '',
        database: 'postgres',
      };
    }

    const config = await getConfig();
    let host = config.POSTGRES_HOST;
    if (args?.useProxy) {
      if (args?.readonly && config.POSTGRES_PROXY_READONLY_HOST) {
        host = config.POSTGRES_PROXY_READONLY_HOST;
      } else if (config.POSTGRES_PROXY_HOST) {
        host = config.POSTGRES_PROXY_HOST;
      }
    }

    // Set up an IAM token signer for the database connection so that we can use IAM + TLS to the Proxy
    const signer = new Signer({
      region: config.AWS_REGION,
      username: config.POSTGRES_USER,
      hostname: host,
      port: config.POSTGRES_PORT,
    });

    const sequelizeConfig: Options<PostgresDialect> = {
      ...defaultPostgresConfig,
      host,
      port: config.POSTGRES_PORT,
      user: config.POSTGRES_USER,
      password: config.POSTGRES_PASSWORD,
      database: config.POSTGRES_DB,
      logging: false,

      // TODO: This only works if we have explicitly configured the Postgres database to use SSL if we are managing it ourselves; it works out of the box and we MUST use SSL with RDS + Proxy
      ssl: false,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // dialectOptions: {
      //   ssl: {
      //     rejectUnauthorized: false,
      //   },
      // },
      hooks: {
        beforeConnect: async (plannedConfig) => {
          if (args?.useRds) {
            if (args?.readonly) {
              log.info('Re-authenticating read-only database connection');
            } else {
              log.info('Re-authenticating database connection');
            }
            plannedConfig.password = await signer.getAuthToken();
            log.info('Refreshed IAM token');
          }
        },
        afterConnect: () => {
          if (args?.useRds) {
            if (args?.readonly) {
              log.info('Read-only database connection authenticated');
            } else {
              log.info('Database connection authenticated');
            }
          }
        },
      },
    };

    return sequelizeConfig;
  } catch (error) {
    log.error(error);
    throw error;
  }
}

/**
 * For future reference, if using RDS + Proxy: IAM auth expires, so refresh it periodically
 * Don't make this query on EVERY call in a container, just every few minutes (but it'll happen on every call for Lambdas that get spun up)
 * https://github.com/sequelize/sequelize/issues/12507
 */
async function refreshConnectionIfNecessary(sequelize: Sequelize) {
  let canConnect = false;
  try {
    log.info('Checking connection to database');
    await sequelize.query('SELECT 1=1');
    canConnect = true;
  } catch (error) {
    log.error(error, { detail: 'Connection error while checking connectivity' });
    await sequelize.authenticate();
  }
  return canConnect;
}

let sequelize: Sequelize | null = null;

/**
 * Returns a singleton database connection, and refreshes auth if necessary.
 */
export async function getDatabaseConnection(args?: GetDatabaseConfigOptions) {
  if (!sequelize) {
    log.info('Establishing new database connection');
    const config = await getDatabaseConfig({ ...args });
    sequelize = new Sequelize({ ...defaultPostgresConfig, ...config });
    await sequelize.authenticate();
  }
  await refreshConnectionIfNecessary(sequelize);
  return sequelize;
}

let readOnlySequelize: Sequelize | null = null;

/**
 * Returns a singleton read-only database connection, and refreshes auth if necessary.
 */
export async function getReadOnlyDatabaseConnection(args?: GetDatabaseConfigOptions) {
  // check if the singleton has been established yet
  if (!readOnlySequelize) {
    log.info('Establishing new read-only database connection');
    const config = await getDatabaseConfig({ ...args, readonly: true });
    readOnlySequelize = new Sequelize({ ...defaultPostgresConfig, ...config });
    await readOnlySequelize.authenticate();
  }

  await refreshConnectionIfNecessary(readOnlySequelize);

  return readOnlySequelize;
}
