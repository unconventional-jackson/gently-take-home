import { getConfig } from '@unconventional-jackson/gently-common-service';
import { QueryInterface } from 'sequelize';

import { getDatabaseConnection } from '../connection';
import { ADMIN_USER_ID } from '../models';
import { AttributeModel, AttributeType } from '../models/Attributes';

export = {
  async up() {
    await getConfig();
    await getDatabaseConnection();

    await AttributeModel.create({
      attribute_name: 'Color',
      attribute_type: AttributeType.STRING,
      short_code: 'color',
      is_required: false,
      created_by: ADMIN_USER_ID,
      updated_by: ADMIN_USER_ID,
    });

    await AttributeModel.create({
      attribute_name: 'Size',
      attribute_type: AttributeType.STRING,
      short_code: 'size',
      is_required: false,
      created_by: ADMIN_USER_ID,
      updated_by: ADMIN_USER_ID,
    });

    await AttributeModel.create({
      attribute_name: 'Price',
      attribute_type: AttributeType.NUMBER,
      short_code: 'price',
      is_required: true,
      created_by: ADMIN_USER_ID,
      updated_by: ADMIN_USER_ID,
    });

    await AttributeModel.create({
      attribute_name: 'Order Date',
      attribute_type: AttributeType.DATE,
      short_code: 'orderdate',
      is_required: false,
      created_by: ADMIN_USER_ID,
      updated_by: ADMIN_USER_ID,
    });

    await AttributeModel.create({
      attribute_name: 'Order Number',
      attribute_type: AttributeType.STRING,
      short_code: 'ordernumber',
      is_required: false,
      created_by: ADMIN_USER_ID,
      updated_by: ADMIN_USER_ID,
    });

    await AttributeModel.create({
      attribute_name: 'Fulfilled',
      attribute_type: AttributeType.BOOLEAN,
      short_code: 'fulfilled',
      is_required: false,
      created_by: ADMIN_USER_ID,
      updated_by: ADMIN_USER_ID,
    });
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('attributes', { transaction });
    });
  },
};
