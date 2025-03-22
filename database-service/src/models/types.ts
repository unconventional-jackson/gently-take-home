import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from '@sequelize/core';
import { AllowNull, Attribute, BelongsTo, NotNull, Table } from '@sequelize/core/decorators-legacy';

// eslint-disable-next-line import/no-cycle
import { UserId, UserModel } from './Users';

export const pageSize = 50;

/**
 * Utility type for us to extend when interacting with DynamoDB types.
 */
@Table.Abstract
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class EntityModel<M extends EntityModel = any> extends Model<
  InferAttributes<M>,
  InferCreationAttributes<M>
> {
  /**
   * Created timestamp, ISO8601 format.
   */
  @Attribute(DataTypes.DATE)
  @NotNull
  declare created_at?: Date;

  /**
   * Who created the Entity.
   */
  @Attribute(DataTypes.STRING)
  @AllowNull
  declare created_by?: UserId | null;
  @BelongsTo(() => UserModel, {
    foreignKey: 'created_by',
    foreignKeyConstraints: true,
  })
  declare created_by_user?: NonAttribute<UserModel>;

  /**
   * Updated timestamp, ISO8601 format.
   */
  @Attribute(DataTypes.DATE)
  @NotNull
  declare updated_at?: Date;

  /**
   * Who updated the Entity.
   */
  @Attribute(DataTypes.STRING)
  @AllowNull
  declare updated_by?: UserId | null;
  @BelongsTo(() => UserModel, {
    foreignKey: 'updated_by',
    foreignKeyConstraints: true,
  })
  declare updated_by_user?: NonAttribute<UserModel>;

  /**
   * The timestamp the item was soft-deleted, ISO8601 format.
   */
  @Attribute(DataTypes.DATE)
  @AllowNull
  declare deleted_at?: Date | null;

  /**
   * Who soft-deleted the Entity.
   */
  @Attribute(DataTypes.STRING)
  @AllowNull
  declare deleted_by?: UserId | null;
  @BelongsTo(() => UserModel, {
    foreignKey: 'deleted_by',
    foreignKeyConstraints: true,
  })
  declare deleted_by_user?: NonAttribute<UserModel>;
}
