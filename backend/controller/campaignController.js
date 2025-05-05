// controllers/campaignController.js

const { Campaigns, TrafficChannel, Domain, Lander } = require("../models");

exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaigns.findAll({
      include: [
        {
          model: TrafficChannel,
          attributes: ["id", "name"] // only real fields
        },
        {
          model: Domain,
          attributes: ["id", "domain"] // only real fields
        },
        {
          model: Lander,
          attributes: ["id", "url", "name"] // only real fields
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    const formattedCampaigns = campaigns.map((campaign) => {
      const domainName = campaign.Domain?.domain || "yourdomain.com"; // fallback if missing
      const promoting_url = `https://${domainName}/track?unique_id=${campaign.unique_id}`;

      return {
        id: campaign.id,
        name: campaign.name,
        unique_id: campaign.unique_id,
        traffic_channel_id: campaign.traffic_channel_id,
        domain_id: campaign.domain_id,
        lander_id: campaign.lander_id,
        offer_id: campaign.offer_id,
        offer_source_id: campaign.offer_source_id,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        promoting_url: promoting_url
      };
    });

    res.status(200).json(formattedCampaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
