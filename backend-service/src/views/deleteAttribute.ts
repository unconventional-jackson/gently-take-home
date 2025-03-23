import { NodeLogger } from '@unconventional-code/observability-sdk';
import { AttributeId, AttributeModel } from '@unconventional-jackson/gently-database-service';
import { ErrorResponse } from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';

type DeleteAttributeParams = {
  attribute_id: string;
};
export async function deleteAttribute(
  req: Request<DeleteAttributeParams>,
  res: Response<void | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/deleteAttribute',
  });

  try {
    log.info('Received request to delete attribute');

    if (!req.params.attribute_id) {
      res.status(400).json({
        error: 'Missing attribute_id in the path',
      });
      return;
    }
    const attribute_id = req.params.attribute_id as AttributeId;
    log.setContext({
      attribute_id,
    });

    // If we wanted to get creative we could use a transaction to ensure that the attribute is deleted safely
    log.info('Deleting attribute');
    const count = await AttributeModel.destroy({
      where: {
        attribute_id: req.params.attribute_id,
      },
    });

    if (count === 0) {
      res.status(404).json({
        error: 'Attribute not found',
      });
      return;
    }

    if (count > 1) {
      res.status(500).json({
        error: 'Multiple attributes deleted',
      });
      return;
    }

    log.info('Attribute deleted successfully');
    res.status(200).send();
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: String(error) });
  }
}
