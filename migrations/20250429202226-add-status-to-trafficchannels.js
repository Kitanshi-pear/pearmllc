'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('TrafficChannels', 'status', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'active'
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('TrafficChannels', 'status');
  }
};
