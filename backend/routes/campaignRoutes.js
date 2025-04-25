const express = require("express");
const router = express.Router();
const { Campaigns, Domain, TrafficChannel, Lander, Offer } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Helper: Generate promoting URL
const getPromotingUrl = (domainStr, campaignUniqueId) => {
  return `${domainStr}/track?unique_id=${campaignUniqueId}`;
};

// GET /api/campaigns - Get all campaigns
router.get("/", async (req, res) => {
  try {
    const campaigns = await Campaigns.findAll({
      include: [
        { model: Domain, as: 'domain_id' },
        { model: TrafficChannel, as: 'traffic_channel_id' },
        { model: Lander, as: 'lander_id' },
        { model: Offer, as: 'offer_id' }
      ]
    });
    res.status(200).json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/campaigns - Create a campaign
router.post("/", async (req, res) => {
  try {
    const { 
      name, 
      traffic_channel_id, 
      domain_id, 
      lander_id,
      offer_id,
      isDirectLinking,
      costType,
      costValue,
      tags,
      offerWeight,
      autoOptimize,
      status
    } = req.body;

    console.log("Received campaign creation request:", req.body);

    // Check only essential fields
    if (!name || !traffic_channel_id || !domain_id) {
      return res.status(400).json({ error: "Missing required fields", required: "name, traffic_channel_id, domain_id" });
    }

    const domain = await Domain.findByPk(domain_id);
    if (!domain) return res.status(400).json({ error: "Invalid domain_id" });

    const trafficChannel = await TrafficChannel.findByPk(traffic_channel_id);
    if (!trafficChannel) return res.status(400).json({ error: "Invalid traffic_channel_id" });

    // Only check lander if not direct linking
    if (!isDirectLinking && lander_id) {
      const lander = await Lander.findByPk(lander_id);
      if (!lander) return res.status(400).json({ error: "Invalid lander_id" });
    }

    // Check offer if provided
    if (offer_id) {
      const offer = await Offer.findByPk(offer_id);
      if (!offer) return res.status(400).json({ error: "Invalid offer_id" });
    }

    const unique_id = uuidv4().split("-")[0];

    // Create campaign with all provided fields
    const campaign = await Campaigns.create({
      name,
      unique_id,
      traffic_channel_id,
      domain_id,
      lander_id: isDirectLinking ? null : lander_id,
      offer_id,
      costType: costType || "CPC",
      costValue: costValue || 0,
      tags: tags || [],
      offerWeight: offerWeight || 100,
      autoOptimize: autoOptimize || false,
      status: status || "ACTIVE",
      isDirectLinking: isDirectLinking || false
    });

    const promoting_url = getPromotingUrl(domain.url || domain.domain, campaign.unique_id);

    return res.status(201).json({
      ...campaign.toJSON(),
      promoting_url,
      domain,
      traffic_channel: trafficChannel
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// Add support for the singular endpoint as well
// This just redirects to the plural version
router.get("/campaign", (req, res) => {
  res.redirect("/api/campaigns");
});

router.post("/campaign", (req, res) => {
  // Forward the request to the plural endpoint handler
  router.handle(req, res);
});

// GET /api/campaigns/:id - Get a specific campaign
router.get("/:id", async (req, res) => {
  try {
    const campaign = await Campaigns.findByPk(req.params.id, {
      include: [
        { model: Domain, as: 'domain_id' },
        { model: TrafficChannel, as: 'traffic_channel_id' },
        { model: Lander, as: 'lander_id' },
        { model: Offer, as: 'offer_id' }
      ]
    });
    
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    
    res.status(200).json(campaign);
  } catch (error) {
    console.error(`Error fetching campaign ${req.params.id}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/campaigns/:id - Update a campaign
router.put("/:id", async (req, res) => {
  try {
    const campaign = await Campaigns.findByPk(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    
    await campaign.update(req.body);
    res.status(200).json(campaign);
  } catch (error) {
    console.error(`Error updating campaign ${req.params.id}:`, error);
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