// clickController.js
const { Click } = require('../models');
const { v4: uuidv4 } = require('uuid');

exports.trackClick = async (req, res) => {
  const clickId = uuidv4();
  const { campaign_id, source, referrer } = req.body;

  const click = await Click.create({
    click_id: clickId,
    campaigns_id: campaign_id,
    source_id: source,
    timestamp: new Date()
  });

  res.json({ click_id: click.click_id });
};


// clickController.js
exports.trackView = async (req, res) => {
    const { click_id, referrer } = req.query;
  
    console.log(`View registered for click: ${click_id}, ref: ${referrer}`);
    // Optionally log view in DB here
  
    res.sendStatus(200);
  };
  