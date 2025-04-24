const fs = require('fs');
const path = require('path');
const { sequelize } = require('./db');

const db = {};
const DataTypes = require('sequelize').DataTypes;

fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const modelModule = require(path.join(__dirname, file));

    // Skip if modelModule is not a function
    if (typeof modelModule !== 'function') {
      console.warn(`⚠️ Skipped model file: ${file} (not a function export)`);
      return;
    }

    const model = modelModule(sequelize, DataTypes);
    db[model.name] = model;
  });

// Setup associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Setup all associations
const {
  Click, Cost, Revenue, Macro,
  Campaigns, Domain, Lander,
  Offer, OfferSource, TrafficChannel, PostbackLog,
  Metrics
} = db;

// Click Associations
Click.belongsTo(Campaigns);
Click.belongsTo(Domain);
Click.belongsTo(Lander);
Click.belongsTo(Offer);
Click.belongsTo(OfferSource);
Click.belongsTo(TrafficChannel);

Click.hasOne(Cost, { foreignKey: 'click_id' });
Click.hasOne(Revenue, { foreignKey: 'click_id' });
Click.hasMany(Macro, { foreignKey: 'click_id' });

// Cost and Revenue belong to Click
Cost.belongsTo(Click, { foreignKey: 'click_id' });
Revenue.belongsTo(Click, { foreignKey: 'click_id' });

// Metrics belong to Campaign
Metrics.belongsTo(Campaigns, { foreignKey: 'campaign_id' });

// Macros belong to TrafficChannel
Macro.belongsTo(TrafficChannel, { foreignKey: 'source_id' });

// Campaign Associations
Campaigns.hasOne(Metrics, { foreignKey: 'campaign_id' });


// Additional associations can be added for other models as needed

// Export the models and sequelize instance
db.Click = Click;
db.Cost = Cost;
db.Revenue = Revenue;
db.Macro = Macro;
db.Campaigns = Campaigns;
db.Domain = Domain;
db.Lander = Lander;
db.Offer = Offer;
db.OfferSource = OfferSource;
db.TrafficChannel = TrafficChannel;
db.PostbackLog = PostbackLog;
db.Metrics = Metrics;

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

module.exports = db;
