module.exports = (sequelize, DataTypes) => {
  const Campaigns = sequelize.define("Campaigns", {
    name: DataTypes.STRING,
    unique_id: { type: DataTypes.STRING, unique: true }, // used in the tracking URL
    traffic_channel_id: DataTypes.INTEGER,
    domain_id: DataTypes.INTEGER,
    lander_id: DataTypes.INTEGER,
    offer_id: DataTypes.INTEGER,
    offer_source_id: DataTypes.INTEGER,
    // other fields...
  });

  Campaigns.associate = (models) => {
    Campaigns.belongsTo(models.TrafficChannel, { foreignKey: "traffic_channel_id" });
    Campaigns.belongsTo(models.Domain, { foreignKey: "domain_id" });
    Campaigns.belongsTo(models.Lander, { foreignKey: "lander_id" });
    Campaigns.belongsTo(models.Offer, { foreignKey: "offer_id" });
    Campaigns.belongsTo(models.OfferSource, { foreignKey: "offer_source_id" });
  };

  return Campaigns;
};
