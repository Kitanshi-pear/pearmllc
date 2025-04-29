// routes/track.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { TrafficChannel, Metrics, Clicks, Lpclicks, Offer, Campaigns, Macro, Lander } = require('../models');
const axios = require('axios');

console.log('📝 Initializing track routes...');

// Constants for macro handling
const MACRO_PLACEHOLDERS = {
  CLICK_ID: '{click_id}',
  CAMPAIGN_ID: '{unique_id}',
  CAMPAIGN_NAME: '{campaign_name}',
  TRAFFIC_SOURCE: '{traffic_channel_id}',
  TRAFFIC_SOURCE_NAME: '{traffic_source}',
  LANDER_ID: '{lander_id}',
  LANDER_NAME: '{lander_name}',
  OFFER_ID: '{offer_id}',
  OFFER_NAME: '{offer_name}',
  PAYOUT: '{payout}',
  REVENUE: '{revenue}',
  PROFIT: '{profit}',
  USER_AGENT: '{user_agent}',
  IP: '{ip}',
  COUNTRY: '{country}',
  CITY: '{city}',
  REGION: '{region}',
  TIMESTAMP: '{timestamp}',
  DATE: '{date}',
  TIME: '{time}',
  SUB1: '{sub1}',
  SUB2: '{sub2}',
  SUB3: '{sub3}',
  SUB4: '{sub4}',
  SUB5: '{sub5}',
  SUB6: '{sub6}',
  SUB7: '{sub7}',
  SUB8: '{sub8}',
  SUB9: '{sub9}',
  SUB10: '{sub10}',
  SUB11: '{sub11}',
  SUB12: '{sub12}',
  SUB13: '{sub13}',
  SUB14: '{sub14}',
  SUB15: '{sub15}',
  SUB16: '{sub16}',
  SUB17: '{sub17}',
  SUB18: '{sub18}',
  SUB19: '{sub19}',
  SUB20: '{sub20}',
  SUB21: '{sub21}',
  SUB22: '{sub22}',
  SUB23: '{sub23}'
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

    // Get geo data from IP
    const userAgent = req.headers['user-agent'];
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const geoData = await getGeoData(ip);
    
    console.log(`✅ Creating click record for campaign ${unique_id}`);
    const click = await Clicks.create({
      unique_id: unique_id,
      traffic_channel_id: tc || null,
      lander_id: campaign.lander_id || null,
      offer_id: campaign.offer_id || null,
      ip: ip,
      user_agent: userAgent,
      country: geoData.country || null,
      region: geoData.region || null,
      city: geoData.city || null,
      browser: parseBrowser(userAgent),
      os: parseOS(userAgent),
      device: parseDevice(userAgent),
      cost: trafficChannel?.cost_per_click || 0
    });

    // Store macros from query parameters
    if (tc) {
      console.log(`✅ Storing macros for click ${click.click_id}`);
      const macroData = {
        click_id: click.click_id,
        traffic_channel_id: tc,
        unique_id: unique_id,
        lander_id: campaign.lander_id || null,
        offer_id: campaign.offer_id || null,
        campaign_name: campaign.name || '',
        traffic_source: trafficChannel?.channelName || '',
        ip: ip,
        user_agent: userAgent,
        country: geoData.country || '',
        city: geoData.city || '',
        region: geoData.region || ''
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
        campaign_name: campaign.name || '',
        traffic_channel_id: tc || '',
        traffic_source: trafficChannel?.channelName || '',
        offer_id: campaign.offer_id,
        lander_id: campaign.lander_id || '',
        ...extractSubsFromQuery(params) // Add all sub parameters
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
      lander_id: click.lander_id,
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

// Handle lander click tracking (redirect to offer)
router.get('/lpclick', async (req, res) => {
  console.log("✅ Track lander click request received:", req.query);
  try {
    const { click_id } = req.query;
    
    if (!click_id) {
      console.error("❌ Missing click_id in lander click request");
      return res.status(400).json({ error: 'Missing click_id parameter' });
    }

    // Find the click
    const click = await Clicks.findByPk(click_id, {
      include: [
        { model: Campaigns, as: 'campaign' },
        { model: TrafficChannel, as: 'traffic_channel' },
        { model: Lander, as: 'lander' }
      ]
    });
    
    if (!click) {
      console.error(`❌ Click not found: ${click_id}`);
      return res.status(404).json({ error: 'Click not found' });
    }

    // Create lander click record
    await Lpclicks.create({
      click_id: click_id,
      unique_id: click.unique_id,
      traffic_channel_id: click.traffic_channel_id,
      lander_id: click.lander_id,
      timestamp: new Date()
    });

    // Update metrics for lpclick event
    console.log(`✅ Updating metrics for lander click event`);
    await updateMetrics(click.unique_id, click.traffic_channel_id, 'lpclick');

    // Get offer URL
    const offer = await Offer.findByPk(click.campaign?.offer_id);
    if (!offer) {
      console.error(`❌ Offer not found for campaign: ${click.unique_id}`);
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Get macro values
    const macroValues = await getMacroValues(click_id);
    
    // Replace macros in offer URL
    let redirectUrl = replaceMacros(offer.url, macroValues);
    
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
    
    // We must have either click_id
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

    // Update macro record with revenue data
    const macro = await Macro.findOne({ where: { click_id } });
    if (macro) {
      macro.payout = conversionPayout.toString();
      macro.revenue = conversionPayout.toString();
      macro.profit = (click.revenue - click.cost).toString();
      await macro.save();
    }

    // Send postback to traffic source if configured
    if (click.TrafficChannel && click.TrafficChannel.s2sPostbackUrl) {
      try {
        const postbackUrl = await generatePostbackUrl(
          click.TrafficChannel.s2sPostbackUrl,
          click_id
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
// Fix for the metrics route in track.js
// Replace the entire metrics route with this implementation

// API endpoint to get metrics
router.get('/metrics', async (req, res) => {
  try {
    const { 
      unique_id, 
      traffic_channel_id, 
      lander_id, 
      offer_id, 
      start_date, 
      end_date,
      dimension, // e.g., 'day', 'hour', 'country'
      group_by,  // e.g., 'traffic_channel', 'date'
      include_hourly = false
    } = req.query;
    
    // Build query conditions
    const where = {};
    
    if (unique_id) {
      where.unique_id = unique_id;
    }
    
    if (traffic_channel_id) {
      where.traffic_channel_id = traffic_channel_id;
    }
    
    if (lander_id) {
      where.lander_id = lander_id;
    }
    
    if (offer_id) {
      where.offer_id = offer_id;
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
    
    // Default attributes to ensure we always select something
    let attributes = [
      'id',
      'unique_id',
      'traffic_channel_id', 
      'date',
      'impressions',
      'clicks',
      'lpviews',
      'lpclicks',
      'conversions',
      'total_revenue',
      'total_cost',
      'profit'
    ];
    
    // Determine group by and attributes
    let groupByFields = [];
    
    if (group_by === 'traffic_channel') {
      groupByFields = ['traffic_channel_id'];
      attributes = [
        'traffic_channel_id',
        [db.sequelize.fn('SUM', db.sequelize.col('impressions')), 'impressions'],
        [db.sequelize.fn('SUM', db.sequelize.col('clicks')), 'clicks'],
        [db.sequelize.fn('SUM', db.sequelize.col('lpviews')), 'lpviews'],
        [db.sequelize.fn('SUM', db.sequelize.col('lpclicks')), 'lpclicks'],
        [db.sequelize.fn('SUM', db.sequelize.col('conversions')), 'conversions'],
        [db.sequelize.fn('SUM', db.sequelize.col('total_revenue')), 'total_revenue'],
        [db.sequelize.fn('SUM', db.sequelize.col('total_cost')), 'total_cost'],
        [db.sequelize.fn('SUM', db.sequelize.col('profit')), 'profit']
      ];
    } else if (group_by === 'date') {
      groupByFields = ['date', 'unique_id'];
      attributes = [
        'date', 
        'unique_id',
        'impressions',
        'clicks',
        'lpviews',
        'lpclicks',
        'conversions',
        'total_revenue',
        'total_cost',
        'profit',
        'ctr',
        'lpctr',
        'cr',
        'offer_cr',
        'cpc',
        'cpm',
        'epc',
        'lpepc',
        'roi',
        'ctc'
      ];
    } else if (dimension === 'hour' && include_hourly) {
      groupByFields = ['date', 'hour'];
      attributes = [
        'date', 
        'hour',
        'impressions',
        'clicks',
        'lpviews',
        'lpclicks',
        'conversions',
        'total_revenue',
        'total_cost',
        'profit',
        'ctr',
        'cr',
        'offer_cr',
        'cpc',
        'cpm',
        'epc',
        'lpepc',
        'roi'
      ];
    } else if (dimension === 'country') {
      // For country breakdown, we need to join with the Clicks table
      const clicks = await Clicks.findAll({
        attributes: [
          'country',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'clicks'],
          [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN lp_viewed = true THEN 1 ELSE 0 END')), 'lpviews'],
          [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN conversion = true THEN 1 ELSE 0 END')), 'conversions'],
          [db.sequelize.fn('SUM', db.sequelize.col('revenue')), 'revenue'],
          [db.sequelize.fn('SUM', db.sequelize.col('cost')), 'cost'],
          [db.sequelize.fn('SUM', db.sequelize.col('profit')), 'profit']
        ],
        where,
        group: ['country'],
        raw: true
      });
      
      // Calculate derived metrics for each country
      const metricsData = clicks.map(country => {
        const clicksVal = parseInt(country.clicks) || 0;
        const lpviews = parseInt(country.lpviews) || 0;
        const conversions = parseInt(country.conversions) || 0;
        const revenue = parseFloat(country.revenue) || 0;
        const cost = parseFloat(country.cost) || 0;
        const profit = parseFloat(country.profit) || 0;
        
        const cr = clicksVal > 0 ? (conversions / clicksVal) * 100 : 0;
        const offerCr = lpviews > 0 ? (conversions / lpviews) * 100 : 0;
        const cpc = clicksVal > 0 ? cost / clicksVal : 0;
        const epc = clicksVal > 0 ? revenue / clicksVal : 0;
        const lpepc = lpviews > 0 ? revenue / lpviews : 0;
        const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
        
        return {
          dimension: country.country || 'Unknown',
          clicks: clicksVal,
          lpviews,
          conversions,
          revenue,
          cost,
          profit,
          cr,
          offer_cr: offerCr,
          cpc,
          epc,
          lpepc,
          roi
        };
      });
      
      return res.json(metricsData);
    }
    
    // Get metrics data (for non-country dimensions)
    // This line was causing the error - we need to ensure attributes is never empty
    const queryOptions = { 
      where,
      attributes,
      order: group_by === 'date' ? [['date', 'ASC']] : null
    };
    
    // Only add group if we have groupByFields
    if (groupByFields.length > 0) {
      queryOptions.group = groupByFields;
    }
    
    const metrics = await Metrics.findAll(queryOptions);
    
    // If grouping by something, calculate derived metrics
    if (group_by === 'traffic_channel') {
      const metricsData = metrics.map(metric => {
        const data = metric.toJSON();
        
        // Calculate derived metrics
        const clicks = parseInt(data.clicks) || 0;
        const impressions = parseInt(data.impressions) || 0;
        const lpviews = parseInt(data.lpviews) || 0;
        const lpclicks = parseInt(data.lpclicks) || 0;
        const conversions = parseInt(data.conversions) || 0;
        const revenue = parseFloat(data.total_revenue) || 0;
        const cost = parseFloat(data.total_cost) || 0;
        const profit = parseFloat(data.profit) || 0;
        
        // Calculate ratios
        data.ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        data.lpctr = lpviews > 0 ? (lpclicks / lpviews) * 100 : 0;
        data.cr = clicks > 0 ? (conversions / clicks) * 100 : 0;
        data.offer_cr = lpviews > 0 ? (conversions / lpviews) * 100 : 0;
        data.cpc = clicks > 0 ? cost / clicks : 0;
        data.cpm = impressions > 0 ? (cost / impressions) * 1000 : 0;
        data.epc = clicks > 0 ? revenue / clicks : 0;
        data.lpepc = lpviews > 0 ? revenue / lpviews : 0;
        data.roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
        data.ctc = conversions > 0 ? cost / conversions : 0;
        
        return data;
      });
      
      return res.json(metricsData);
    }
    
    return res.json(metrics);
  } catch (error) {
    console.error('❌ Error getting metrics:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});
/**
 * Update metrics for various tracking events
 */
async function updateMetrics(campaignId, trafficChannelId, eventType, revenue = 0) {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();
    
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
    } else if (eventType === 'lpclick') {
      campaignMetrics.lpclicks += 1;
    } else if (eventType === 'conversion') {
      campaignMetrics.conversions += 1;
      campaignMetrics.total_revenue += revenue;
      campaignMetrics.profit = campaignMetrics.total_revenue - campaignMetrics.total_cost;
    }
    
    // Calculate derived metrics
    calculateDerivedMetrics(campaignMetrics);
    await campaignMetrics.save();
    
    // Find or create hourly metrics for campaign
    let [campaignHourlyMetrics] = await Metrics.findOrCreate({
      where: {
        unique_id: campaignId,
        date: today,
        hour: hour
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
    
    // Update campaign hourly metrics based on event type
    if (eventType === 'click') {
      campaignHourlyMetrics.clicks += 1;
    } else if (eventType === 'lpview') {
      campaignHourlyMetrics.lpviews += 1;
    } else if (eventType === 'lpclick') {
      campaignHourlyMetrics.lpclicks += 1;
    } else if (eventType === 'conversion') {
      campaignHourlyMetrics.conversions += 1;
      campaignHourlyMetrics.total_revenue += revenue;
      campaignHourlyMetrics.profit = campaignHourlyMetrics.total_revenue - campaignHourlyMetrics.total_cost;
    }
    
    // Calculate derived metrics for hourly data
    calculateDerivedMetrics(campaignHourlyMetrics);
    await campaignHourlyMetrics.save();
    
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
      } else if (eventType === 'lpclick') {
        tcMetrics.lpclicks += 1;
      } else if (eventType === 'conversion') {
        tcMetrics.conversions += 1;
        tcMetrics.total_revenue += revenue;
        tcMetrics.profit = tcMetrics.total_revenue - tcMetrics.total_cost;
      }
      
      // Calculate derived metrics for traffic channel
      calculateDerivedMetrics(tcMetrics);
      await tcMetrics.save();
      
      // Also update traffic channel hourly metrics
      let [tcHourlyMetrics] = await Metrics.findOrCreate({
        where: {
          traffic_channel_id: trafficChannelId,
          date: today,
          hour: hour
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
      
      // Update traffic channel hourly metrics based on event type
      if (eventType === 'click') {
        tcHourlyMetrics.clicks += 1;
      } else if (eventType === 'lpview') {
        tcHourlyMetrics.lpviews += 1;
      } else if (eventType === 'lpclick') {
        tcHourlyMetrics.lpclicks += 1;
      } else if (eventType === 'conversion') {
        tcHourlyMetrics.conversions += 1;
        tcHourlyMetrics.total_revenue += revenue;
        tcHourlyMetrics.profit = tcHourlyMetrics.total_revenue - tcHourlyMetrics.total_cost;
      }
      
      // Calculate derived metrics for traffic channel hourly data
      calculateDerivedMetrics(tcHourlyMetrics);
      await tcHourlyMetrics.save();
      
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
      } else if (eventType === 'lpclick') {
        combinedMetrics.lpclicks += 1;
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
function calculateDerivedMetrics(metrics) {
  // CTR (Click-Through Rate)
  if (metrics.impressions > 0) {
    metrics.ctr = (metrics.clicks / metrics.impressions) * 100 || 0;
  }
  
  // LP CTR (Landing Page Click-Through Rate)
  if (metrics.lpviews > 0) {
    metrics.lpctr = (metrics.lpclicks / metrics.lpviews) * 100 || 0;
  }
  
  // Standard conversion metrics
  if (metrics.clicks > 0) {
    metrics.cr = (metrics.conversions / metrics.clicks) * 100 || 0;
    metrics.cpc = metrics.total_cost / metrics.clicks || 0;
    metrics.epc = metrics.total_revenue / metrics.clicks || 0;
  }
  
  // Landing page conversion metrics
  if (metrics.lpviews > 0) {
    metrics.offer_cr = (metrics.conversions / metrics.lpviews) * 100 || 0;
    metrics.lpepc = metrics.total_revenue / metrics.lpviews || 0;
  }
  
  // ROI metrics
  if (metrics.total_cost > 0) {
    metrics.roi = ((metrics.total_revenue - metrics.total_cost) / metrics.total_cost) * 100 || 0;
    metrics.total_roi = metrics.roi;
  }
  
  // CPA metrics
  if (metrics.conversions > 0) {
    metrics.ctc = metrics.total_cost / metrics.conversions || 0;
    metrics.total_cpa = metrics.ctc;
  }
  
  // CPM metrics
  if (metrics.impressions > 0) {
    metrics.cpm = (metrics.total_cost / metrics.impressions) * 1000 || 0;
  }
}

/**
 * Extract sub parameters from a query object
 */
function extractSubsFromQuery(query) {
  if (!query) return {};
  
  const subs = {};
  
  for (let i = 1; i <= 23; i++) {
    const subParam = `sub${i}`;
    if (query[subParam] !== undefined) {
      subs[subParam] = query[subParam];
    }
  }
  
  return subs;
}

/**
 * Get macro values for a specific click
 */
async function getMacroValues(clickId) {
  if (!clickId) {
    throw new Error('Click ID is required');
  }
  
  const macro = await Macro.findOne({ 
    where: { click_id: clickId },
    include: [
      {
        model: Clicks,
        as: 'click',
        include: [
          { model: Campaigns, as: 'campaign' },
          { model: TrafficChannel, as: 'traffic_channel' }
        ]
      }
    ]
  });
  
  if (!macro) {
    throw new Error(`Macro with click_id ${clickId} not found`);
  }
  
  // Construct values object from macro data
  const values = {
    click_id: macro.click_id,
    unique_id: macro.unique_id,
    campaign_name: macro.campaign_name || macro.click?.campaign?.name || '',
    traffic_channel_id: macro.traffic_channel_id,
    traffic_source: macro.traffic_source || macro.click?.traffic_channel?.channelName || '',
    lander_id: macro.lander_id || '',
    lander_name: macro.lander_name || '',
    offer_id: macro.offer_id || '',
    offer_name: macro.offer_name || '',
    payout: macro.payout || '0',
    revenue: macro.revenue || '0',
    profit: macro.profit || '0',
    user_agent: macro.user_agent || macro.click?.user_agent || '',
    ip: macro.ip || macro.click?.ip || '',
    country: macro.country || macro.click?.country || '',
    city: macro.city || macro.click?.city || '',
    region: macro.region || macro.click?.region || '',
    timestamp: macro.click?.createdAt ? macro.click.createdAt.toISOString() : '',
    date: macro.click?.createdAt ? macro.click.createdAt.toISOString().split('T')[0] : '',
    time: macro.click?.createdAt ? macro.click.createdAt.toISOString().split('T')[1].split('.')[0] : ''
  };
  
  // Add sub values
  for (let i = 1; i <= 23; i++) {
    const subKey = `sub${i}`;
    if (macro[subKey] !== undefined) {
      values[subKey] = macro[subKey];
    } else {
      values[subKey] = '';
    }
  }
  
  return values;
}

/**
 * Replace macros in a URL with actual values
 */
function replaceMacros(url, values) {
  if (!url) return '';
  
  let processedUrl = url;
  
  // Replace system macros
  for (const [key, macro] of Object.entries(MACRO_PLACEHOLDERS)) {
    const valueKey = key.toLowerCase();
    if (values[valueKey] !== undefined) {
      const regex = new RegExp(escapeRegExp(macro), 'g');
      processedUrl = processedUrl.replace(regex, values[valueKey]);
    }
  }
  
  return processedUrl;
}

/**
 * Generate postback URL for traffic source
 */
async function generatePostbackUrl(baseUrl, clickId) {
  if (!baseUrl || !clickId) return '';
  
  try {
    // Get macro values for this click
    const values = await getMacroValues(clickId);
    
    // Replace macros in postback URL
    const postbackUrl = replaceMacros(baseUrl, values);
    
    return postbackUrl;
  } catch (error) {
    console.error('Error generating postback URL:', error);
    throw error;
  }
}

/**
 * Send postback to traffic source
 */
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

/**
 * Helper function to escape special characters in macros for regex
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get geo data from IP
 */
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
    try {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`);
      
      return {
        country: response.data.country_name || 'Unknown',
        country_code: response.data.country_code || 'XX',
        region: response.data.region || 'Unknown',
        city: response.data.city || 'Unknown',
        isp: response.data.org || 'Unknown'
      };
    } catch (ipError) {
      console.error('Error getting geo data from IP API:', ipError);
      // Fallback to defaults
      return {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        isp: 'Unknown'
      };
    }
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

/**
 * Parse browser from user agent
 */
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

/**
 * Parse OS from user agent
 */
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

/**
 * Parse device type from user agent
 */
function parseDevice(userAgent) {
  if (!userAgent) return 'Unknown';
  
  // Simple device detection - in production use a proper user-agent parser library
  if (userAgent.includes('Mobile')) return 'Mobile';
  if (userAgent.includes('Tablet') || userAgent.includes('iPad')) return 'Tablet';
  
  return 'Desktop';
}

console.log('📝 Track routes initialized and exported');
module.exports = router;