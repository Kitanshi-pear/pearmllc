module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('domains', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true, // or false if needed
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
  },
  down: async (queryInterface, Sequelize) => {
    // revert changes
  }
};
