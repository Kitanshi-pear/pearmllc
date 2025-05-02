module.exports = (sequelize, DataTypes) => {
  const Domain = sequelize.define('Domain', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,       // <-- IMPORTANT
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'verifying', 'active', 'error'),
      allowNull: true,
      defaultValue: 'pending',
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    certificate_arn: {
      type: DataTypes.STRING(255),
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
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    reissue_only: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  }, {
    tableName: 'domains',
    timestamps: false,
  });

  return Domain;
};
