'use strict';
/** Make email/password required and email unique (the app already assumes this). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'email', { type: Sequelize.STRING, allowNull: false });
    await queryInterface.changeColumn('users', 'password', { type: Sequelize.STRING, allowNull: false });
    await queryInterface.addConstraint('users', {
      fields: ['email'],
      type: 'unique',
      name: 'users_email_unique',
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('users', 'users_email_unique');
    await queryInterface.changeColumn('users', 'password', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.changeColumn('users', 'email', { type: Sequelize.STRING, allowNull: true });
  },
};
