module.exports = (sequelize, DataTypes) => {
  const Click = sequelize.define("Click", {
    click_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: DataTypes.STRING,
    url: DataTypes.STRING,
    referrer: DataTypes.STRING,
    source_id: DataTypes.INTEGER,
    traffic_channel_id: DataTypes.INTEGER,
    campaigns_id: DataTypes.INTEGER,
    domain_id: DataTypes.INTEGER,
    lander_id: DataTypes.INTEGER,
    offer_id: DataTypes.INTEGER,
    offer_source_id: DataTypes.INTEGER,
    timestamp: DataTypes.DATE
  });

  Click.associate = (models) => {
    Click.hasOne(models.Cost, { foreignKey: "click_id" });
    Click.hasOne(models.Revenue, { foreignKey: "click_id" });
    Click.hasOne(models.Macro, { foreignKey: "click_id" });

    Click.belongsTo(models.Campaigns, { foreignKey: "campaigns_id" });

    Click.belongsTo(models.TrafficChannel, { foreignKey: "traffic_channel_id" });
    Click.belongsTo(models.Domain, { foreignKey: "domain_id" });
    Click.belongsTo(models.Lander, { foreignKey: "lander_id" });
    Click.belongsTo(models.Offer, { foreignKey: "offer_id" });
    Click.belongsTo(models.OfferSource, { foreignKey: "offer_source_id" });
  };

  return Click;
};
