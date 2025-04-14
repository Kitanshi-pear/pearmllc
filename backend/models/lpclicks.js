// models/LpClick.js
module.exports = (sequelize, DataTypes) => {
    const lpclick = sequelize.define('LpClick', {
      click_id: DataTypes.STRING,
      campaign_id: DataTypes.STRING,
      source_id: DataTypes.STRING,
      timestamp: DataTypes.DATE,
      user_agent: DataTypes.TEXT,
      url: DataTypes.TEXT,
      destination_url: DataTypes.TEXT,
      referrer: DataTypes.TEXT
    });
    return lpclick;
  };
  