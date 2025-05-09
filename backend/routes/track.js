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
// API endpoint to get metrics - completely revised for compatibility
// Modify the metrics query in track.js
router.get('/metrics', async (req, res) => {
  try {
    // Handle both unique_id and campaign_id (for backwards compatibility)
    const { 
      unique_id, 
      campaign_id, // Added to handle frontend requests
      traffic_channel_id, 
      lander_id, 
      offer_id, 
      start_date, 
      end_date,
      dimension,
      group_by,
      include_hourly = false
    } = req.query;
    
    // Build query conditions - use campaign_id instead of unique_id
    const where = {};
    
    if (unique_id || campaign_id) {
      // Find the campaign first to get its ID
      const campaignId = campaign_id || unique_id;
      const campaign = await Campaigns.findOne({
        where: { unique_id: campaignId }
      });
      
      if (campaign) {
        // Use campaign_id instead of unique_id for the Metrics table
        where.campaign_id = campaign.id;
      } else {
        console.log(`Campaign not found for unique_id/campaign_id: ${campaignId}`);
        // Return empty metrics data with zeros for all values if no campaign found
        return res.json({
          impressions: 0,
          clicks: 0,
          lpviews: 0,
          lpclicks: 0,
          conversions: 0,
          total_revenue: 0,
          total_cost: 0,
          profit: 0,
          ctr: 0,
          cr: 0,
          offer_cr: 0,
          cpc: 0,
          cpm: 0,
          epc: 0,
          lpepc: 0,
          roi: 0
        });
      }
    }
    
    // Log the query parameters to help with debugging
    console.log('📊 Metrics request:', {
      where,
      traffic_channel_id,
      lander_id,
      offer_id,
      start_date,
      end_date,
      dimension,
      group_by
    });
    
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
    
    // If no data exists for the requested metrics, return empty results rather than error
    // Check if data exists for this query
    const metricsCount = await Metrics.count({ where });
    
    if (metricsCount === 0) {
      console.log('📊 No metrics data found for query:', where);
      
      // Return empty metrics data with zeros for all values
      return res.json({
        impressions: 0,
        clicks: 0,
        lpviews: 0,
        lpclicks: 0,
        conversions: 0,
        total_revenue: 0,
        total_cost: 0,
        profit: 0,
        ctr: 0,
        cr: 0,
        offer_cr: 0,
        cpc: 0,
        cpm: 0,
        epc: 0,
        lpepc: 0,
        roi: 0
      });
    }
    
    // Always include these default attributes
    const defaultAttributes = [
      'id',
      'campaign_id',
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
    
    // Set up the query
    const queryOptions = {
      where,
      raw: true // Return plain JS objects instead of Sequelize instances for better performance
    };
    
    // Handle different group by scenarios
    if (group_by === 'traffic_channel') {
      queryOptions.attributes = [
        'traffic_channel_id',
        [Sequelize.fn('SUM', Sequelize.col('impressions')), 'impressions'],
        [Sequelize.fn('SUM', Sequelize.col('clicks')), 'clicks'],
        [Sequelize.fn('SUM', Sequelize.col('lpviews')), 'lpviews'],
        [Sequelize.fn('SUM', Sequelize.col('lpclicks')), 'lpclicks'],
        [Sequelize.fn('SUM', Sequelize.col('conversions')), 'conversions'],
        [Sequelize.fn('SUM', Sequelize.col('total_revenue')), 'total_revenue'],
        [Sequelize.fn('SUM', Sequelize.col('total_cost')), 'total_cost'],
        [Sequelize.fn('SUM', Sequelize.col('profit')), 'profit']
      ];
      queryOptions.group = ['traffic_channel_id'];
    } else if (group_by === 'date') {
      queryOptions.attributes = [
        'date', 
        'campaign_id',
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
      queryOptions.group = ['date', 'campaign_id'];
      queryOptions.order = [['date', 'ASC']];
    } else if (dimension === 'hour' && include_hourly) {
      queryOptions.attributes = [
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
      queryOptions.group = ['date', 'hour'];
    } else {
      // Default case - no grouping
      queryOptions.attributes = defaultAttributes;
    }
    
    // Special handling for country dimension
    if (dimension === 'country') {
      // For country breakdown, we need to use Clicks model instead
      try {
        const clicks = await Clicks.findAll({
          attributes: [
            'country',
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'clicks'],
            [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN lp_viewed = true THEN 1 ELSE 0 END')), 'lpviews'],
            [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN conversion = true THEN 1 ELSE 0 END')), 'conversions'],
            [Sequelize.fn('SUM', Sequelize.col('revenue')), 'revenue'],
            [Sequelize.fn('SUM', Sequelize.col('cost')), 'cost'],
            [Sequelize.fn('SUM', Sequelize.col('profit')), 'profit']
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
      } catch (countryError) {
        console.error('❌ Error getting country metrics:', countryError);
        return res.status(500).json({ 
          error: 'Error getting country metrics',
          details: countryError.message
        });
      }
    }
    
    // Execute the standard metrics query
    try {
      const metrics = await Metrics.findAll(queryOptions);
      
      // If no metrics were found despite earlier count, return zeros
      if (metrics.length === 0) {
        return res.json({
          impressions: 0,
          clicks: 0,
          lpviews: 0,
          lpclicks: 0,
          conversions: 0,
          total_revenue: 0,
          total_cost: 0,
          profit: 0,
          ctr: 0,
          cr: 0,
          offer_cr: 0,
          cpc: 0,
          cpm: 0,
          epc: 0,
          lpepc: 0,
          roi: 0
        });
      }
      
      // Process metrics data if needed
      if (group_by === 'traffic_channel') {
        const metricsData = metrics.map(metric => {
          // Calculate derived metrics if not already present
          const data = metric;
          
          const clicks = parseInt(data.clicks) || 0;
          const impressions = parseInt(data.impressions) || 0;
          const lpviews = parseInt(data.lpviews) || 0;
          const lpclicks = parseInt(data.lpclicks) || 0;
          const conversions = parseInt(data.conversions) || 0;
          const revenue = parseFloat(data.total_revenue) || 0;
          const cost = parseFloat(data.total_cost) || 0;
          
          // Add calculated metrics
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
      
      // For a single campaign request, sum up the metrics if multiple records
      if ((unique_id || campaign_id) && !group_by && metrics.length > 1) {
        const summedMetrics = metrics.reduce((acc, curr) => {
          // Sum up numeric values
          acc.impressions = (acc.impressions || 0) + (parseInt(curr.impressions) || 0);
          acc.clicks = (acc.clicks || 0) + (parseInt(curr.clicks) || 0);
          acc.lpviews = (acc.lpviews || 0) + (parseInt(curr.lpviews) || 0);
          acc.lpclicks = (acc.lpclicks || 0) + (parseInt(curr.lpclicks) || 0);
          acc.conversions = (acc.conversions || 0) + (parseInt(curr.conversions) || 0);
          acc.total_revenue = (acc.total_revenue || 0) + (parseFloat(curr.total_revenue) || 0);
          acc.total_cost = (acc.total_cost || 0) + (parseFloat(curr.total_cost) || 0);
          acc.profit = (acc.profit || 0) + (parseFloat(curr.profit) || 0);
          return acc;
        }, {});
        
        // Calculate derived metrics for the summed values
        const clicks = summedMetrics.clicks || 0;
        const impressions = summedMetrics.impressions || 0;
        const lpviews = summedMetrics.lpviews || 0;
        const lpclicks = summedMetrics.lpclicks || 0;
        const conversions = summedMetrics.conversions || 0;
        const revenue = summedMetrics.total_revenue || 0;
        const cost = summedMetrics.total_cost || 0;
        
        summedMetrics.ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        summedMetrics.lpctr = lpviews > 0 ? (lpclicks / lpviews) * 100 : 0;
        summedMetrics.cr = clicks > 0 ? (conversions / clicks) * 100 : 0;
        summedMetrics.offer_cr = lpviews > 0 ? (conversions / lpviews) * 100 : 0;
        summedMetrics.cpc = clicks > 0 ? cost / clicks : 0;
        summedMetrics.cpm = impressions > 0 ? (cost / impressions) * 1000 : 0;
        summedMetrics.epc = clicks > 0 ? revenue / clicks : 0;
        summedMetrics.lpepc = lpviews > 0 ? revenue / lpviews : 0;
        summedMetrics.roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
        summedMetrics.ctc = conversions > 0 ? cost / conversions : 0;
        
        return res.json(summedMetrics);
      }
      
      // Just return the metrics as-is
      return res.json(metrics);
      
    } catch (queryError) {
      console.error('❌ Error executing metrics query:', queryError);
      
      // Provide detailed error for debugging
      return res.status(500).json({ 
        error: 'Error executing metrics query',
        details: queryError.message,
        sql: queryError.sql, // Include the SQL that caused the error if available
        query: queryOptions
      });
    }
  } catch (error) {
    console.error('❌ Error getting metrics:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
/**
 * Update metrics for various tracking events
 */
/**
 * Update metrics for various tracking events
 */
async function updateMetrics(campaignId, trafficChannelId, eventType, revenue = 0) {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();
    
    // First, find the campaign to get its ID
    const campaign = await Campaigns.findOne({
      where: { unique_id: campaignId }
    });
    
    if (!campaign) {
      console.error(`❌ Campaign not found for unique_id: ${campaignId}`);
      return;
    }
    
    // Find or create metrics record for campaign using campaign_id
    let [campaignMetrics] = await Metrics.findOrCreate({
      where: {
        campaign_id: campaign.id, // Use campaign_id instead of unique_id
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
        campaign_id: campaign.id, // Use campaign_id instead of unique_id
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
          campaign_id: campaign.id, // Use campaign_id instead of unique_id
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