import { NodeLogger } from '@unconventional-code/observability-sdk';
import {
  AttributeModel,
  Product as DatabaseProduct,
  ProductAttributeLookupModel,
  ProductModel,
} from '@unconventional-jackson/gently-database-service';
import { ErrorResponse, Product } from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';

import { getStringSafeAttributeValue } from '../utils/attributes';

type GetProductRequestParams = {
  product_id: string;
};

export async function getProduct(
  req: Request<GetProductRequestParams>,
  res: Response<Product | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/getProduct',
  });

  try {
    if (!req.params.product_id) {
      res.status(400).json({
        error: 'product_id is required.',
      });
      return;
    }

    const product = await ProductModel.findByPk(req.params.product_id, {
      include: [
        {
          model: ProductAttributeLookupModel,
          as: 'product_attribute_lookups',
          include: [
            {
              model: AttributeModel,
              as: 'attribute',
            },
          ],
        },
      ],
    });
    if (!product) {
      res.status(404).json({
        error: 'Product not found.',
      });
      return;
    }

    const productJson = product.toJSON() as DatabaseProduct;

    res.status(200).json({
      ...productJson,
      product_attribute_lookups: productJson.product_attribute_lookups?.map(
        (productAttributeLookupJson) => ({
          ...productAttributeLookupJson,
          attribute_value: getStringSafeAttributeValue({
            ...productAttributeLookupJson,
            attribute: productAttributeLookupJson?.attribute,
          }),
          attribute: {
            ...productAttributeLookupJson.attribute,
            created_at: productAttributeLookupJson?.attribute?.created_at?.toISOString(),
            updated_at: productAttributeLookupJson?.attribute?.updated_at?.toISOString(),
          },
          created_at: productAttributeLookupJson.created_at?.toISOString(),
          updated_at: productAttributeLookupJson.updated_at?.toISOString(),
        })
      ),
      created_at: productJson.created_at?.toISOString(),
      updated_at: productJson.updated_at?.toISOString(),
    });
    return;
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: String(error) });
  }
}
