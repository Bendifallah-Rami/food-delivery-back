'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('deliveries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      deliveryPersonId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'staff',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('assigned', 'picked_up', 'in_transit', 'delivered', 'failed'),
        allowNull: false,
        defaultValue: 'assigned'
      },
      estimatedDeliveryTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      actualDeliveryTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      deliveryFee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      distance: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Distance in kilometers'
      },
      deliveryNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      customerRating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        }
      },
      customerFeedback: {
        type: Sequelize.TEXT,
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
    await queryInterface.addIndex('deliveries', ['orderId']);
    await queryInterface.addIndex('deliveries', ['deliveryPersonId']);
    await queryInterface.addIndex('deliveries', ['status']);
    await queryInterface.addIndex('deliveries', ['estimatedDeliveryTime']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('deliveries');
  }
};