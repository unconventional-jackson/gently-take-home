import { getConfig } from '@unconventional-jackson/gently-common-service';

/**
 * Returns the database config necessary for the Sequelize CLI to run migrations.
 */
export = async () => {
  if (!process.env.ENV) {
    throw new Error('ENV is not set');
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
