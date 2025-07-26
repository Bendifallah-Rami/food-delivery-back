'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      orderNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      customerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      orderType: {
        type: Sequelize.ENUM('delivery', 'pickup'),
        allowNull: false,
        defaultValue: 'delivery'
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      tax: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      deliveryFee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      deliveryAddressId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'user_addresses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      specialInstructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      estimatedDeliveryTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      actualDeliveryTime: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('orders', ['orderNumber'], { unique: true });
    await queryInterface.addIndex('orders', ['customerId']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['orderType']);
    await queryInterface.addIndex('orders', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
  }
};