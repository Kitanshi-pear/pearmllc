module.exports = (sequelize, DataTypes) => {
    return sequelize.define("GoogleAdsDetail", {
      traffic_channel_id: DataTypes.INTEGER,
      conversion_id: DataTypes.STRING,
      ad_account_id: DataTypes.STRING,
    });
  };
  