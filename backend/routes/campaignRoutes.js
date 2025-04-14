const express = require("express");
const router = express.Router();
const { Campaigns, Domain, TrafficChannel, ClickEvents } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Helper: determine if domain is local
const getPromotingUrl = (domainStr, campaignId, trafficChannel) => {
  const isLocal =
    domainStr.includes("localhost") ||
    domainStr.includes("127.0.0.1") ||
    domainStr.startsWith("192.168.") ||
    domainStr.startsWith("10.") ||
    domainStr.endsWith(".local");

  const protocol = isLocal ? "http" : "https";
  
  // Dynamic UTM parameters
  const dynamicParams = {
    utm_campaign: campaignId, // campaign id used in utm_campaign
    sub2: trafficChannel.keyword || "",   // Get keyword from TrafficChannel if available
    sub3: trafficChannel.matchtype || "",  // Get matchtype from TrafficChannel if available
    sub4: trafficChannel.adgroupid || "",  // Get adgroupid from TrafficChannel if available
    sub5: trafficChannel.creative || "",   // Get creative from TrafficChannel if available
    sub6: campaignId,  // Campaign ID in sub6
    sub7: trafficChannel.device || "",   // Device info (mobile/desktop) from TrafficChannel
    sub8: trafficChannel.adposition || "", // Ad position info from TrafficChannel
    sub9: trafficChannel.network || "", // Network info (Google, etc.) from TrafficChannel
    sub10: trafficChannel.placement || "", // Placement (Search/Display) info from TrafficChannel
    utm_source: trafficChannel.network || "Google",  // Default to Google if no network info
    wbraid: trafficChannel.wbraid || "", // Dynamic wbraid from TrafficChannel
    gbraid: trafficChannel.gbraid || "", // Dynamic gbraid from TrafficChannel
    ref_id: trafficChannel.gclid || "" // Google click ID (gclid) from TrafficChannel
  };

  return `${protocol}://${domainStr}/click?utm_campaign=${dynamicParams.utm_campaign}&sub2=${dynamicParams.sub2}&sub3=${dynamicParams.sub3}&sub4=${dynamicParams.sub4}&sub5=${dynamicParams.sub5}&sub6=${dynamicParams.sub6}&sub7=${dynamicParams.sub7}&sub8=${dynamicParams.sub8}&sub9=${dynamicParams.sub9}&sub10=${dynamicParams.sub10}&utm_source=${dynamicParams.utm_source}&wbraid=${dynamicParams.wbraid}&gbraid=${dynamicParams.gbraid}&ref_id=${dynamicParams.ref_id}`;
};

// Create Campaign
router.post("/", async (req, res) => {
  try {
    const { name, traffic_channel_id, domain_id } = req.body;

    // Validate required fields
    if (!name || !traffic_channel_id || !domain_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if domain exists
    const domain = await Domain.findByPk(domain_id);
    if (!domain) {
      return res.status(400).json({ error: "Invalid domain_id" });
    }

    // Check if traffic channel exists
    const trafficChannel = await TrafficChannel.findByPk(traffic_channel_id);
    if (!trafficChannel) {
      return res.status(400).json({ error: "Invalid traffic_channel_id" });
    }

    // Generate unique short ID for tracking
    const unique_id = uuidv4().split("-")[0];

    // Create campaign
    const campaign = await Campaigns.create({
      name,
      unique_id,
      traffic_channel_id,
      domain_id,
    });

    // Generate correct promoting URL
    const promoting_url = getPromotingUrl(domain.domain, campaign.id, trafficChannel);

    return res.status(201).json({
      ...campaign.toJSON(),
      promoting_url,
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get all campaigns
router.get("/", async (req, res) => {
  try {
    const campaigns = await Campaigns.findAll({
      include: [TrafficChannel, Domain],
    });

    const response = campaigns.map((campaign) => {
      const domainStr = campaign.Domain?.domain || "";
      const trafficChannel = campaign.TrafficChannel || {};
      const promoting_url = getPromotingUrl(domainStr, campaign.id, trafficChannel);

      return {
        ...campaign.toJSON(),
        promoting_url,
      };
    });

    return res.json(response);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Track Landing Page View
router.post("/track/view", async (req, res) => {
  try {
    const { click_id, campaign_id } = req.body;

    // If click_id is not passed, generate a new one
    const generatedClickId = click_id || uuidv4(); // Generate a new click_id if not provided

    if (!campaign_id) {
      return res.status(400).json({ error: "Missing campaign_id" });
    }

    // Create a new ClickEvent entry for tracking (optional)
    await ClickEvents.create({
      click_id: generatedClickId,
      campaign_id,
      event_type: "view", // This is a 'view' event
    });

    console.log(`Landing Page View Tracked: click_id=${generatedClickId}, campaign_id=${campaign_id}`);

    return res.status(200).json({
      success: true,
      message: "Landing page view tracked",
      click_id: generatedClickId,
    });
  } catch (error) {
    console.error("Error tracking LP view:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Track Landing Page Click
router.post("/track/click", async (req, res) => {
  try {
    const { click_id, campaign_id } = req.body;

    // If click_id is not passed, generate a new one
    const generatedClickId = click_id || uuidv4(); // Generate a new click_id if not provided

    if (!campaign_id) {
      return res.status(400).json({ error: "Missing campaign_id" });
    }

    // Create a new ClickEvent entry for tracking (optional)
    await ClickEvents.create({
      click_id: generatedClickId,
      campaign_id,
      event_type: "click", // This is a 'click' event
    });

    console.log(`Landing Page Click Tracked: click_id=${generatedClickId}, campaign_id=${campaign_id}`);

    return res.status(200).json({
      success: true,
      message: "Landing page click tracked",
      click_id: generatedClickId,
    });
  } catch (error) {
    console.error("Error tracking LP click:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
