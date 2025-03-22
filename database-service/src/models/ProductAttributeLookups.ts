import { CreationOptional, DataTypes, InferAttributes, NonAttribute } from '@sequelize/core';
import {
  AllowNull,
  Attribute,
  BelongsTo,
  Default,
  NotNull,
  PrimaryKey,
  Table,
  Unique,
} from '@sequelize/core/decorators-legacy';
import { Tagged } from 'type-fest';
import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line import/no-cycle
import { Attribute as IAttribute, AttributeId, AttributeModel } from './Attributes';
// eslint-disable-next-line import/no-cycle
import { Product, ProductId, ProductModel } from './Products';
import { EntityModel } from './types';

export type ProductAttributeLookupId = Tagged<string, 'ProductAttributeLookupId'>;

export const getProductAttributeLookupId = () => uuidv4() as ProductAttributeLookupId;

@Table({
  timestamps: true,
  freezeTableName: true,
  tableName: 'product_attribute_lookups',
})
export class ProductAttributeLookupModel extends EntityModel<ProductAttributeLookupModel> {
  @PrimaryKey
  @Attribute(DataTypes.STRING)
  @Unique
  @Default(() => getProductAttributeLookupId())
  declare product_attribute_lookup_id: CreationOptional<ProductAttributeLookupId>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare product_id: ProductId;
  @BelongsTo(() => ProductModel, {
    foreignKey: {
      name: 'product_id',
      allowNull: false,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    targetKey: 'product_id',
    foreignKeyConstraints: true,
  })
  product: NonAttribute<ProductModel>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare attribute_id: AttributeId;
  @BelongsTo(() => AttributeModel, {
    foreignKey: {
      name: 'attribute_id',
      allowNull: false,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    targetKey: 'attribute_id',
    foreignKeyConstraints: true,
  })
  attribute: NonAttribute<AttributeModel>;

  @Attribute(DataTypes.TEXT)
  @AllowNull
  declare value_string: string | null;

  @Attribute(DataTypes.DOUBLE)
  @AllowNull
  declare value_number: number | null;

  @Attribute(DataTypes.BOOLEAN)
  @AllowNull
  declare value_boolean: boolean | null;

  @Attribute(DataTypes.DATE)
  @AllowNull
  declare value_date: Date | null;
}

export type ProductAttributeLookup = Partial<InferAttributes<ProductAttributeLookupModel>> & {
  product?: Product;
  attribute?: IAttribute;
};
