import { DataTypes, QueryInterface } from 'sequelize';

export = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'products',
        {
          product_id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            unique: true,
          },
          product_name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
          },
          product_description: {
            type: DataTypes.TEXT,
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
      await queryInterface.dropTable('products', { transaction });
    });
  },
};
