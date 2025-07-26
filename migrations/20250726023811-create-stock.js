'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      menuItemId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'menu_items',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      currentStock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      minimumStock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      maximumStock: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      unit: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pieces'
      },
      lastUpdated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      supplier: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
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
    await queryInterface.addIndex('stock', ['menuItemId']);
    await queryInterface.addIndex('stock', ['currentStock']);
    await queryInterface.addIndex('stock', ['minimumStock']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('stock');
  }
};