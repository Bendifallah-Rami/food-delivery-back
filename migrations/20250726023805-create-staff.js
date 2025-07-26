'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('staff', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      employeeId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      position: {
        type: Sequelize.ENUM('kitchen', 'delivery', 'manager'),
        allowNull: false
      },
      department: {
        type: Sequelize.STRING,
        allowNull: true
      },
      hireDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      salary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      workingHours: {
        type: Sequelize.JSON,
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
    await queryInterface.addIndex('staff', ['employeeId'], { unique: true });
    await queryInterface.addIndex('staff', ['position']);
    await queryInterface.addIndex('staff', ['isActive']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('staff');
  }
};