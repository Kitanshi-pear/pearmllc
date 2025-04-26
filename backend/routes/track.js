// routes/track.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { TrafficChannel, Metrics, Clicks, Lpclicks, Offer, Campaigns, Macro, Lander } = require('../models');

console.log('📝 Initializing track routes...');

// Constants for macro handling
const MACRO_PLACEHOLDERS = {
  CLICK_ID: '{click_id}',
  CAMPAIGN_ID: '{unique_id}',
  TRAFFIC_SOURCE: '{traffic_channel_id}',
  OFFER_ID: '{offer_id}',
  PAYOUT: '{payout}',
  SUB1: '{sub1}',
  SUB2: '{sub2}',
  SUB3: '{sub3}',
  SUB4: '{sub4}',
  SUB5: '{sub5}',
  // Add more subs as needed (6-23)
};

// Handle click tracking
router.get('/click', async (req, res) => {
  console.log("✅ Track click request received:", req.query);
  try {
    const { unique_id, tc, ...params } = req.query;
    
    if (!unique_id) {
      console.error("❌ Missing unique_id in tracking request");
      return res.status(400).json({ error: 'Missing unique_id parameter' });
    }

    // Get campaign info
    const campaign = await Campaigns.findByPk(unique_id);
    if (!campaign) {
      console.error(`❌ Campaign not found: ${unique_id}`);
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get traffic channel info if provided
    let trafficChannel = null;
    if (tc) {
      trafficChannel = await TrafficChannel.findByPk(tc);
      if (!trafficChannel) {
        console.error(`❌ Traffic channel not found: ${tc}`);
        return res.status(404).json({ error: 'Traffic channel not found' });
      }
    }

    // Create click record
    const userAgent = req.headers['user-agent'];
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    console.log(`✅ Creating click record for campaign ${unique_id}`);
    const click = await Clicks.create({
      unique_id: unique_id,
      traffic_channel_id: tc || null,
      ip: ip,
      user_agent: userAgent,
      // Add other relevant click data
    });

    // Store macros from query parameters
    if (tc) {
      console.log(`✅ Storing macros for click ${click.click_id}`);
      const macroData = {
        click_id: click.click_id,
        traffic_channel_id: tc,
        unique_id: unique_id
      };
      
      // Extract sub parameters from query
      for (let i = 1; i <= 23; i++) {
        const subParam = `sub${i}`;
        if (params[subParam]) {
          macroData[subParam] = params[subParam];
        }
      }
      
      await Macro.create(macroData);
    }

    // Update metrics
    console.log(`✅ Updating metrics for click event`);
    await updateMetrics(unique_id, tc, 'click');

    // Determine redirect destination (lander or offer)
    let redirectUrl = '';
    if (campaign.lander_id && !campaign.direct_linking) {
      // Redirect to lander
      const lander = await Lander.findByPk(campaign.lander_id);
      if (!lander) {
        console.error(`❌ Lander not found for campaign: ${unique_id}`);
        return res.status(404).json({ error: 'Lander not found' });
      }
      
      redirectUrl = lander.url;
      // Add click_id to URL for tracking
      const redirectWithParams = new URL(redirectUrl);
      redirectWithParams.searchParams.set('click_id', click.click_id);
      
      redirectUrl = redirectWithParams.toString();
    } else if (campaign.offer_id) {
      // Direct linking to offer
      const offer = await Offer.findByPk(campaign.offer_id);
      if (!offer) {
        console.error(`❌ Offer not found for campaign: ${unique_id}`);
        return res.status(404).json({ error: 'Offer not found' });
      }
      
      redirectUrl = offer.url;
      // Replace macros in URL
      redirectUrl = replaceMacros(redirectUrl, {
        click_id: click.click_id,
        unique_id: unique_id,
        offer_id: campaign.offer_id
      });
    } else {
      console.error(`❌ No valid redirect destination for campaign: ${unique_id}`);
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
    const click = await Clicks.findByPk(click_id);
    if (!click) {
      console.error(`❌ Click not found: ${click_id}`);
      return res.status(404).json({ error: 'Click not found' });
    }

    // Update click record
    click.lp_viewed = true;
    await click.save();

    // Create lander click record
    await Lpclicks.create({
      click_id: click_id,
      unique_id: click.unique_id,
      traffic_channel_id: click.traffic_channel_id,
      timestamp: new Date()
    });

    // Update metrics
    console.log(`✅ Updating metrics for lander view event`);
    await updateMetrics(click.unique_id, click.traffic_channel_id, 'lpview');

    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error tracking lander view:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle conversion tracking
router.get('/conversion', async (req, res) => {
  console.log("✅ Track conversion request received:", req.query);
  try {
    const { click_id, payout } = req.query;
    
    if (!click_id) {
      console.error("❌ Missing click_id in conversion request");
      return res.status(400).json({ error: 'Missing click_id parameter' });
    }

    // Find the click
    const click = await Clicks.findByPk(click_id, {
      include: [
        { model: Campaigns },
        { model: TrafficChannel },
        { model: Macro }
      ]
    });
    
    if (!click) {
      console.error(`❌ Click not found: ${click_id}`);
      return res.status(404).json({ error: 'Click not found' });
    }

    // Update click record
    click.conversion = true;
    click.conversion_time = new Date();
    
    // Set revenue/payout
    const conversionPayout = payout || (click.Campaigns?.payout || 0);
    click.revenue = parseFloat(conversionPayout);
    click.profit = click.revenue - (click.cost || 0);
    
    await click.save();

    // Update metrics
    console.log(`✅ Updating metrics for conversion event`);
    await updateMetrics(
      click.unique_id, 
      click.traffic_channel_id, 
      'conversion',
      parseFloat(conversionPayout)
    );

    // Send postback to traffic source if configured
    if (click.TrafficChannel && click.TrafficChannel.s2sPostbackUrl) {
      try {
        const postbackUrl = generatePostbackUrl(
          click.TrafficChannel.s2sPostbackUrl,
          click,
          conversionPayout
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

// API endpoint to get metrics
router.get('/metrics', async (req, res) => {
  try {
    const { unique_id, traffic_channel_id, start_date, end_date } = req.query;
    
    // Build query conditions
    const where = {};
    
    if (unique_id) {
      where.unique_id = unique_id;
    }
    
    if (traffic_channel_id) {
      where.traffic_channel_id = traffic_channel_id;
    }
    
    if (start_date && end_date) {
      where.date = {
        [Op.between]: [start_date, end_date]
      };
    } else if (start_date) {
      where.date = {
        [Op.gte]: start_date
      };
    } else if (end_date) {
      where.date = {
        [Op.lte]: end_date
      };
    }
    
    // Get metrics data
    const metrics = await Metrics.findAll({ where });
    
    return res.json(metrics);
  } catch (error) {
    console.error('❌ Error getting metrics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update metrics for various tracking events
 */
async function updateMetrics(campaignId, trafficChannelId, eventType, revenue = 0) {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Find or create metrics record for campaign
    let [campaignMetrics] = await Metrics.findOrCreate({
      where: {
        unique_id: campaignId,
        date: today
      },
      defaults: {
        impressions: 0,
        clicks: 0,
        lpviews: 0,
        lpclicks: 0,
        conversions: 0,
        total_revenue: 0,
        total_cost: 0,
        profit: 0
      }
    });
    
    // Update campaign metrics based on event type
    if (eventType === 'click') {
      campaignMetrics.clicks += 1;
    } else if (eventType === 'lpview') {
      campaignMetrics.lpviews += 1;
    } else if (eventType === 'conversion') {
      campaignMetrics.conversions += 1;
      campaignMetrics.total_revenue += revenue;
      campaignMetrics.profit = campaignMetrics.total_revenue - campaignMetrics.total_cost;
    }
    
    // Calculate derived metrics
    calculateDerivedMetrics(campaignMetrics);
    await campaignMetrics.save();
    
    // If traffic channel ID provided, update traffic channel metrics
    if (trafficChannelId) {
      let [tcMetrics] = await Metrics.findOrCreate({
        where: {
          traffic_channel_id: trafficChannelId,
          date: today
        },
        defaults: {
          impressions: 0,
          clicks: 0,
          lpviews: 0,
          lpclicks: 0,
          conversions: 0,
          total_revenue: 0,
          total_cost: 0,
          profit: 0
        }
      });
      
      // Update traffic channel metrics based on event type
      if (eventType === 'click') {
        tcMetrics.clicks += 1;
      } else if (eventType === 'lpview') {
        tcMetrics.lpviews += 1;
      } else if (eventType === 'conversion') {
        tcMetrics.conversions += 1;
        tcMetrics.total_revenue += revenue;
        tcMetrics.profit = tcMetrics.total_revenue - tcMetrics.total_cost;
      }
      
      // Calculate derived metrics for traffic channel
      calculateDerivedMetrics(tcMetrics);
      await tcMetrics.save();
      
      // Also update combined campaign + traffic channel metrics
      let [combinedMetrics] = await Metrics.findOrCreate({
        where: {
          unique_id: campaignId,
          traffic_channel_id: trafficChannelId,
          date: today
        },
        defaults: {
          impressions: 0,
          clicks: 0,
          lpviews: 0,
          lpclicks: 0,
          conversions: 0,
          total_revenue: 0,
          total_cost: 0,
          profit: 0
        }
      });
      
      // Update combined metrics based on event type
      if (eventType === 'click') {
        combinedMetrics.clicks += 1;
      } else if (eventType === 'lpview') {
        combinedMetrics.lpviews += 1;
      } else if (eventType === 'conversion') {
        combinedMetrics.conversions += 1;
        combinedMetrics.total_revenue += revenue;
        combinedMetrics.profit = combinedMetrics.total_revenue - combinedMetrics.total_cost;
      }
      
      // Calculate derived metrics for combined data
      calculateDerivedMetrics(combinedMetrics);
      await combinedMetrics.save();
    }
    
    console.log(`✅ Metrics updated for ${eventType} event`);
  } catch (error) {
    console.error(`❌ Error updating metrics:`, error);
    throw error;
  }
}

/**
 * Calculate derived metrics
 */
function calculateDerivedMetrics(metrics) { if (metrics.clicks > 0) { metrics.ctr = (metrics.clicks / metrics.impressions) * 100 || 0; metrics.cr = (metrics.conversions / metrics.clicks) * 100 || 0; metrics.cpc = metrics.total_cost / metrics.clicks || 0; metrics.epc = metrics.total_revenue / metrics.clicks || 0; } if (metrics.lpviews > 0) { metrics.offer_cr = (metrics.conversions / metrics.lpviews) * 100 || 0; metrics.lpepc = metrics.total_revenue / metrics.lpviews || 0; } if (metrics.total_cost > 0) { metrics.roi = ((metrics.total_revenue - metrics.total_cost) / metrics.total_cost) * 100 || 0; metrics.total_roi = metrics.roi; } if (metrics.conversions > 0) { metrics.ctc = metrics.total_cost / metrics.conversions || 0; metrics.total_cpa = metrics.ctc; } if (metrics.impressions > 0) { metrics.cpm = (metrics.total_cost / metrics.impressions) * 1000 || 0; } }

/**
 * Replace macros in a URL with actual values
 */
function replaceMacros(url, values) { let processedUrl = url;
  // Replace system macros
  for (const [key, macro] of Object.entries(MACRO_PLACEHOLDERS)) { if (values[key.toLowerCase()]) { const regex = new RegExp(escapeRegExp(macro), 'g'); processedUrl = processedUrl.replace(regex, values[key.toLowerCase()]); } }
  
  // Replace custom sub macros
  for (let i = 1; i <= 23; i++) { const subKey = `sub${i}`; const subMacro = MACRO_PLACEHOLDERS[`SUB${i}`] || `{${subKey}}`; if (values[subKey]) { const regex = new RegExp(escapeRegExp(subMacro), 'g'); processedUrl = processedUrl.replace(regex, values[subKey]); } } return processedUrl; }

/**
 * Generate postback URL for traffic source
 */
function generatePostbackUrl(baseUrl, click, payout) {
  // Gather values for replacement
  const values = { click_id: click.click_id, unique_id: click.unique_id, campaign_name: click.Campaigns?.name || '', traffic_source: click.TrafficChannel?.channelName || '', offer_id: click.Campaigns?.offer_id || '', payout: payout.toString() };
  
  // Add sub values from the macro
  if (click.Macro) { for (let i = 1; i <= 23; i++) { const subKey = `sub${i}`; if (click.Macro[subKey]) { values[subKey] = click.Macro[subKey]; } } }
  
  // Replace macros in the postback URL
  return replaceMacros(baseUrl, values);
}

/**
 * Send postback to traffic source
 */
async function sendPostback(url) { try { const axios = require('axios'); await axios.get(url); console.log(`✅ Postback sent successfully to: ${url}`); return true; } catch (error) { console.error(`❌ Error sending postback to: ${url}`, error); throw error; } }

/**
 * Helper function to escape special characters in macros for regex
 */
function escapeRegExp(string) { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

console.log('📝 Track routes initialized and exported');
module.exports = router;