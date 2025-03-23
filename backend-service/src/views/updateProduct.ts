import { ModelAttributes } from '@sequelize/core';
import { NodeLogger } from '@unconventional-code/observability-sdk';
import { ProductId, ProductModel } from '@unconventional-jackson/gently-database-service';
import {
  ErrorResponse,
  Product,
  UpdateProductRequestBody,
} from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';

interface UpdateProductRequestParams {
  product_id: string;
}

export async function updateProduct(
  req: Request<UpdateProductRequestParams, unknown, UpdateProductRequestBody>,
  res: Response<Product | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/updateProduct',
  });

  try {
    log.info('Received request to update product');

    if (!req.params.product_id) {
      res.status(400).json({
        error: 'product_id is required.',
      });
      return;
    }
    const product_id = req.params.product_id as ProductId;

    if (![req.body.product_name, req.body.product_description].some(Boolean)) {
      res.status(400).json({
        error: 'At least one of product_name or product_description is required.',
      });
      return;
    }
    log.setContext({
      product_id,
    });

    log.info('Validating product exists');
    const product = await ProductModel.findByPk(product_id);
    if (!product) {
      res.status(404).json({
        error: 'Product not found',
      });
      return;
    }

    log.info('Updating product');
    const updates: ModelAttributes<ProductModel> = {};

    if (req.body.product_name) {
      updates.product_name = req.body.product_name;
    }

    if (req.body.product_description) {
      updates.product_description = req.body.product_description;
    }

    await product.update(updates);

    res.status(200).json({
      ...product.toJSON(),
      created_at: product.created_at?.toISOString(),
      updated_at: product.updated_at?.toISOString(),
    });
    return;
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: String(error) });
  }
}
