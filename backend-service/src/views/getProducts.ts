import { Op } from '@sequelize/core';
import { NodeLogger } from '@unconventional-code/observability-sdk';
import {
  AttributeModel,
  AttributeType,
  ProductAttributeLookup,
  ProductAttributeLookupModel,
  ProductModel,
} from '@unconventional-jackson/gently-database-service';
import { ErrorResponse, GetProductsResponse } from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';

import { Operator, validOperators } from '../utils/operators';

type GetProductsQuery = {
  limit?: number;
  offset?: number;
  [key: string]: unknown;
};

export async function getProducts(
  req: Request<unknown, unknown, unknown, GetProductsQuery>,
  res: Response<GetProductsResponse | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/getProducts',
  });

  let limit = 10;
  if (req.query.limit) {
    if (isNaN(Number(req.query.limit))) {
      res.status(400).json({ error: 'limit must be a number if provided' });
      return;
    }
    limit = Number(req.query.limit);
  }

  let offset = 0;
  if (req.query.offset) {
    if (isNaN(Number(req.query.offset))) {
      res.status(400).json({ error: 'offset must be a number if provided' });
      return;
    }
    offset = Number(req.query.offset);
  }

  // Validate all short_code filter parameters are valid

  const attributeFilters: {
    field: string;
    operator: string;
    value: string;
  }[] = [];

  // Validate all short_code filter parameters are valid
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'limit' || key === 'offset') {
      continue;
    }

    const filter = key.split('_');
    if (filter.length !== 2) {
      res.status(400).json({ error: 'Invalid filter format' });
      return;
    }

    const [field, operator] = filter;

    if (!validOperators.includes(operator as Operator)) {
      res.status(400).json({ error: 'Invalid operator' });
      return;
    }

    if (typeof value !== 'string') {
      res.status(400).json({
        error: 'Value must be a string, duplicate short_code filter parameters are not allowed',
      });
      return;
    }

    attributeFilters.push({ field, operator, value });
  }

  // Isolate the unique short_codes we want to filter by
  const shortCodes = [...new Set(attributeFilters.map((filter) => filter.field))];
  log.info('Request is filtering by short_codes', { shortCodes });

  // Get the attributes for those short_codes
  let attributes: AttributeModel[] = [];
  if (shortCodes.length > 0) {
    attributes = await AttributeModel.findAll({
      where: {
        short_code: { [Op.in]: shortCodes },
      },
    });
  }
  log.info('Found attributes to filter products by', { count: attributes.length });

  type ProductLookupAttributeWithOperator = Required<Pick<ProductAttributeLookup, 'attribute_id'>> &
    Partial<
      Pick<ProductAttributeLookup, 'value_string' | 'value_boolean' | 'value_date' | 'value_number'>
    > & {
      operator: (typeof Op)[keyof typeof Op];
    };

  // Get the final, type-safe list of product-lookup attributes
  const productLookupAttributeWithOperators = attributeFilters.map(
    (filter): ProductLookupAttributeWithOperator => {
      const attribute = attributes.find((attr) => attr.short_code === filter.field);
      if (!attribute) {
        throw new Error(`Attribute ${filter.field} not found`);
      }

      const operator = Op[filter.operator as keyof typeof Op];
      if (!operator) {
        throw new Error(`Operator ${filter.operator} not found`);
      }

      if (attribute.attribute_type === AttributeType.STRING) {
        return {
          attribute_id: attribute.attribute_id,
          operator,
          value_string: filter.value,
        };
      }

      if (attribute.attribute_type === AttributeType.BOOLEAN) {
        if (filter.value !== 'true' && filter.value !== 'false') {
          throw new Error(`Invalid boolean value: ${filter.value}`);
        }

        return {
          attribute_id: attribute.attribute_id,
          operator,
          value_boolean: filter.value === 'true',
        };
      }

      if (attribute.attribute_type === AttributeType.DATE) {
        if (isNaN(new Date(filter.value).getTime())) {
          throw new Error(`Invalid date value: ${filter.value}`);
        }

        return {
          attribute_id: attribute.attribute_id,
          operator,
          value_date: new Date(filter.value),
        };
      }

      if (attribute.attribute_type === AttributeType.NUMBER) {
        if (isNaN(Number(filter.value))) {
          throw new Error(`Invalid number value: ${filter.value}`);
        }

        return {
          attribute_id: attribute.attribute_id,
          operator,
          value_number: Number(filter.value),
        };
      }

      throw new Error(`Unsupported attribute type: ${attribute.attribute_type}`);
    }
  );

  try {
    log.info('Fetching products');
    const { rows, count } = await ProductModel.findAndCountAll({
      include: productLookupAttributeWithOperators.length
        ? [
            {
              model: ProductAttributeLookupModel,
              where: {
                [Op.and]: productLookupAttributeWithOperators.map((attr) => ({
                  attribute_id: attr.attribute_id,
                  value_string:
                    'value_string' in attr ? { [attr.operator]: attr.value_string } : {},
                  value_boolean:
                    'value_boolean' in attr ? { [attr.operator]: attr.value_boolean } : {},
                  value_date: 'value_date' in attr ? { [attr.operator]: attr.value_date } : {},
                  value_number:
                    'value_number' in attr ? { [attr.operator]: attr.value_number } : {},
                })),
              },
            },
          ]
        : undefined,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      items: rows.map((product) => ({
        ...product.toJSON(),
        created_at: product.created_at?.toISOString(),
        updated_at: product.updated_at?.toISOString(),
      })),
      count,
      offset: Math.min(offset + limit, count),
      limit,
    });
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: String(error) });
  }
}
