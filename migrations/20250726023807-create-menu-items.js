'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('menu_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true
      },
      categoryId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      isAvailable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      preparationTime: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Preparation time in minutes'
      },
      ingredients: {
        type: Sequelize.JSON,
        allowNull: true
      },
      nutritionalInfo: {
        type: Sequelize.JSON,
        allowNull: true
      },
      allergens: {
        type: Sequelize.JSON,
        allowNull: true
      },
      isVegetarian: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isVegan: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isSpicy: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes
    await queryInterface.addIndex('menu_items', ['categoryId']);
    await queryInterface.addIndex('menu_items', ['isAvailable']);
    await queryInterface.addIndex('menu_items', ['price']);
    await queryInterface.addIndex('menu_items', ['isVegetarian']);
    await queryInterface.addIndex('menu_items', ['isVegan']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('menu_items');
  }
};