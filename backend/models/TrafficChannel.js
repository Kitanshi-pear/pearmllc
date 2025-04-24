module.exports = (sequelize, DataTypes) => {
  const TrafficChannel = sequelize.define("TrafficChannel", {
    name: DataTypes.STRING,
    platform_type: DataTypes.STRING, // 'google', 'facebook', etc.
    channelName: { type: DataTypes.STRING, allowNull: false },
    aliasChannel: { type: DataTypes.STRING, allowNull: true },
    costUpdateDepth: { type: DataTypes.STRING },
    costUpdateFrequency: { type: DataTypes.STRING },
    currency: { type: DataTypes.STRING },
    s2sPostbackUrl: { type: DataTypes.STRING },
    clickRefId: { type: DataTypes.STRING },
    externalId: { type: DataTypes.STRING },
    pixelId: { type: DataTypes.STRING },
    apiAccessToken: { type: DataTypes.STRING },
    defaultEventName: { type: DataTypes.STRING },
    customConversionMatching: { type: DataTypes.BOOLEAN },
    googleAdsAccountId: { type: DataTypes.STRING },
    googleMccAccountId: { type: DataTypes.STRING },
  });

  TrafficChannel.associate = (models) => {
    TrafficChannel.hasOne(models.FacebookDetail, { foreignKey: "traffic_channel_id" });
    TrafficChannel.hasOne(models.GoogleAdsDetail, { foreignKey: "traffic_channel_id" });
    TrafficChannel.hasOne(models.Metrics, { foreignKey: "traffic_channel_id" });
    TrafficChannel.hasMany(models.Campaigns, { foreignKey: "traffic_channel_id" });

    // Associations with other models
    TrafficChannel.hasMany(models.Macro, { foreignKey: "traffic_channel_id" });

  };

  return TrafficChannel;
};
