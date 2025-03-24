import { NodeLogger } from '@unconventional-code/observability-sdk';
import {
  AttributeId,
  AttributeModel,
  AttributeType,
  ProductAttributeLookupId,
  ProductAttributeLookupModel,
  ProductId,
  ProductModel,
} from '@unconventional-jackson/gently-database-service';
import {
  ErrorResponse,
  ProductAttributeLookup,
  UpdateProductAttributeRequestBody,
} from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';

import { getStringSafeAttributeValue } from '../utils/attributes';

type UpdateProductAttributeParams = {
  product_id: string;
  attribute_id: string;
  product_attribute_lookup_id: string;
};

export async function updateProductAttribute(
  req: Request<UpdateProductAttributeParams, unknown, UpdateProductAttributeRequestBody>,
  res: Response<ProductAttributeLookup | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/updateProductAttribute',
  });

  try {
    log.info('Received request to update product attribute');

    if (!req.params.product_id) {
      res.status(400).json({
        error: 'Missing product_id in the path',
      });
      return;
    }
    const product_id = req.params.product_id as ProductId;

    if (!req.params.attribute_id) {
      res.status(400).json({
        error: 'attribute_id is required.',
      });
      return;
    }
    const attribute_id = req.params.attribute_id as AttributeId;

    if (!req.params.product_attribute_lookup_id) {
      res.status(400).json({
        error: 'product_attribute_lookup_id is required.',
      });
      return;
    }
    const product_attribute_lookup_id = req.params
      .product_attribute_lookup_id as ProductAttributeLookupId;

    if (!req.body.attribute_value) {
      res.status(400).json({
        error: 'attribute_value is required.',
      });
      return;
    }
    const attribute_value = req.body.attribute_value;

    log.setContext({
      product_id,
      attribute_id,
      attribute_value,
    });

    // Valiidate the product exists
    log.info('Validating product exists');
    const product = await ProductModel.findByPk(product_id);
    if (!product) {
      res.status(404).json({
        error: 'Product not found',
      });
      return;
    }

    // Find the attribute definition
    log.info('Validating attribute definition exists');
    const attributeDefinition = await AttributeModel.findByPk(attribute_id);
    if (!attributeDefinition) {
      res.status(404).json({
        error: 'Attribute not found',
      });
      return;
    }

    // Validate the attribute is already associated with the product
    log.info('Validating attribute is already associated with the product');
    const productAttributeLookup = await ProductAttributeLookupModel.findByPk(
      product_attribute_lookup_id
    );
    if (!productAttributeLookup) {
      res.status(404).json({
        error: 'Product attribute lookup not found',
      });
      return;
    }

    // Handle boolean attributes
    if (attributeDefinition.attribute_type === AttributeType.BOOLEAN) {
      log.info('Validating and updating boolean attribute value');
      if (!['true', 'false'].includes(attribute_value)) {
        res.status(400).json({
          error: 'Invalid boolean attribute value',
        });
        return;
      }
      let attributeBooleanValue = false;
      if (attribute_value === 'true') {
        attributeBooleanValue = true;
      }
      await productAttributeLookup.update({
        value_boolean: attributeBooleanValue,
        value_string: null,
        value_number: null,
        value_date: null,
        updated_by: res.locals.user_id,
      });
    }

    // Handle string attributes
    if (attributeDefinition.attribute_type === AttributeType.STRING) {
      log.info('Validating and updating string attribute value');
      await productAttributeLookup.update({
        value_boolean: null,
        value_string: attribute_value,
        value_number: null,
        value_date: null,
        updated_by: res.locals.user_id,
      });
    }

    // Handle number attributes
    if (attributeDefinition.attribute_type === AttributeType.NUMBER) {
      log.info('Validating and updating number attribute value');
      if (isNaN(Number(attribute_value))) {
        res.status(400).json({
          error: 'Invalid number attribute value',
        });
        return;
      }

      await productAttributeLookup.update({
        value_boolean: null,
        value_string: null,
        value_number: Number(attribute_value),
        value_date: null,
        updated_by: res.locals.user_id,
      });
    }

    // Handle date attributes
    if (attributeDefinition.attribute_type === AttributeType.DATE) {
      log.info('Validating and updating date attribute value');
      const date = new Date(attribute_value);
      if (isNaN(date.getTime())) {
        res.status(400).json({
          error: 'Invalid date attribute value',
        });
        return;
      }

      await productAttributeLookup.update({
        value_boolean: null,
        value_string: null,
        value_number: null,
        value_date: new Date(attribute_value),
        updated_by: res.locals.user_id,
      });
    }

    const productAttributeLookupJson = productAttributeLookup.toJSON();
    const attributeJson = attributeDefinition.toJSON();

    log.info('Updated product attribute lookup');
    // Ensure we wrap the correct metadata in the response
    res.status(200).json({
      ...productAttributeLookupJson,
      attribute_value: getStringSafeAttributeValue({
        ...productAttributeLookupJson,
        attribute: attributeJson,
      }),
      attribute: {
        ...attributeJson,
        created_at: attributeJson.created_at?.toISOString(),
        updated_at: attributeJson.updated_at?.toISOString(),
      },
      created_at: productAttributeLookupJson.created_at?.toISOString(),
      updated_at: productAttributeLookupJson.updated_at?.toISOString(),
    });
    return;
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: String(error) });
  }
}
