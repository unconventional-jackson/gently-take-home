import { NodeLogger } from '@unconventional-code/observability-sdk';
import { getConfig } from '@unconventional-jackson/gently-common-service';
import { QueryInterface } from 'sequelize';

import { getDatabaseConnection } from '../connection';
import { ADMIN_USER_ID } from '../models';
import { ProductModel } from '../models/Products';

const log = new NodeLogger({ name: 'migrations' });

export = {
  async up() {
    try {
      await getConfig();
      await getDatabaseConnection();

      await ProductModel.create(
        {
          product_name: 'T-Shirt',
          product_description:
            'A t-shirt is a type of shirt with a round neckline, short sleeves, and a straight hem.',
          created_by: ADMIN_USER_ID,
          updated_by: ADMIN_USER_ID,
        },
        {
          ignoreDuplicates: true,
        }
      );

      await ProductModel.create(
        {
          product_name: 'Pants',
          product_description:
            'A pair of pants is a type of clothing with a waist and legs, typically made of fabric and worn on the lower body.',
          created_by: ADMIN_USER_ID,
          updated_by: ADMIN_USER_ID,
        },
        {
          ignoreDuplicates: true,
        }
      );
    } catch (error) {
      log.error(error);
      throw error;
    }
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('products', { transaction });
    });
  },
};
