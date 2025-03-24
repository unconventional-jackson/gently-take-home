import { Op } from '@sequelize/core';
import { NodeLogger } from '@unconventional-code/observability-sdk';
import { AttributeModel } from '@unconventional-jackson/gently-database-service';
import {
  ErrorResponse,
  GetAttributesResponse,
} from '@unconventional-jackson/gently-openapi-service';
import { Request, Response } from 'express';

type GetAttributesQuery = {
  limit?: number;
  offset?: number;
  search?: string;
};

export async function getAttributes(
  req: Request<unknown, unknown, unknown, GetAttributesQuery>,
  res: Response<GetAttributesResponse | ErrorResponse>
) {
  const log = new NodeLogger({
    correlation: res.locals.correlation,
    name: 'views/getAttributes',
  });

  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const search = req.query.search ? String(req.query.search) : undefined;
    const { rows, count } = await AttributeModel.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [['created_at', 'DESC']],
      ...(search
        ? {
            where: {
              attribute_name: {
                [Op.iLike]: `%${search}%`,
              },
            },
          }
        : {}),
    });

    res.status(200).json({
      items: rows.map((row) => {
        return {
          ...row.toJSON(),
          created_at: row.created_at?.toISOString(),
          updated_at: row.updated_at?.toISOString(),
        };
      }),
      count: count,
      limit: limit,
      offset: Math.min(offset + limit, count),
    });
  } catch (error) {
    log.error(error);
    res.status(500).json({ error: String(error) });
  }
}
