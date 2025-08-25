'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the order_tracking table if it exists
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "order_tracking" CASCADE;');
    
    // Check if columns already exist before adding them
    const tableInfo = await queryInterface.describeTable('orders');
    
    // Add priority column if it doesn't exist
    if (!tableInfo.priority) {
      await queryInterface.addColumn('orders', 'priority', {
        type: Sequelize.ENUM('normal', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'normal'
      });
    }

    // Add driverId column if it doesn't exist
    if (!tableInfo.driverId) {
      await queryInterface.addColumn('orders', 'driverId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'staff',
          key: 'id'
        }
      });
    }

    // Add statusNotes column if it doesn't exist
    if (!tableInfo.statusNotes) {
      await queryInterface.addColumn('orders', 'statusNotes', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    // Add statusUpdatedBy column if it doesn't exist
    if (!tableInfo.statusUpdatedBy) {
      await queryInterface.addColumn('orders', 'statusUpdatedBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      });
    }

    // Add statusUpdatedAt column if it doesn't exist
    if (!tableInfo.statusUpdatedAt) {
      await queryInterface.addColumn('orders', 'statusUpdatedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    // Update status enum to include new statuses
    await queryInterface.changeColumn('orders', 'status', {
      type: Sequelize.ENUM('pending', 'confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove added columns
    await queryInterface.removeColumn('orders', 'priority');
    await queryInterface.removeColumn('orders', 'driverId');
    await queryInterface.removeColumn('orders', 'statusNotes');
    await queryInterface.removeColumn('orders', 'statusUpdatedBy');
    await queryInterface.removeColumn('orders', 'statusUpdatedAt');

    // Revert status enum to original values
    await queryInterface.changeColumn('orders', 'status', {
      type: Sequelize.ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    });
  }
};
