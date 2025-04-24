// models/Revenue.js
module.exports = (sequelize, DataTypes) => {
  const Revenue = sequelize.define('Revenue', {
    click_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    metrics_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    }
  });

  Revenue.associate = (models) => {
    Revenue.belongsTo(models.Click, { foreignKey: 'click_id' });
    Revenue.belongsTo(models.Metrics, { foreignKey: 'metrics_id', onDelete: 'SET NULL' });
  };

  return Revenue;
};
