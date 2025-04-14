module.exports = (sequelize, DataTypes) => {
  const Macro = sequelize.define("Macro", {
    click_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ...Object.fromEntries(
      Array.from({ length: 25 }, (_, i) => [`sub${i + 1}`, DataTypes.STRING])
    )
  });

  Macro.associate = (models) => {
    Macro.belongsTo(models.Click, { foreignKey: "click_id" });
  };

  return Macro;
};
