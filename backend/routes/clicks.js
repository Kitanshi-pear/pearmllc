const express = require("express");
const router = express.Router();
const { Campaign, Lander } = require("../models"); // Adjust based on your Sequelize models

// Changed from "/click" to just "/" since the router is mounted at '/api/clicks'
router.get("/", async (req, res) => {
  try {
    const { utm_campaign } = req.query;

    console.log(`[Click API] Received request with utm_campaign: ${utm_campaign}`);

    if (!utm_campaign) {
      console.log("[Click API] Missing utm_campaign parameter");
      return res.status(400).send("Missing utm_campaign");
    }

    console.log(`[Click API] Looking up campaign ID: ${utm_campaign}`);
    const campaign = await Campaign.findByPk(utm_campaign);

    if (!campaign) {
      console.log(`[Click API] Campaign not found: ${utm_campaign}`);
      return res.status(404).send("Campaign not found");
    }

    // Log the click (before redirecting)
    console.log(`[Click API] Campaign found - ID: ${utm_campaign} | IP: ${req.ip}`);

    // Find associated lander
    console.log(`[Click API] Looking up lander ID: ${campaign.lander_id}`);
    const lander = await Lander.findByPk(campaign.lander_id); // assuming campaign has lander_id

    if (!lander) {
      console.log(`[Click API] Lander not found for campaign: ${utm_campaign}`);
      return res.status(404).send("Lander not found for this campaign");
    }

    const redirectUrl = lander.url;
    console.log(`[Click API] Will redirect to: ${redirectUrl}`);

    // Append query params to redirect
    const redirectWithParams = new URL(redirectUrl);
    redirectWithParams.searchParams.set("campaign_id", utm_campaign);
    
    console.log(`[Click API] Final redirect URL: ${redirectWithParams.toString()}`);
    return res.redirect(302, redirectWithParams.toString());
  } catch (err) {
    console.error("[Click API] Error:", err);
    return res.status(500).send("Internal Server Error");
  }
});

console.log("Click routes initialized and exported");
module.exports = router;