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
        allowNull: false,
        references: {
          model: 'Clicks',
          key: 'click_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ...Object.fromEntries(
        Array.from({ length: 25 }, (_, i) => [`sub${i + 1}`, { type: Sequelize.STRING }])
      ),
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Macros');
  }
};
