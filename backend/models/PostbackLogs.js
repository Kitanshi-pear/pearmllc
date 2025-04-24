module.exports = (sequelize, DataTypes) => {
    const PostbackLog = sequelize.define('PostbackLog', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      clickid: DataTypes.STRING,
      sum: DataTypes.FLOAT,
      currency: DataTypes.STRING,
      source_id: DataTypes.INTEGER,
      raw_query: DataTypes.TEXT,
    }, {
      tableName: 'PostbackLogs',
      timestamps: true
    });
  
    return PostbackLog;
  };
  