module.exports = (sequelize, DataTypes) => {
    return sequelize.define("FacebookDetail", {
      traffic_channel_id: DataTypes.INTEGER,
      pixel_id: DataTypes.STRING,
      conversion_token: DataTypes.STRING,
      ad_account_id: DataTypes.STRING,
    });
  };
  