/* eslint-disable @typescript-eslint/naming-convention */
import { NodeLogger } from '@unconventional-code/observability-sdk';
import { DataTypes, QueryInterface } from 'sequelize';

process.env.LOGGING_SIMPLE_ENABLED = 'true';
const log = new NodeLogger({
  name: 'database/migrations',
});

export = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      try {
        const maybeTable = await queryInterface.describeTable('users');
        if (maybeTable) {
          log.info('Users table already exists');
          return;
        }
      } catch (error) {
        log.error(error);
      }
      log.info('Creating users table');
      await queryInterface.createTable(
        'users',
        {
          user_id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            unique: true,
          },
          email: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          last_active_at: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          auth_email_verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          auth_password_hash: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          auth_refresh_token: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          auth_totp_secret: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          auth_totp_verified_at: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          auth_totp_enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },

          // Entity fields - users table is a special case which does not allow for created_by, updated_by, deleted_by, deleted_at
          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
        },
        {
          transaction,
        }
      );
    });
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('users', { transaction });
    });
  },
};
