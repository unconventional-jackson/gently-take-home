import { CreationOptional, DataTypes, InferAttributes, NonAttribute } from '@sequelize/core';
import {
  AllowNull,
  Attribute,
  Default,
  HasMany,
  NotNull,
  PrimaryKey,
  Table,
  Unique,
} from '@sequelize/core/decorators-legacy';
import { Tagged } from 'type-fest';
import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line import/no-cycle
import { ProductAttributeLookup, ProductAttributeLookupModel } from './ProductAttributeLookups';
import { EntityModel } from './types';

export type ProductId = Tagged<string, 'ProductId'>;

export const getProductId = () => uuidv4() as ProductId;

@Table({
  timestamps: true,
  freezeTableName: true,
  tableName: 'products',
})
export class ProductModel extends EntityModel<ProductModel> {
  @PrimaryKey
  @Attribute(DataTypes.STRING)
  @NotNull
  @Unique
  @Default(() => getProductId())
  declare product_id: CreationOptional<ProductId>;

  @Attribute(DataTypes.STRING)
  @NotNull
  @Unique
  declare product_name: string;

  @Attribute(DataTypes.TEXT)
  @AllowNull
  declare product_description: string | null;

  @HasMany(() => ProductAttributeLookupModel, {
    foreignKey: {
      name: 'product_id',
      allowNull: false,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    sourceKey: 'product_id',
    foreignKeyConstraints: true,
  })
  product_attribute_lookups: NonAttribute<ProductAttributeLookupModel[]>;

  toJSON(): Product {
    return super.toJSON();
  }
}

export type Product = Partial<InferAttributes<ProductModel>> & {
  product_attribute_lookups?: ProductAttributeLookup[];
};
