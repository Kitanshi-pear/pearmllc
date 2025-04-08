module.exports = (sequelize, DataTypes) => {
    return sequelize.define("OfferSource", {
      name: { type: DataTypes.STRING, allowNull: false },
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
  };
  