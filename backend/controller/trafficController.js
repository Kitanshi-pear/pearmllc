const axios = require('axios');
const { addTrafficData } = require('../models/TrafficChannel');

const GOOGLE_ADS_API = 'https://googleads.googleapis.com/v10/customers/{customer_id}/campaigns';
const FB_API = 'https://graph.facebook.com/v17.0';

// Helper function to extract campaign data
const mapCampaignData = (campaign, source) => ({
  traffic_channel_name: `${source} Ads`,
  no_of_campaigns: 1,
  source_name: source,
  clicks: campaign.clicks || 0,
  conversion: campaign.conversions || 0,
  total_cpa: campaign.cost_per_conversion || 0,
  epc: campaign.epc || 0,
  total_revenue: campaign.revenue || campaign.insights?.spend || 0,
  cost: campaign.cost || campaign.insights?.spend || 0,
  profit: (campaign.revenue || campaign.insights?.spend || 0) - (campaign.cost || campaign.insights?.spend || 0),
  total_roi: campaign.ROI || 0,
  lp_views: campaign.views || campaign.insights?.lp_views || 0,
  impressions: campaign.impressions || campaign.insights?.impressions || 0
});

const fetchGoogleAds = async (req, res) => {
  try {
    const response = await axios.get(GOOGLE_ADS_API, {
      headers: { Authorization: `Bearer ${process.env.GOOGLE_ACCESS_TOKEN}` }
    });

    const campaigns = response.data;
    const promises = campaigns.map(campaign =>
      addTrafficData(mapCampaignData(campaign, 'Google'))
    );

    await Promise.all(promises);

    res.status(200).json({ message: 'Google Ads data fetched successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch Google Ads data', details: error.message });
  }
};

const fetchFacebookAds = async (req, res) => {
  try {
    const response = await axios.get(`${FB_API}/me/adaccounts`, {
      headers: { Authorization: `Bearer ${process.env.FB_ACCESS_TOKEN}` }
    });

    const adAccounts = response.data.data;
    const promises = [];

    for (const account of adAccounts) {
      const campaignsRes = await axios.get(`${FB_API}/${account.id}/campaigns`, {
        headers: { Authorization: `Bearer ${process.env.FB_ACCESS_TOKEN}` }
      });

      for (const campaign of campaignsRes.data.data) {
        promises.push(addTrafficData(mapCampaignData(campaign, 'Facebook')));
      }
    }

    await Promise.all(promises);

    res.status(200).json({ message: 'Facebook Ads data fetched successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch Facebook Ads data', details: error.message });
  }
};
