'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Macros', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      click_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ...Object.fromEntries(
        Array.from({ length: 25 }, (_, i) => [`sub${i + 1}`, { type: Sequelize.STRING }])
      ),
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Macros');
  }
};
