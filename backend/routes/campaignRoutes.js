const express = require("express");
const router = express.Router();
const { Campaigns, Domain, TrafficChannel, Lander } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Helper: Generate promoting URL
const getPromotingUrl = (domainStr, campaignUniqueId) => {
  return `${domainStr}/track?unique_id=${campaignUniqueId}`;
};

// POST /api/campaigns - Create a campaign
router.post("/", async (req, res) => {
  try {
    const { name, traffic_channel_id, domain_id, lander_id } = req.body;

    if (!name || !traffic_channel_id || !domain_id || !lander_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const domain = await Domain.findByPk(domain_id);
    if (!domain) return res.status(400).json({ error: "Invalid domain_id" });

    const trafficChannel = await TrafficChannel.findByPk(traffic_channel_id);
    if (!trafficChannel) return res.status(400).json({ error: "Invalid traffic_channel_id" });

    const lander = await Lander.findByPk(lander_id);
    if (!lander) return res.status(400).json({ error: "Invalid lander_id" });

    const unique_id = uuidv4().split("-")[0];

    const campaign = await Campaigns.create({
      name,
      unique_id,
      traffic_channel_id,
      domain_id,
      lander_id,
    });

    const promoting_url = getPromotingUrl(domain.domain, campaign.unique_id);

    return res.status(201).json({
      ...campaign.toJSON(),
      promoting_url,
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/campaigns - Fetch all campaigns without including any related data
router.get("/", async (req, res) => {
  try {
    const campaigns = await Campaigns.findAll(); // Fetch only campaigns data

    // Log the number of campaigns found
    console.log(`Found ${campaigns.length} campaigns`);

    // Return the campaigns data
    res.json(campaigns || []);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// GET /track?unique_id=abc123 → Redirect directly to lander URL
router.get("/track", async (req, res) => {
  try {
    const { unique_id } = req.query; // Extract unique_id from the query string

    if (!unique_id) {
      return res.status(400).send("Missing unique_id");
    }

    // Find the campaign by unique_id (same as campaign_id)
    const campaign = await Campaigns.findOne({
      where: { unique_id }, // Find campaign by unique_id (which is your campaign_id)
    });

    if (!campaign) {
      return res.status(404).send("Campaign not found");
    }

    // Find the lander associated with the campaign
    const lander = await Lander.findByPk(campaign.lander_id);
    if (!lander) {
      return res.status(404).send("Lander not found");
    }

    // Generate a unique click ID for this visit
    const clickId = uuidv4(); // Using uuid to generate a unique click ID

    // Construct the lander URL and pass the click_id and campaign_id in the query parameters
    const landerUrl = new URL(lander.url); // Assuming lander has a URL field
    landerUrl.searchParams.set("unique_id", unique_id); // Pass unique_id as campaign_id
    landerUrl.searchParams.set("click_id", clickId); // Add click_id to the URL
    console.log("Redirecting to lander URL:", landerUrl.toString());
    // Optional: Log the click (before redirecting)
    console.log(`[Click] Campaign ID: ${unique_id} | Click ID: ${clickId} | IP: ${req.ip}`);
    // Here you can also log the click to your database if needed
    // For example:
    // await Clicks.create({ click_id: clickId, campaign_id: unique_id, timestamp: new Date() });
    // You can also track the click in your database if needed  

    // Redirect the user to the lander URL with the parameters
    res.redirect(302, landerUrl.toString()); // 302 Temporary Redirect

  } catch (err) {
    console.error("Redirect error:", err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;