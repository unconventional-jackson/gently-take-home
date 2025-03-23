import { NodeLogger } from '@unconventional-code/observability-sdk';
import { AttributeModel, AttributeType } from '@unconventional-jackson/gently-database-service';
import {
  CreateAttributeRequestBody,
  ErrorResponse,
  Product,
} from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';

export async function createAttribute(
  req: Request<unknown, unknown, CreateAttributeRequestBody>,
  res: Response<Product | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/createAttribute',
  });

  try {
    // attribute_name is required
    if (!req.body.attribute_name) {
      res.status(400).json({
        error: 'attribute_name is required.',
      });
      return;
    }

    // attribute_type is required
    if (
      !req.body.attribute_type ||
      !Object.values(AttributeType).includes(req.body.attribute_type as AttributeType)
    ) {
      res.status(400).json({
        error: 'attribute_type is required.',
      });
      return;
    }
    const attribute_type = req.body.attribute_type as AttributeType;

    // Short code must be 2-10 characters, alphanumeric, and lowercase, and start with a letter, otherwise it won't be a usable short code for URL query param filtering
    if (
      !req.body.short_code ||
      req.body.short_code.length < 2 ||
      req.body.short_code.length > 10 ||
      !/^[a-z0-9]+$/.test(req.body.short_code.toLowerCase()) ||
      !/^[a-z]/.test(req.body.short_code.toLowerCase())
    ) {
      res.status(400).json({
        error:
          'short_code is required, must be 2-10 characters, alphanumeric, and lowercase, and start with a letter.',
      });
      return;
    }

    // is_required must be a boolean
    if (typeof req.body.is_required !== 'boolean') {
      res.status(400).json({
        error: 'is_required is required.',
      });
      return;
    }

    // Create the attribute
    const createdAttribute = await AttributeModel.create({
      attribute_name: req.body.attribute_name,
      attribute_type: attribute_type,
      short_code: req.body.short_code,
      is_required: req.body.is_required,
      attribute_description: req.body.attribute_description || null,
    });

    res.status(201).json({
      ...createdAttribute.toJSON(),
      created_at: createdAttribute.created_at?.toISOString(),
      updated_at: createdAttribute.updated_at?.toISOString(),
    });
    return;
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: String(error) });
  }
}
