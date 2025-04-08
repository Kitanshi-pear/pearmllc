module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Cost", {
    click_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cost_value: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
};
