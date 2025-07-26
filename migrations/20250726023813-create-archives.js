'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('archives', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      entityType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entityId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      data: {
        type: Sequelize.JSON,
        allowNull: false
      },
      archivedBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      archivedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
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
    await queryInterface.addIndex('archives', ['entityType']);
    await queryInterface.addIndex('archives', ['entityId']);
    await queryInterface.addIndex('archives', ['archivedBy']);
    await queryInterface.addIndex('archives', ['archivedAt']);
    await queryInterface.addIndex('archives', ['entityType', 'entityId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('archives');
  }
};