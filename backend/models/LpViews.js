// models/LpView.js
module.exports = (sequelize, DataTypes) => {
    const LpView = sequelize.define('LpView', {
      click_id: DataTypes.STRING,
      campaign_id: DataTypes.STRING,
      source_id: DataTypes.STRING,
      timestamp: DataTypes.DATE,
      user_agent: DataTypes.TEXT,
      url: DataTypes.TEXT,
      referrer: DataTypes.TEXT
    });
    return LpView;
  };
  