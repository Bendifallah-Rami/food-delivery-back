'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add email verification fields to users table
    await queryInterface.addColumn('users', 'emailVerificationToken', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'emailVerificationExpires', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add index for verification token
    await queryInterface.addIndex('users', ['emailVerificationToken']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove email verification fields
    await queryInterface.removeColumn('users', 'emailVerificationToken');
    await queryInterface.removeColumn('users', 'emailVerificationExpires');
  }
};
