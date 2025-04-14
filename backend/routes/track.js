// routes/lander.js or similar
const express = require("express");
const router = express.Router();
const { Click, Campaign } = require("../models");
const { v4: uuidv4 } = require("uuid");

router.get("/lander/track/view", async (req, res) => {
  try {
    const { campaign_id, click_id } = req.query;

    if (!campaign_id) {
      return res.status(400).json({ success: false, message: "campaign_id required" });
    }

    let newClickId = click_id || uuidv4();

    // Save new click (only if it's not already stored)
    await Click.create({
      click_id: newClickId,
      campaign_id,
      timestamp: new Date(),
      source_id: null // Or assign based on context
    });

    return res.json({ success: true, click_id: newClickId, campaign_id });
  } catch (err) {
    console.error("[lander/track/view] Error:", err);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
});

router.post("/track/click", async (req, res) => {
    try {
      const { click_id, campaign_id } = req.body;
      if (!click_id || !campaign_id) {
        return res.status(400).json({ success: false, message: "click_id and campaign_id required" });
      }
  
      // Optional: log to Redis, Kafka, ClickHouse, or just console
      console.log(`[CTA Click] Click ID: ${click_id}, Campaign ID: ${campaign_id}`);
  
      // You can also log this to a table like `click_ctas` if needed
  
      return res.json({ success: true });
    } catch (err) {
      console.error("[track/click] Error:", err);
      return res.status(500).json({ success: false, message: "Internal error" });
    }
  });
  

module.exports = router;
