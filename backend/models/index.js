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
  Campaign, Domain, Lander,
  Offer, OfferSource, TrafficChannel, PostbackLog 
} = db;

// Click Associations
Click.belongsTo(Campaign);
Click.belongsTo(Domain);
Click.belongsTo(Lander);
Click.belongsTo(Offer);
Click.belongsTo(OfferSource);
Click.belongsTo(TrafficChannel);

Click.hasOne(Cost, { foreignKey: 'click_id' });
Click.hasOne(Revenue, { foreignKey: 'click_id' });
Click.hasMany(Macro, { foreignKey: 'click_id' });

// Macros belong to source (TrafficChannel)
Macro.belongsTo(TrafficChannel, { foreignKey: 'source_id' });

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

module.exports = db;
