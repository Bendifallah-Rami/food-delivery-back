'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('string', 'number', 'boolean', 'json'),
        allowNull: false,
        defaultValue: 'string'
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'general'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isPublic: {
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
    await queryInterface.addIndex('settings', ['key'], { unique: true });
    await queryInterface.addIndex('settings', ['category']);
    await queryInterface.addIndex('settings', ['isPublic']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('settings');
  }
};