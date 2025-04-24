module.exports = (sequelize, DataTypes) => {
  const OfferSource = sequelize.define('OfferSource', {
    name: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    alias: DataTypes.STRING,
    postback_url: DataTypes.STRING,
    currency: DataTypes.STRING,
    offer_url: DataTypes.STRING,
    clickid: DataTypes.STRING,
    sum: DataTypes.STRING,
    parameter: DataTypes.STRING,
    token: DataTypes.STRING,
    description: DataTypes.STRING,
    role: DataTypes.STRING
  });

  // Associations
  OfferSource.associate = (models) => {
    // OfferSource has one Metrics (one-to-one relationship)
    OfferSource.hasOne(models.Metrics, { foreignKey: 'offer_source_id' });

    // Other associations can be added here
    // Example: OfferSource.belongsTo(models.TrafficChannel, { foreignKey: 'traffic_channel_id' });
  };

  return OfferSource;
};
