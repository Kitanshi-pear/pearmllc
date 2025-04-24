// models/Cost.js
module.exports = (sequelize, DataTypes) => {
  const Cost = sequelize.define('Cost', {
    click_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    metrics_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    }
  });

  Cost.associate = (models) => {
    Cost.belongsTo(models.Click, { foreignKey: 'click_id' });
    Cost.belongsTo(models.Metrics, { foreignKey: 'metrics_id', onDelete: 'SET NULL' });
  };

  return Cost;
};
