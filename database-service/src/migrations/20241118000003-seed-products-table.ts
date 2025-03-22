import { getConfig } from '@unconventional-jackson/gently-common-service';
import { QueryInterface } from 'sequelize';

import { getDatabaseConnection } from '../connection';
import { ProductModel } from '../models/Products';

export = {
  async up() {
    await getConfig();
    await getDatabaseConnection();

    await ProductModel.create({
      product_name: 'T-Shirt',
      product_description:
        'A t-shirt is a type of shirt with a round neckline, short sleeves, and a straight hem.',
    });

    await ProductModel.create({
      product_name: 'T-Shirt',
      product_description:
        'A t-shirt is a type of shirt with a round neckline, short sleeves, and a straight hem.',
    });
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('employees', { transaction });
    });
  },
};
