// models/Metrics.js
module.exports = (sequelize, DataTypes) => {
  const Metrics = sequelize.define('Metrics', {
    // Add date and hour fields - these are needed but missing in your model
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    hour: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    impressions: DataTypes.INTEGER,
    clicks: DataTypes.INTEGER,
    ctc: DataTypes.FLOAT,     // cost to conversion
    cpm: DataTypes.FLOAT,     // cost per thousand impressions
    cpc: DataTypes.FLOAT,     // cost per click
    ctr: DataTypes.FLOAT,     // click-through rate
    lpclicks: DataTypes.INTEGER,
    lpviews: DataTypes.INTEGER,
    conversions: DataTypes.INTEGER,
    cr: DataTypes.FLOAT,      // conversion rate
    total_revenue: DataTypes.FLOAT,
    total_cost: DataTypes.FLOAT,
    profit: DataTypes.FLOAT,
    roi: DataTypes.FLOAT,     // return on investment
    total_roi: DataTypes.FLOAT, // total return on investment
    total_cpa: DataTypes.FLOAT, // total cost per acquisition
    offer_cr: DataTypes.FLOAT, // conversion rate
    epc: DataTypes.FLOAT,      // earnings per click
    lpepc: DataTypes.FLOAT,    // landing page EPC
    lpctr: DataTypes.FLOAT     // landing page click-through rate
  });

  Metrics.associate = (models) => {
    Metrics.hasOne(models.Cost, { foreignKey: 'metrics_id' });
    Metrics.hasOne(models.Revenue, { foreignKey: 'metrics_id' });
    Metrics.belongsTo(models.Campaigns, { foreignKey: 'campaign_id' });
    Metrics.belongsTo(models.TrafficChannel, { foreignKey: 'traffic_channel_id' });
    Metrics.belongsTo(models.Lander, { foreignKey: 'lander_id' });
    Metrics.belongsTo(models.Offer, { foreignKey: 'offer_id' });
    Metrics.belongsTo(models.OfferSource, { foreignKey: 'offer_source_id' });
  };

  return Metrics;
};