/* eslint-disable @typescript-eslint/naming-convention */
import { NodeLogger } from '@unconventional-code/observability-sdk';
import { getConfig } from '@unconventional-jackson/gently-common-service';
import { hash } from 'bcrypt';
import { QueryInterface } from 'sequelize';
import * as speakeasy from 'speakeasy';

import { getDatabaseConnection } from '../connection';
import { ADMIN_USER_ID, UserModel } from '../models/Users';

process.env.LOGGING_SIMPLE_ENABLED = 'true';
const log = new NodeLogger({
  name: 'database/migrations',
});

export = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await getConfig();
      delete process.env.LOGGING_NEW_RELIC_ENABLED;
      delete process.env.LOGGING_CONSOLE_ENABLED;
      await getDatabaseConnection();
      const maybeAdminUser = await UserModel.findByPk(ADMIN_USER_ID);
      if (maybeAdminUser && maybeAdminUser.email === 'jackson.graves@me.com') {
        log.info('Admin user already exists');
        return;
      }

      // Get an explicit hash for the password
      const auth_password_hash = await hash('password', 10);

      const secret = speakeasy.generateSecret({ length: 20 });
      const auth_totp_secret = secret.ascii;
      log.info('Creating admin user');

      // Insert the administrative user
      await queryInterface.sequelize.query(
        `INSERT INTO users (
          user_id,
          email,
          last_active_at,
          auth_email_verified,
          auth_password_hash,
          auth_refresh_token,
          auth_totp_secret,
          auth_totp_verified_at,
          created_at,
          updated_at
        )
        VALUES (
          ${ADMIN_USER_ID},
          N'jackson.graves@me.com',
          NULL,
          true,
          N'${auth_password_hash}',
          NULL,
          N'${auth_totp_secret}',
          true,
          NULL,
          NOW(),
          NOW()
        );
      `,
        { transaction }
      );
    });
  },

  async down() {
    return Promise.resolve();
  },
};
