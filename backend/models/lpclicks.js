module.exports = (sequelize, DataTypes) => {
  const LpViewLog = sequelize.define('lpclicks', {
    click_id: DataTypes.STRING,
    timestamp: DataTypes.DATE
  });
  return LpViewLog;
};
