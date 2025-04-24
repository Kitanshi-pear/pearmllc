module.exports = (sequelize, DataTypes) => {
  const LpViews = sequelize.define('LpViews', {
    click_id: DataTypes.STRING,
    referrer: DataTypes.TEXT,
    timestamp: DataTypes.DATE
  });
  return LpViews;
};
