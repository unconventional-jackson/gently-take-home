import { NodeLogger } from '@unconventional-code/observability-sdk';
import { ProductModel } from '@unconventional-jackson/gently-database-service';
import {
  CreateProductRequestBody,
  ErrorResponse,
  Product,
} from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';

export async function createProduct(
  req: Request<unknown, unknown, CreateProductRequestBody>,
  res: Response<Product | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/createProduct',
  });

  try {
    if (!req.body.product_name) {
      res.status(400).json({
        error: 'product_name is required.',
      });
      return;
    }

    const createdProduct = await ProductModel.create({
      product_name: req.body.product_name,
      product_description: req.body.product_description,
    });

    res.status(201).json({
      ...createdProduct.toJSON(),
      created_at: createdProduct.created_at?.toISOString(),
      updated_at: createdProduct.updated_at?.toISOString(),
    });
    return;
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: String(error) });
  }
}
