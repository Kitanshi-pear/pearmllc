// controllers/TrackController.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');
const MetricsService = require('../services/metrics');
const MacroService = require('../services/MacroServices');
const axios = require('axios');

console.log('📝 Initializing track routes...');

// Handle click tracking
router.get('/click', async (req, res) => {
  console.log("✅ Track click request received:", req.query);
  try {
    const { campaign_id, tc, ...params } = req.query;
    
    if (!campaign_id) {
      console.error("❌ Missing campaign_id in tracking request");
      return res.status(400).json({ error: 'Missing campaign_id parameter' });
    }

    // Get campaign info
    const campaign = await db.Campaign.findByPk(campaign_id);
    if (!campaign) {
      console.error(`❌ Campaign not found: ${campaign_id}`);
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get traffic channel info if provided
    let trafficChannel = null;
    if (tc) {
      trafficChannel = await db.TrafficChannel.findByPk(tc);
      if (!trafficChannel) {
        console.error(`❌ Traffic channel not found: ${tc}`);
        return res.status(404).json({ error: 'Traffic channel not found' });
      }
    }

    // Create click record
    const userAgent = req.headers['user-agent'];
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Get location data from IP (you could use a geo-ip service here)
    const geoData = await getGeoData(ip);
    
    console.log(`✅ Creating click record for campaign ${campaign_id}`);
    const click = await db.Click.create({
      campaign_id: campaign_id,
      traffic_channel_id: tc || null,
      lander_id: campaign.lander_id || null,
      offer_id: campaign.offer_id || null,
      ip: ip,
      user_agent: userAgent,
      country: geoData.country || null,
      region: geoData.region || null,
      city: geoData.city || null,
      isp: geoData.isp || null,
      browser: parseBrowser(userAgent),
      os: parseOS(userAgent),
      device: parseDevice(userAgent),
      landing_page_viewed: false,
      conversion: false,
      cost: trafficChannel?.cost_per_click || 0
    });

    // Extract and store macros from query parameters
    if (tc) {
      console.log(`✅ Storing macros for click ${click.id}`);
      
      // Extract sub parameters from query
      const subs = MacroService.extractSubsFromQuery(params);
      
      // Combine with other values
      const macroValues = {
        traffic_channel_id: tc,
        campaign_id: campaign_id,
        lander_id: campaign.lander_id || null,
        offer_id: campaign.offer_id || null,
        campaign_name: campaign.name || '',
        traffic_source: trafficChannel?.channelName || '',
        ip: ip,
        user_agent: userAgent,
        country: geoData.country || '',
        ...subs  // Add all extracted sub parameters
      };
      
      await MacroService.storeMacros(click.id, macroValues);
    }

    // Update metrics in the system
    console.log(`✅ Updating metrics for click event`);
    const clickCost = trafficChannel?.cost_per_click || 0;
    
    await MetricsService.incrementMetrics('click', {
      campaignId: campaign_id,
      trafficChannelId: tc || null,
      landerId: campaign.lander_id || null,
      offerId: campaign.offer_id || null,
      cost: clickCost
    });

    // Determine redirect destination (lander or offer)
    let redirectUrl = '';
    if (campaign.lander_id && !campaign.direct_linking) {
      // Redirect to lander
      const lander = await db.Lander.findByPk(campaign.lander_id);
      if (!lander) {
        console.error(`❌ Lander not found for campaign: ${campaign_id}`);
        return res.status(404).json({ error: 'Lander not found' });
      }
      
      // Add click_id to lander URL
      redirectUrl = lander.url;
      const redirectWithParams = new URL(redirectUrl);
      redirectWithParams.searchParams.set('click_id', click.id);
      
      redirectUrl = redirectWithParams.toString();
    } else if (campaign.offer_id) {
      // Direct linking to offer
      const offer = await db.Offer.findByPk(campaign.offer_id);
      if (!offer) {
        console.error(`❌ Offer not found for campaign: ${campaign_id}`);
        return res.status(404).json({ error: 'Offer not found' });
      }
      
      // Replace macros in offer URL
      redirectUrl = offer.url;
      
      // Prepare values for macro replacement
      const macroValues = {
        click_id: click.id,
        campaign_id: campaign_id,
        campaign_name: campaign.name || '',
        traffic_source_id: tc || '',
        traffic_source: trafficChannel?.channelName || '',
        offer_id: campaign.offer_id || '',
        ...subs  // Include sub parameters
      };
      
      redirectUrl = MacroService.replaceMacros(redirectUrl, macroValues);
    } else {
      console.error(`❌ No valid redirect destination for campaign: ${campaign_id}`);
      return res.status(404).json({ error: 'No redirect destination found' });
    }

    console.log(`✅ Redirecting to: ${redirectUrl}`);
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('❌ Error tracking click:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle lander view tracking
router.get('/lander', async (req, res) => {
  console.log("✅ Track lander view request received:", req.query);
  try {
    const { click_id } = req.query;
    
    if (!click_id) {
      console.error("❌ Missing click_id in lander view request");
      return res.status(400).json({ error: 'Missing click_id parameter' });
    }

    // Find the click
    const click = await db.Click.findByPk(click_id);
    if (!click) {
      console.error(`❌ Click not found: ${click_id}`);
      return res.status(404).json({ error: 'Click not found' });
    }

    // Update click record
    click.landing_page_viewed = true;
    await click.save();

    // Create lander view record
    await db.LanderView.create({
      click_id: click_id,
      campaign_id: click.campaign_id,
      traffic_channel_id: click.traffic_channel_id,
      lander_id: click.lander_id,
      timestamp: new Date()
    });

    // Update metrics
    console.log(`✅ Updating metrics for lander view event`);
    await MetricsService.incrementMetrics('lpview', {
      campaignId: click.campaign_id,
      trafficChannelId: click.traffic_channel_id,
      landerId: click.lander_id
    });

    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error tracking lander view:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle lander click (redirect to offer) tracking
router.get('/lpclick', async (req, res) => {
  console.log("✅ Track lander click request received:", req.query);
  try {
    const { click_id } = req.query;
    
    if (!click_id) {
      console.error("❌ Missing click_id in lander click request");
      return res.status(400).json({ error: 'Missing click_id parameter' });
    }

    // Find the click with campaign and offer info
    const click = await db.Click.findByPk(click_id, {
      include: [
        { model: db.Campaign, as: 'campaign' },
        { model: db.Lander, as: 'lander' }
      ]
    });
    
    if (!click) {
      console.error(`❌ Click not found: ${click_id}`);
      return res.status(404).json({ error: 'Click not found' });
    }

    // Create lander click record
    await db.LanderClick.create({
      click_id: click_id,
      campaign_id: click.campaign_id,
      traffic_channel_id: click.traffic_channel_id,
      lander_id: click.lander_id,
      offer_id: click.campaign?.offer_id,
      timestamp: new Date()
    });

    // Update metrics
    console.log(`✅ Updating metrics for lander click event`);
    await MetricsService.incrementMetrics('lpclick', {
      campaignId: click.campaign_id,
      trafficChannelId: click.traffic_channel_id,
      landerId: click.lander_id,
      offerId: click.campaign?.offer_id
    });

    // Get offer to redirect to
    const offer = await db.Offer.findByPk(click.campaign?.offer_id);
    if (!offer) {
      console.error(`❌ Offer not found for campaign: ${click.campaign_id}`);
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    // Prepare redirect URL with macros
    let redirectUrl = offer.url;
    
    // Get macro values
    const macroValues = await MacroService.getMacroValues(click_id);
    
    // Replace macros in URL
    redirectUrl = MacroService.replaceMacros(redirectUrl, macroValues);
    
    console.log(`✅ Redirecting to offer: ${redirectUrl}`);
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('❌ Error tracking lander click:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle conversion tracking
router.get('/conversion', async (req, res) => {
  console.log("✅ Track conversion request received:", req.query);
  try {
    const { click_id, payout, offer_id } = req.query;
    
    // We must have either click_id or offer_id
    if (!click_id && !offer_id) {
      console.error("❌ Missing click_id or offer_id in conversion request");
      return res.status(400).json({ error: 'Missing click_id or offer_id parameter' });
    }

    let click;
    
    if (click_id) {
      // Find the click with related data
      click = await db.Click.findByPk(click_id, {
        include: [
          { model: db.Campaign, as: 'campaign' },
          { model: db.TrafficChannel, as: 'traffic_channel' }
        ]
      });
      
      if (!click) {
        console.error(`❌ Click not found: ${click_id}`);
        return res.status(404).json({ error: 'Click not found' });
      }
    } else {
      // Handle server postback without click_id
      // This would require additional implementation for server-to-server tracking
      console.error("❌ Server-to-server tracking without click_id not yet implemented");
      return res.status(501).json({ error: 'S2S tracking without click_id not implemented' });
    }

    // Update click record
    click.conversion = true;
    click.conversion_time = new Date();
    
    // Set revenue/payout
    const conversionPayout = payout || (click.campaign?.payout || 0);
    click.revenue = parseFloat(conversionPayout);
    click.profit = click.revenue - (click.cost || 0);
    
    await click.save();
    
    // Create conversion record
    await db.Conversion.create({
      click_id: click.id,
      campaign_id: click.campaign_id,
      traffic_channel_id: click.traffic_channel_id,
      lander_id: click.lander_id,
      offer_id: click.campaign?.offer_id,
      revenue: parseFloat(conversionPayout),
      cost: click.cost || 0,
      profit: click.revenue - (click.cost || 0),
      timestamp: new Date()
    });

    // Update metrics
    console.log(`✅ Updating metrics for conversion event`);
    await MetricsService.incrementMetrics('conversion', {
      campaignId: click.campaign_id,
      trafficChannelId: click.traffic_channel_id,
      landerId: click.lander_id,
      offerId: click.campaign?.offer_id,
      revenue: parseFloat(conversionPayout),
      cost: click.cost || 0
    });

    // Send postback to traffic source if configured
    if (click.traffic_channel?.s2sPostbackUrl) {
      try {
        const postbackUrl = await MacroService.generatePostbackUrl(
          click.traffic_channel.s2sPostbackUrl,
          click.id
        );
        
        console.log(`✅ Sending postback to: ${postbackUrl}`);
        
        // Send postback asynchronously
        sendPostback(postbackUrl).catch(err => {
          console.error('❌ Error sending postback:', err);
        });
      } catch (postbackError) {
        console.error('❌ Error generating postback URL:', postbackError);
      }
    }

    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error tracking conversion:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to get metrics data
router.get('/metrics', async (req, res) => {
  try {
    const { 
      campaign_id, 
      traffic_channel_id, 
      lander_id, 
      offer_id, 
      start_date, 
      end_date,
      dimension, // e.g., 'day', 'hour', 'country'
      group_by,  // e.g., 'traffic_channel', 'date'
      include_hourly = false
    } = req.query;
    
    // Determine entity type for aggregated metrics
    let entityType, entityId;
    if (campaign_id) {
      entityType = 'campaign';
      entityId = campaign_id;
    } else if (traffic_channel_id) {
      entityType = 'traffic_channel';
      entityId = traffic_channel_id;
    } else if (lander_id) {
      entityType = 'lander';
      entityId = lander_id;
    } else if (offer_id) {
      entityType = 'offer';
      entityId = offer_id;
    }
    
    // Build date range
    const startDateObj = start_date ? new Date(start_date) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDateObj = end_date ? new Date(end_date) : new Date();
    
    // Format dates for DB query
    const formattedStartDate = startDateObj.toISOString().split('T')[0];
    const formattedEndDate = endDateObj.toISOString().split('T')[0];
    
    let metricsData;
    
    if (dimension) {
      // Get metrics by dimension (time or geo breakdown)
      metricsData = await MetricsService.getMetricsByDimension(
        entityType,
        entityId,
        dimension,
        formattedStartDate,
        formattedEndDate
      );
    } else if (group_by) {
      // Get metrics with grouping
      const filters = {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        trafficChannelIds: traffic_channel_id ? [traffic_channel_id] : undefined,
        campaignIds: campaign_id ? [campaign_id] : undefined,
        groupBy: group_by
      };
      
      const options = {
        includeHourly: include_hourly === 'true' || include_hourly === '1'
      };
      
      metricsData = await MetricsService.getTrafficChannelMetrics(filters, options);
    } else if (entityType && entityId) {
      // Get aggregated metrics for a specific entity
      metricsData = await MetricsService.getAggregatedMetrics(
        entityType,
        entityId,
        formattedStartDate,
        formattedEndDate
      );
    } else {
      // Default: Get traffic channel metrics
      const filters = {
        startDate: formattedStartDate,
        endDate: formattedEndDate
      };
      
      metricsData = await MetricsService.getTrafficChannelMetrics(filters);
    }
    
    return res.json(metricsData);
  } catch (error) {
    console.error('❌ Error getting metrics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to get geo data from IP
async function getGeoData(ip) {
  try {
    // For local or testing IPs, return default values
    if (ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        isp: 'Unknown'
      };
    }
    
    // In production, you'd use a service like MaxMind, ipapi, ipinfo, etc.
    // Here's a simple implementation using ipapi.co (free tier has rate limits)
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);
    
    return {
      country: response.data.country_name || 'Unknown',
      country_code: response.data.country_code || 'XX',
      region: response.data.region || 'Unknown',
      city: response.data.city || 'Unknown',
      isp: response.data.org || 'Unknown'
    };
  } catch (error) {
    console.error('Error getting geo data:', error);
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      isp: 'Unknown'
    };
  }
}

// Parse browser from user agent
function parseBrowser(userAgent) {
  if (!userAgent) return 'Unknown';
  
  // Simple browser detection - in production use a proper user-agent parser library
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) return 'Internet Explorer';
  
  return 'Other';
}

// Parse OS from user agent
function parseOS(userAgent) {
  if (!userAgent) return 'Unknown';
  
  // Simple OS detection - in production use a proper user-agent parser library
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  
  return 'Other';
}

// Parse device type from user agent
function parseDevice(userAgent) {
  if (!userAgent) return 'Unknown';
  
  // Simple device detection - in production use a proper user-agent parser library
  if (userAgent.includes('Mobile')) return 'Mobile';
  if (userAgent.includes('Tablet') || userAgent.includes('iPad')) return 'Tablet';
  
  return 'Desktop';
}

// Send postback to traffic source
async function sendPostback(url) {
  try {
    const response = await axios.get(url);
    console.log(`✅ Postback sent successfully to: ${url}`, response.status);
    return true;
  } catch (error) {
    console.error(`❌ Error sending postback to: ${url}`, error);
    throw error;
  }
}

console.log('📝 Track routes initialized and exported');
module.exports = router;