import { DataTypes, QueryInterface } from 'sequelize';

export = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'product_attribute_lookups',
        {
          product_attribute_lookup_id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            unique: true,
          },
          product_id: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
              model: 'products',
              key: 'product_id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          attribute_id: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
              model: 'attributes',
              key: 'attribute_id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          value_string: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          value_number: {
            type: DataTypes.DOUBLE,
            allowNull: true,
          },
          value_boolean: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
          },
          value_date: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
          created_by: {
            type: DataTypes.STRING,
            allowNull: true,
            references: {
              model: 'users',
              key: 'user_id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
          updated_by: {
            type: DataTypes.STRING,
            allowNull: true,
            references: {
              model: 'users',
              key: 'user_id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          deleted_at: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          deleted_by: {
            type: DataTypes.STRING,
            allowNull: true,
            references: {
              model: 'users',
              key: 'user_id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
        },
        {
          transaction,
        }
      );
    });
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('product_attribute_lookups', { transaction });
    });
  },
};
