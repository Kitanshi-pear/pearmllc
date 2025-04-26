'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Offers', 'url', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Offers', 'revenue', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn('Offers', 'country', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    await queryInterface.addColumn('Offers', 'postbackUrl', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Offers', 'url');
    await queryInterface.removeColumn('Offers', 'revenue');
    await queryInterface.removeColumn('Offers', 'country');
    await queryInterface.removeColumn('Offers', 'postbackUrl');
  }
};
