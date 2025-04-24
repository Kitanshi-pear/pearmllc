module.exports = (sequelize, DataTypes) => {
  const Lander = sequelize.define("Lander", {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    trackingDomain: {
      type: DataTypes.STRING,
      allowNull: true
    },
    clickUrl: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  // Associations
  Lander.associate = (models) => {
    // Lander has one Metrics (one-to-one relationship)
    Lander.hasOne(models.Metrics, { foreignKey: 'lander_id' });

    // Other associations (if any)
    Lander.belongsTo(models.Campaigns, { foreignKey: 'campaign_id' });
    Lander.belongsTo(models.Offer, { foreignKey: 'offer_id' });
    Lander.belongsTo(models.OfferSource, { foreignKey: 'offer_source_id' });
    Lander.belongsTo(models.TrafficChannel, { foreignKey: 'traffic_channel_id' });
  };

  return Lander;
};
