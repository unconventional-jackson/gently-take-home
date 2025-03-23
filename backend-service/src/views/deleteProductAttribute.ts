import { NodeLogger } from '@unconventional-code/observability-sdk';
import {
  AttributeModel,
  ProductAttributeLookupModel,
  ProductModel,
} from '@unconventional-jackson/gently-database-service';
import { ErrorResponse } from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';

type DeleteProductAttributeParams = {
  product_id: string;
  attribute_id: string;
  product_attribute_lookup_id: string;
};
export async function deleteProductAttribute(
  req: Request<DeleteProductAttributeParams>,
  res: Response<void | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/deleteProductAttribute',
  });

  try {
    if (!req.params.product_id) {
      res.status(400).json({
        error: 'Missing product_id in the path',
      });
      return;
    }

    if (!req.params.attribute_id) {
      res.status(400).json({
        error: 'Missing attribute_id in the path',
      });
      return;
    }

    if (!req.params.product_attribute_lookup_id) {
      res.status(400).json({
        error: 'Missing product_attribute_lookup_id in the path',
      });
      return;
    }

    // This is mostly a sanity check for the correctness of the API / UI
    const product = await ProductModel.findByPk(req.params.product_id);
    if (!product) {
      res.status(404).json({
        error: 'Product not found',
      });
      return;
    }

    // This is mostly a sanity check for the correctness of the API / UI
    const attribute = await AttributeModel.findByPk(req.params.attribute_id);
    if (!attribute) {
      res.status(404).json({
        error: 'Attribute not found',
      });
      return;
    }

    // If we wanted to get creative we could use a transaction to ensure that the product attribute lookup is deleted safely
    const productAttributeLookup = await ProductAttributeLookupModel.findByPk(
      req.params.product_attribute_lookup_id
    );
    if (!productAttributeLookup) {
      res.status(404).json({
        error: 'Product attribute lookup not found',
      });
      return;
    }
    await productAttributeLookup.destroy();

    res.status(200).send();
    return;
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: String(error) });
  }
}
