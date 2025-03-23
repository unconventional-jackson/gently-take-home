import { NodeLogger } from '@unconventional-code/observability-sdk';
import {
  AttributeId,
  AttributeModel,
  AttributeType,
  ProductAttributeLookupModel,
  ProductId,
  ProductModel,
} from '@unconventional-jackson/gently-database-service';
import {
  AddProductAttributeRequestBody,
  ErrorResponse,
  ProductAttributeLookup,
} from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';

import { getStringSafeAttributeValue } from '../utils/attributes';

type AddProductAttributeParams = {
  product_id: string;
  attribute_id: string;
};

export async function addProductAttribute(
  req: Request<AddProductAttributeParams, unknown, AddProductAttributeRequestBody>,
  res: Response<ProductAttributeLookup | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/addProductAttribute',
  });

  try {
    log.info('Received request to add product attribute');

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

    log.info('Creating product attribute lookup');
    let productAttributeLookup: ProductAttributeLookupModel | null = null;

    // Handle boolean attributes
    if (attributeDefinition.attribute_type === AttributeType.BOOLEAN) {
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
      productAttributeLookup = await ProductAttributeLookupModel.create({
        product_id,
        attribute_id: attributeDefinition.attribute_id,
        value_boolean: attributeBooleanValue,
      });
    }

    // Handle string attributes
    if (attributeDefinition.attribute_type === AttributeType.STRING) {
      productAttributeLookup = await ProductAttributeLookupModel.create({
        product_id,
        attribute_id: attributeDefinition.attribute_id,
        value_string: attribute_value,
      });
    }

    // Handle number attributes
    if (attributeDefinition.attribute_type === AttributeType.NUMBER) {
      if (isNaN(Number(attribute_value))) {
        res.status(400).json({
          error: 'Invalid number attribute value',
        });
        return;
      }

      productAttributeLookup = await ProductAttributeLookupModel.create({
        product_id,
        attribute_id: attributeDefinition.attribute_id,
        value_number: Number(attribute_value),
      });
    }

    // Handle date attributes
    if (attributeDefinition.attribute_type === AttributeType.DATE) {
      const date = new Date(attribute_value);
      if (isNaN(date.getTime())) {
        res.status(400).json({
          error: 'Invalid date attribute value',
        });
        return;
      }

      productAttributeLookup = await ProductAttributeLookupModel.create({
        product_id,
        attribute_id: attributeDefinition.attribute_id,
        value_date: new Date(attribute_value),
      });
    }

    if (!productAttributeLookup) {
      res.status(500).json({
        error: 'Failed to create product attribute lookup',
      });
      return;
    }

    const productAttributeLookupJson = productAttributeLookup.toJSON();
    const attributeJson = attributeDefinition.toJSON();

    // Ensure we wrap the correct metadata in the response
    res.status(201).json({
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
