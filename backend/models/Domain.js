module.exports = (sequelize, DataTypes) => {
  const Domain = sequelize.define('Domain', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'verifying', 'active', 'error'),
      defaultValue: 'pending',
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cname_acm_name: DataTypes.TEXT,
    cname_acm_value: DataTypes.TEXT,
    cloudfront_domain: DataTypes.TEXT,
    ssl_expiry: DataTypes.DATE,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    reissue_only: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'domains',
    timestamps: false
  });

  return Domain;
};
