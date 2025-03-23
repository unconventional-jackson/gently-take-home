import { Op } from '@sequelize/core';

export type Operator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'iLike' | 'is';

export const validOperators: Operator[] = [
  Op.eq.description as Operator, // eq
  Op.ne.description as Operator, // ne
  Op.gt.description as Operator, // gt
  Op.gte.description as Operator, // gte
  Op.lt.description as Operator, // lt
  Op.lte.description as Operator, // lte
  Op.like.description as Operator, // like
  Op.iLike.description as Operator, // ilike
  Op.is.description as Operator, // is
];
