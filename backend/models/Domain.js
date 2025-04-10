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
    certificate_arn: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cname_acm_name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cname_acm_value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cloudfront_domain: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ssl_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
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
    timestamps: false,
  });

  return Domain;
};
