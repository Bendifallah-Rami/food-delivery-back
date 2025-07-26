'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      reportType: {
        type: Sequelize.ENUM('sales', 'orders', 'delivery', 'inventory', 'staff', 'customer'),
        allowNull: false
      },
      reportName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      parameters: {
        type: Sequelize.JSON,
        allowNull: true
      },
      data: {
        type: Sequelize.JSON,
        allowNull: false
      },
      generatedBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('generating', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'generating'
      },
      fileUrl: {
        type: Sequelize.STRING,
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
    await queryInterface.addIndex('reports', ['reportType']);
    await queryInterface.addIndex('reports', ['generatedBy']);
    await queryInterface.addIndex('reports', ['status']);
    await queryInterface.addIndex('reports', ['createdAt']);
    await queryInterface.addIndex('reports', ['startDate', 'endDate']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reports');
  }
};