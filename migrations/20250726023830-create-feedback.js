'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feedback', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('order', 'delivery', 'general', 'complaint', 'suggestion'),
        allowNull: false
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        }
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'reviewed', 'resolved', 'closed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      reviewedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      response: {
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
    await queryInterface.addIndex('feedback', ['userId']);
    await queryInterface.addIndex('feedback', ['type']);
    await queryInterface.addIndex('feedback', ['status']);
    await queryInterface.addIndex('feedback', ['rating']);
    await queryInterface.addIndex('feedback', ['isPublic']);
    await queryInterface.addIndex('feedback', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('feedback');
  }
};