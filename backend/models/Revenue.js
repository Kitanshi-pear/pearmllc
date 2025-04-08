module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Revenue", {
    click_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    revenue_value: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
};
