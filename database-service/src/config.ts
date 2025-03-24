import { getConfig } from '@unconventional-jackson/gently-common-service';

/**
 * Returns the database config necessary for the Sequelize CLI to run migrations.
 */
export = async () => {
  if (!process.env.ENV) {
    throw new Error('ENV is not set');
  }

  if (process.env.ENV === 'local') {
    return {
      dialect: 'postgres',
      host: 'gently-database-service', // Due to local docker-compose networking setup
      port: 5432,
      username: 'local_user',
      password: 'YourStrong!Passw0rd',
      database: 'local_database',
      logging: false,
    };
  }

  const config = await getConfig();

  return {
    dialect: 'postgres',
    host: config.POSTGRES_HOST,
    port: config.POSTGRES_PORT,
    username: config.POSTGRES_USER,
    password: config.POSTGRES_PASSWORD,
    database: config.POSTGRES_DB,
    logging: false,
  };
};
