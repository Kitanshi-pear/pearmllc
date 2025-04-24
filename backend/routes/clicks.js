// routes/click.js

const express = require("express");
const router = express.Router();
const { Campaign, Lander } = require("../models"); // Adjust based on your Sequelize models

router.get("/click", async (req, res) => {
  try {
    const { utm_campaign } = req.query;

    if (!utm_campaign) {
      return res.status(400).send("Missing utm_campaign");
    }

    const campaign = await Campaign.findByPk(utm_campaign);

    if (!campaign) {
      return res.status(404).send("Campaign not found");
    }

    // Optional: Log the click (before redirecting)
    console.log(`[Click] Campaign ID: ${utm_campaign} | IP: ${req.ip}`);

    // Find associated lander
    const lander = await Lander.findByPk(campaign.lander_id); // assuming campaign has lander_id

    if (!lander) {
      return res.status(404).send("Lander not found for this campaign");
    }

    const redirectUrl = lander.url;

    // Optional: Append query params to redirect
    const redirectWithParams = new URL(redirectUrl);
    redirectWithParams.searchParams.set("campaign_id", utm_campaign);

    return res.redirect(302, redirectWithParams.toString());
  } catch (err) {
    console.error("[/click] Error:", err);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
