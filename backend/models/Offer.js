// models/Offer.js
module.exports = (sequelize, DataTypes) => {
    const Offer = sequelize.define('Offer', {
      Serial_No: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      Offer_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      offer_status: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      lp_clicks: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      clicks: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      conversion: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      total_cpa: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      epc: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      total_revenue: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      cost: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      profit: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      total_roi: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      lp_views: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      impressions: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    }, {
      tableName: 'Offers',
      timestamps: false // unless you're using createdAt/updatedAt
    });
  
    return Offer;
  };
  