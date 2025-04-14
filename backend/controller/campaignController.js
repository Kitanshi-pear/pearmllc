const { Campaigns, TrafficChannel, Domain, Lander, Offer, OfferSource } = require("../models"); // import models

module.exports.createCampaign = async (req, res) => {
  try {
    // Destructure the fields from the request body
    const { name, traffic_channel_id, domain_id, lander_id, offer_id, offer_source_id } = req.body;

    // Fetch related data (traffic channel, domain, etc.)
    const trafficChannel = await TrafficChannel.findByPk(traffic_channel_id);
    const domain = await Domain.findByPk(domain_id);
    const lander = await Lander.findByPk(lander_id);
    const offer = await Offer.findByPk(offer_id);
    const offerSource = await OfferSource.findByPk(offer_source_id);

    if (!trafficChannel || !domain) {
      return res.status(400).json({ message: "Invalid Traffic Channel or Domain" });
    }

    // Generate a unique ID for the campaign
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create the campaign
    const campaign = await Campaigns.create({
      name,
      unique_id: uniqueId,
      traffic_channel_id,
      domain_id,
      lander_id,
      offer_id,
      offer_source_id
    });

    // Prepare dynamic parameters for the URL
    const dynamicParams = {
      utm_campaign: campaign.name,  // Campaign name used as the `utm_campaign`
      sub2: trafficChannel.keyword || "",   // Get keyword from TrafficChannel if available
      sub3: trafficChannel.matchtype || "",  // Get matchtype from TrafficChannel if available
      sub4: trafficChannel.adgroupid || "",  // Get adgroupid from TrafficChannel if available
      sub5: trafficChannel.creative || "",   // Get creative from TrafficChannel if available
      sub6: campaign.unique_id,  // Unique ID for campaign
      sub7: trafficChannel.device || "",   // Device info (mobile/desktop) from TrafficChannel
      sub8: trafficChannel.adposition || "", // Ad position info from TrafficChannel
      sub9: trafficChannel.network || "", // Network info (Google, etc.) from TrafficChannel
      sub10: trafficChannel.placement || "", // Placement (Search/Display) info from TrafficChannel
      utm_source: trafficChannel.network || "Google",  // Default to Google if no network info
      wbraid: trafficChannel.wbraid || "", // Dynamic wbraid from TrafficChannel
      gbraid: trafficChannel.gbraid || "", // Dynamic gbraid from TrafficChannel
      ref_id: trafficChannel.gclid || "" // Google click ID (gclid) from TrafficChannel
    };

    // Construct the promoting URL dynamically
    const promotingUrl = `https://${domain.url}/${campaign.unique_id}?utm_campaign=${dynamicParams.utm_campaign}&sub2=${dynamicParams.sub2}&sub3=${dynamicParams.sub3}&sub4=${dynamicParams.sub4}&sub5=${dynamicParams.sub5}&sub6=${dynamicParams.sub6}&sub7=${dynamicParams.sub7}&sub8=${dynamicParams.sub8}&sub9=${dynamicParams.sub9}&sub10=${dynamicParams.sub10}&utm_source=${dynamicParams.utm_source}&wbraid=${dynamicParams.wbraid}&gbraid=${dynamicParams.gbraid}&ref_id=${dynamicParams.ref_id}`;

    // Save the URL to the campaign (if you want to store it in the database)
    campaign.promoting_url = promotingUrl;
    await campaign.save();

    // Return success response with the URL
    return res.status(201).json({
      message: "Campaign created successfully",
      data: campaign,
      promoting_url: promotingUrl
    });

  } catch (error) {
    console.error("Error creating campaign:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
