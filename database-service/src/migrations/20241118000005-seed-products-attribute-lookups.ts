import { faker } from '@faker-js/faker';
import { NodeLogger } from '@unconventional-code/observability-sdk';
import { getConfig } from '@unconventional-jackson/gently-common-service';
import { QueryInterface } from 'sequelize';

import { getDatabaseConnection } from '../connection';
import {
  ADMIN_USER_ID,
  AttributeModel,
  AttributeType,
  ProductAttributeLookupModel,
} from '../models';
import { ProductModel } from '../models/Products';

const log = new NodeLogger({ name: 'migrations' });

export = {
  async up() {
    try {
      await getConfig();
      await getDatabaseConnection();

      const products = await ProductModel.findAll();
      const attributes = await AttributeModel.findAll();

      for (const product of products) {
        for (const attribute of attributes) {
          const randomNumberOfAttributes = Math.floor(Math.random() * 5) + 1;
          for (let i = 0; i < randomNumberOfAttributes; i++) {
            if (attribute.attribute_type === AttributeType.STRING) {
              await ProductAttributeLookupModel.create({
                product_id: product.product_id,
                attribute_id: attribute.attribute_id,
                value_string: faker.lorem.word(),
                created_by: ADMIN_USER_ID,
                updated_by: ADMIN_USER_ID,
              });
            }
            if (attribute.attribute_type === AttributeType.NUMBER) {
              await ProductAttributeLookupModel.create({
                product_id: product.product_id,
                attribute_id: attribute.attribute_id,
                value_number: faker.number.int(),
                created_by: ADMIN_USER_ID,
                updated_by: ADMIN_USER_ID,
              });
            }
            if (attribute.attribute_type === AttributeType.BOOLEAN) {
              await ProductAttributeLookupModel.create({
                product_id: product.product_id,
                attribute_id: attribute.attribute_id,
                value_boolean: faker.datatype.boolean(),
                created_by: ADMIN_USER_ID,
                updated_by: ADMIN_USER_ID,
              });
            }
            if (attribute.attribute_type === AttributeType.DATE) {
              await ProductAttributeLookupModel.create({
                product_id: product.product_id,
                attribute_id: attribute.attribute_id,
                value_date: faker.date.recent(),
                created_by: ADMIN_USER_ID,
                updated_by: ADMIN_USER_ID,
              });
            }
          }
        }
      }
    } catch (error) {
      log.error(error);
      throw error;
    }
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.sequelize.transaction(async () => {
      await ProductAttributeLookupModel.destroy({ where: {} });
    });
  },
};
