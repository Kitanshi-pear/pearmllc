module.exports = (sequelize, DataTypes) => {
  const Macro = sequelize.define('Macro', {
    click_id: {
      type: DataTypes.BIGINT,
      allowNull: true // required if ON DELETE SET NULL
    },
    traffic_channel_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    campaign_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    sub1: DataTypes.STRING,
    sub2: DataTypes.STRING,
    sub3: DataTypes.STRING,
    sub4: DataTypes.STRING,
    sub5: DataTypes.STRING,
    sub6: DataTypes.STRING,
    sub7: DataTypes.STRING,
    sub8: DataTypes.STRING,
    sub9: DataTypes.STRING,
    sub10: DataTypes.STRING,
    sub11: DataTypes.STRING,
    sub12: DataTypes.STRING,
    sub13: DataTypes.STRING,
    sub14: DataTypes.STRING,
    sub15: DataTypes.STRING,
    sub16: DataTypes.STRING,
    sub17: DataTypes.STRING,
    sub18: DataTypes.STRING,
    sub19: DataTypes.STRING,
    sub20: DataTypes.STRING,
    sub21: DataTypes.STRING,
    sub22: DataTypes.STRING,
    sub23: DataTypes.STRING,
  });

  Macro.associate = (models) => {
    Macro.belongsTo(models.Click, {
      foreignKey: 'click_id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    Macro.belongsTo(models.TrafficChannel, {
      foreignKey: 'traffic_channel_id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  return Macro;
};
