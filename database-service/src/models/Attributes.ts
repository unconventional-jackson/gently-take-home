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

export type AttributeId = Tagged<string, 'AttributeId'>;

export const getAttributeId = () => uuidv4() as AttributeId;

// eslint-disable-next-line no-shadow
export enum AttributeType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
}

@Table({
  timestamps: true,
  freezeTableName: true,
  tableName: 'attributes',
})
export class AttributeModel extends EntityModel<AttributeModel> {
  @PrimaryKey
  @Attribute(DataTypes.STRING)
  @Unique
  @NotNull
  @Default(() => getAttributeId())
  declare attribute_id: CreationOptional<AttributeId>;

  @Attribute(DataTypes.STRING)
  @NotNull
  @Unique
  declare attribute_name: string;

  @Attribute(DataTypes.TEXT)
  @AllowNull
  declare attribute_description: string | null;

  @Attribute(DataTypes.ENUM(...Object.values(AttributeType)))
  @NotNull
  declare attribute_type: AttributeType;

  @Attribute(DataTypes.STRING)
  @NotNull
  @Unique
  declare short_code: string;

  @Attribute(DataTypes.BOOLEAN)
  @NotNull
  @Default(false)
  declare is_required: boolean;

  @HasMany(() => ProductAttributeLookupModel, {
    foreignKey: {
      name: 'attribute_id',
      allowNull: false,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    sourceKey: 'attribute_id',
    foreignKeyConstraints: true,
  })
  product_attribute_lookups: NonAttribute<ProductAttributeLookupModel[]>;
}

export type Attribute = Partial<InferAttributes<AttributeModel>> & {
  product_attribute_lookups?: ProductAttributeLookup[];
};
