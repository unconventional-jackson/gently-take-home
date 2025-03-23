import { NodeLogger } from '@unconventional-code/observability-sdk';
import { ProductId, ProductModel } from '@unconventional-jackson/gently-database-service';
import { ErrorResponse } from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';

interface DeleteProductRequestParams {
  product_id: string;
}

export async function deleteProduct(
  req: Request<DeleteProductRequestParams>,
  res: Response<void | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/deleteProduct',
  });

  try {
    if (!req.params.product_id) {
      res.status(400).json({
        error: 'product_id is required.',
      });
      return;
    }
    const product_id = req.params.product_id as ProductId;

    const product = await ProductModel.findByPk(product_id);
    if (!product) {
      res.status(404).json({
        error: 'Product not found',
      });
      return;
    }

    await product.destroy();

    res.status(200).send();
    return;
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: String(error) });
  }
}
