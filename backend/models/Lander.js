module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Lander", {
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
};
