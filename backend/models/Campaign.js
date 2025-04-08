module.exports = (sequelize, DataTypes) => {
    return sequelize.define("Campaign", {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: DataTypes.STRING
    });
  };
  