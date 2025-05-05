// campaignController.js
const { Campaigns, Domain, TrafficChannel, Lander, Offer, OfferSource, Metrics } = require("../models");

exports.getAllCampaigns = async (req, res) => {
  try {
    console.log("Fetching all campaigns with associations");
    const campaigns = await Campaigns.findAll({
      include: [
        { 
          model: TrafficChannel, 
          attributes: ['id', 'channelName', 'aliasChannel'] 
        },
        { 
          model: Domain, 
          attributes: ['id', 'url'] 
        },
        { 
          model: Lander, 
          attributes: ['id', 'name', 'url'] 
        },
        { 
          model: Offer, 
          attributes: ['id', 'name', 'payout'] 
        },
        { 
          model: OfferSource, 
          attributes: ['id', 'name'] 
        },
        { 
          model: Metrics, 
          attributes: ['clicks', 'conversions', 'revenue', 'cost'] 
        }
      ]
    });
    
    console.log(`Found ${campaigns.length} campaigns`);
    // Add debug log for first campaign to see structure
    if (campaigns.length > 0) {
      console.log("Sample campaign data (first item):", 
        JSON.stringify({
          id: campaigns[0].id,
          name: campaigns[0].name,
          trafficChannel: campaigns[0].TrafficChannel ? {
            id: campaigns[0].TrafficChannel.id,
            name: campaigns[0].TrafficChannel.channelName
          } : null
        }, null, 2)
      );
    }
    
    res.status(200).json(campaigns);
  } catch (error) {
    console.error("Error fetching all campaigns:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }
    
    const campaign = await Campaigns.findByPk(id, {
      include: [
        { model: TrafficChannel, attributes: ['id', 'channelName', 'aliasChannel'] },
        { model: Domain, attributes: ['id', 'url'] },
        { model: Lander, attributes: ['id', 'name', 'url'] },
        { model: Offer, attributes: ['id', 'name', 'payout'] }
      ]
    });
    
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    
    res.status(200).json(campaign);
  } catch (error) {
    console.error("Error fetching campaign by ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.createCampaign = async (req, res) => {
  console.log(`Creating campaign with data:`, req.body);
  try {
    const { 
      name, 
      traffic_channel_id, 
      domain_id, 
      lander_id,
      offer_id,
      costType,
      costValue,
      isDirectLinking,
      tags,
      status
    } = req.body;

    // Check for required fields
    if (!name || !traffic_channel_id || !domain_id) {
      console.error(`Missing required fields in request:`, req.body);
      return res.status(400).json({ error: "Missing required fields: name, traffic_channel_id, and domain_id are required" });
    }

    // Validate domain exists
    const domain = await Domain.findByPk(domain_id);
    if (!domain) {
      console.error(`Invalid domain_id: ${domain_id}`);
      return res.status(400).json({ error: "Invalid domain_id" });
    }

    // Validate traffic channel exists
    const trafficChannel = await TrafficChannel.findByPk(traffic_channel_id);
    if (!trafficChannel) {
      console.error(`Invalid traffic_channel_id: ${traffic_channel_id}`);
      return res.status(400).json({ error: "Invalid traffic_channel_id" });
    }

    // If not direct linking, validate lander exists
    if (!isDirectLinking && lander_id) {
      const lander = await Lander.findByPk(lander_id);
      if (!lander) {
        console.error(`Invalid lander_id: ${lander_id}`);
        return res.status(400).json({ error: "Invalid lander_id" });
      }
    }
    
    // Create unique ID (optional)
    const unique_id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    // Create the campaign
    const campaign = await Campaigns.create({
      name,
      unique_id,
      traffic_channel_id,
      domain_id,
      lander_id: isDirectLinking ? null : lander_id,
      offer_id,
      costType,
      costValue,
      status: status || "ACTIVE",
      tags: Array.isArray(tags) ? JSON.stringify(tags) : "[]"
    });
    
    console.log(`Campaign created with ID: ${campaign.id}`);

    // Fetch the created campaign with associations
    const createdCampaign = await Campaigns.findByPk(campaign.id, {
      include: [
        { model: TrafficChannel, attributes: ['id', 'channelName', 'aliasChannel'] },
        { model: Domain, attributes: ['id', 'url'] },
        { model: Lander, attributes: ['id', 'name', 'url'] },
        { model: Offer, attributes: ['id', 'name', 'payout'] }
      ]
    });

    return res.status(201).json(createdCampaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ error: "Internal server error: " + error.message });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find campaign by ID
    const campaign = await Campaigns.findByPk(id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    
    // Update the campaign
    await campaign.update(updateData);
    
    // Fetch the updated campaign with associations
    const updatedCampaign = await Campaigns.findByPk(id, {
      include: [
        { model: TrafficChannel, attributes: ['id', 'channelName', 'aliasChannel'] },
        { model: Domain, attributes: ['id', 'url'] },
        { model: Lander, attributes: ['id', 'name', 'url'] },
        { model: Offer, attributes: ['id', 'name', 'payout'] }
      ]
    });
    
    res.status(200).json(updatedCampaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find campaign by ID
    const campaign = await Campaigns.findByPk(id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    
    // Delete the campaign
    await campaign.destroy();
    
    res.status(200).json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = exports;