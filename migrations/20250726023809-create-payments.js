'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
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
      paymentMethod: {
        type: Sequelize.ENUM('cash', 'card', 'digital_wallet', 'bank_transfer'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
      },
      transactionId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      paymentGateway: {
        type: Sequelize.STRING,
        allowNull: true
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      refundedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      refundAmount: {
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
    await queryInterface.addIndex('payments', ['orderId']);
    await queryInterface.addIndex('payments', ['status']);
    await queryInterface.addIndex('payments', ['paymentMethod']);
    await queryInterface.addIndex('payments', ['transactionId'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};