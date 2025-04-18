const express = require("express");
const router = express.Router();
const { Campaigns, Domain, TrafficChannel, Lander } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Helper: Generate promoting URL using campaign unique_id and dynamic domain
const getPromotingUrl = (domainStr, campaignUniqueId, trafficChannel) => {
  const isLocal =
    domainStr.includes("localhost") ||
    domainStr.includes("127.0.0.1") ||
    domainStr.startsWith("192.168.") ||
    domainStr.startsWith("10.") ||
    domainStr.endsWith(".local");

  const protocol = isLocal ? "http" : "https"; // Use http for local, https for production

  // Dynamic parameters from trafficChannel and campaign data
  const dynamicParams = {
    sub1: trafficChannel.sub1 || "",
    sub2: trafficChannel.keyword || "",
    sub3: trafficChannel.matchtype || "",
    sub4: trafficChannel.adgroupid || "",
    sub5: trafficChannel.creative || "",
    sub6: campaignUniqueId,
    sub7: trafficChannel.device || "",
    sub8: trafficChannel.adposition || "",
    sub9: trafficChannel.network || "",
    sub10: trafficChannel.placement || "",
    cost: trafficChannel.revenue || "",
    wbraid: trafficChannel.wbraid || "",
    gbraid: trafficChannel.gbraid || "",
    ref_id: trafficChannel.gclid || ""
  };

  const query = new URLSearchParams(dynamicParams).toString();

  // Use the dynamic domain here
  return `${protocol}://${domainStr}/?unique_id=${campaignUniqueId}&${query}`;

};

// ✅ POST: Create new campaign
router.post("/", async (req, res) => {
  try {
    const { name, traffic_channel_id, domain_id, lander_id } = req.body;

    if (!name || !traffic_channel_id || !domain_id || !lander_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Fetch the domain and traffic channel
    const domain = await Domain.findByPk(domain_id);
    if (!domain) return res.status(400).json({ error: "Invalid domain_id" });

    const trafficChannel = await TrafficChannel.findByPk(traffic_channel_id);
    if (!trafficChannel) return res.status(400).json({ error: "Invalid traffic_channel_id" });

    // Fetch the lander based on lander_id
    const lander = await Lander.findByPk(lander_id);
    if (!lander) return res.status(400).json({ error: "Invalid lander_id" });

    const unique_id = uuidv4().split("-")[0]; // Shorten UUID for campaign

    // Create the campaign and associate it with the lander
    const campaign = await Campaigns.create({
      name,
      unique_id,
      traffic_channel_id,
      domain_id,
      lander_id,
    });

    const promoting_url = getPromotingUrl(domain.domain, campaign.unique_id, trafficChannel);

    // Return the newly created campaign and the generated promoting URL
    return res.status(201).json({
      ...campaign.toJSON(),
      promoting_url,
    });

  } catch (error) {
    console.error("Error creating campaign:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// GET: Fetch lander URL based on campaign unique_id
router.get("/", async (req, res) => {
  try {
    const { unique_id, ...queryParams } = req.query;

    if (!unique_id) {
      return res.status(400).send("Missing unique_id");
    }

    const campaign = await Campaigns.findOne({ where: { unique_id } });
    if (!campaign) {
      return res.status(404).send("Campaign not found");
    }

    const lander = await Lander.findByPk(campaign.lander_id);
    if (!lander) {
      return res.status(404).send("Lander not found");
    }

    // Append query parameters to the lander's final URL
    const landerUrl = new URL(lander.url);
    for (const [key, value] of Object.entries(queryParams)) {
      landerUrl.searchParams.append(key, value);
    }

    // Redirect immediately
    return res.redirect(landerUrl.toString()); // 302 redirect by default
  } catch (err) {
    console.error("Redirect error:", err);
    res.status(500).send("Internal server error");
  }
});
module.exports = router;
