module.exports = (sequelize, DataTypes) => {
    const TrafficChannel = sequelize.define("TrafficChannel", {
      name: DataTypes.STRING,
      platform_type: DataTypes.STRING, // 'google', 'facebook', etc.
    });
  
    TrafficChannel.associate = (models) => {
      TrafficChannel.hasOne(models.FacebookDetail, { foreignKey: "traffic_channel_id" });
      TrafficChannel.hasOne(models.GoogleAdsDetail, { foreignKey: "traffic_channel_id" });
    };
  
    return TrafficChannel;
  };
  