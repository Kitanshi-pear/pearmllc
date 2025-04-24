module.exports = (sequelize, DataTypes) => {
  const Offer = sequelize.define('Offer', {
    Serial_No: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    Offer_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    offer_status: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
  }, {
    tableName: 'Offers',
    timestamps: false // unless you're using createdAt/updatedAt
  });

  // Associations
  Offer.associate = (models) => {
    // Offer has one Metrics (one-to-one relationship)
    Offer.hasOne(models.Metrics, { foreignKey: 'offer_id' });

    // Other associations
    Offer.belongsTo(models.Campaigns, { foreignKey: 'campaign_id' });
    Offer.belongsTo(models.OfferSource, { foreignKey: 'offer_source_id' });
    Offer.belongsTo(models.TrafficChannel, { foreignKey: 'traffic_channel_id' });
  };

  return Offer;
};
