'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // WARNING: This will DROP ALL DATA!
    // Only use in development environment
    
    // Step 1: Drop all foreign key constraints
    await queryInterface.removeConstraint('order_items', 'order_items_orderId_fkey');
    await queryInterface.removeConstraint('order_items', 'order_items_menuItemId_fkey');
    await queryInterface.removeConstraint('orders', 'orders_customerId_fkey');
    await queryInterface.removeConstraint('orders', 'orders_deliveryAddressId_fkey');
    await queryInterface.removeConstraint('payments', 'payments_orderId_fkey');
    await queryInterface.removeConstraint('deliveries', 'deliveries_orderId_fkey');
    await queryInterface.removeConstraint('deliveries', 'deliveries_deliveryPersonId_fkey');
    await queryInterface.removeConstraint('staff', 'staff_userId_fkey');
    await queryInterface.removeConstraint('user_addresses', 'user_addresses_userId_fkey');
    await queryInterface.removeConstraint('notifications', 'notifications_userId_fkey');
    await queryInterface.removeConstraint('feedback', 'feedback_userId_fkey');
    await queryInterface.removeConstraint('feedback', 'feedback_reviewedBy_fkey');
    await queryInterface.removeConstraint('stock', 'stock_menuItemId_fkey');
    await queryInterface.removeConstraint('menu_items', 'menu_items_categoryId_fkey');
    
    // Step 2: Truncate all tables (DELETES ALL DATA!)
    await queryInterface.bulkDelete('order_items', null, {});
    await queryInterface.bulkDelete('payments', null, {});
    await queryInterface.bulkDelete('deliveries', null, {});
    await queryInterface.bulkDelete('orders', null, {});
    await queryInterface.bulkDelete('staff', null, {});
    await queryInterface.bulkDelete('user_addresses', null, {});
    await queryInterface.bulkDelete('notifications', null, {});
    await queryInterface.bulkDelete('feedback', null, {});
    await queryInterface.bulkDelete('stock', null, {});
    await queryInterface.bulkDelete('menu_items', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('users', null, {});
    
    // Step 3: Change primary key columns to INTEGER
    await queryInterface.changeColumn('users', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    });
    
    await queryInterface.changeColumn('categories', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    });
    
    await queryInterface.changeColumn('menu_items', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    });
    
    await queryInterface.changeColumn('orders', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    });
    
    await queryInterface.changeColumn('order_items', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    });
    
    await queryInterface.changeColumn('user_addresses', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    });
    
    await queryInterface.changeColumn('payments', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    });
    
    await queryInterface.changeColumn('deliveries', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    });
    
    await queryInterface.changeColumn('staff', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    });
    
    await queryInterface.changeColumn('feedback', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    });
    
    await queryInterface.changeColumn('notifications', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    });
    
    await queryInterface.changeColumn('stock', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    });
    
    // Step 4: Change foreign key columns to INTEGER
    await queryInterface.changeColumn('menu_items', 'categoryId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    
    await queryInterface.changeColumn('orders', 'customerId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    
    await queryInterface.changeColumn('orders', 'deliveryAddressId', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    
    await queryInterface.changeColumn('order_items', 'orderId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    
    await queryInterface.changeColumn('order_items', 'menuItemId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    
    await queryInterface.changeColumn('user_addresses', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    
    await queryInterface.changeColumn('payments', 'orderId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    
    await queryInterface.changeColumn('deliveries', 'orderId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    
    await queryInterface.changeColumn('deliveries', 'deliveryPersonId', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    
    await queryInterface.changeColumn('staff', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    
    await queryInterface.changeColumn('feedback', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    
    await queryInterface.changeColumn('feedback', 'reviewedBy', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    
    await queryInterface.changeColumn('notifications', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    
    await queryInterface.changeColumn('stock', 'menuItemId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    
    // Step 5: Re-add foreign key constraints
    await queryInterface.addConstraint('menu_items', {
      fields: ['categoryId'],
      type: 'foreign key',
      name: 'menu_items_categoryId_fkey',
      references: {
        table: 'categories',
        field: 'id'
      }
    });
    
    await queryInterface.addConstraint('orders', {
      fields: ['customerId'],
      type: 'foreign key',
      name: 'orders_customerId_fkey',
      references: {
        table: 'users',
        field: 'id'
      }
    });
    
    await queryInterface.addConstraint('orders', {
      fields: ['deliveryAddressId'],
      type: 'foreign key',
      name: 'orders_deliveryAddressId_fkey',
      references: {
        table: 'user_addresses',
        field: 'id'
      }
    });
    
    await queryInterface.addConstraint('order_items', {
      fields: ['orderId'],
      type: 'foreign key',
      name: 'order_items_orderId_fkey',
      references: {
        table: 'orders',
        field: 'id'
      }
    });
    
    await queryInterface.addConstraint('order_items', {
      fields: ['menuItemId'],
      type: 'foreign key',
      name: 'order_items_menuItemId_fkey',
      references: {
        table: 'menu_items',
        field: 'id'
      }
    });
    
    await queryInterface.addConstraint('user_addresses', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'user_addresses_userId_fkey',
      references: {
        table: 'users',
        field: 'id'
      }
    });
    
    await queryInterface.addConstraint('payments', {
      fields: ['orderId'],
      type: 'foreign key',
      name: 'payments_orderId_fkey',
      references: {
        table: 'orders',
        field: 'id'
      }
    });
    
    await queryInterface.addConstraint('deliveries', {
      fields: ['orderId'],
      type: 'foreign key',
      name: 'deliveries_orderId_fkey',
      references: {
        table: 'orders',
        field: 'id'
      }
    });
    
    await queryInterface.addConstraint('deliveries', {
      fields: ['deliveryPersonId'],
      type: 'foreign key',
      name: 'deliveries_deliveryPersonId_fkey',
      references: {
        table: 'staff',
        field: 'id'
      }
    });
    
    await queryInterface.addConstraint('staff', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'staff_userId_fkey',
      references: {
        table: 'users',
        field: 'id'
      }
    });
    
    await queryInterface.addConstraint('feedback', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'feedback_userId_fkey',
      references: {
        table: 'users',
        field: 'id'
      }
    });
    
    await queryInterface.addConstraint('feedback', {
      fields: ['reviewedBy'],
      type: 'foreign key',
      name: 'feedback_reviewedBy_fkey',
      references: {
        table: 'users',
        field: 'id'
      }
    });
    
    await queryInterface.addConstraint('notifications', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'notifications_userId_fkey',
      references: {
        table: 'users',
        field: 'id'
      }
    });
    
    await queryInterface.addConstraint('stock', {
      fields: ['menuItemId'],
      type: 'foreign key',
      name: 'stock_menuItemId_fkey',
      references: {
        table: 'menu_items',
        field: 'id'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    // This would reverse the changes back to UUID
    // Implementation would be similar but in reverse
    throw new Error('This migration cannot be reversed safely');
  }
};
