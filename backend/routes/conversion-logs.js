// routes/conversion-logs.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Conversion, Clicks, Campaigns, TrafficChannel, Lander, Offer, Macro } = require('../models');

/**
 * Get conversion logs with filtering options
 * Mirrors RedTrack's conversion logs functionality
 */
router.get('/', async (req, res) => {
  try {
    // Extract query parameters
    const {
      campaign_id,
      traffic_channel_id,
      lander_id,
      offer_id,
      country,
      start_date,
      end_date,
      ip,
      device,
      os,
      browser,
      sub_parameter,
      sub_value,
      minimum_revenue,
      maximum_revenue,
      page = 1,
      limit = 25,
      sort_by = 'createdAt',
      sort_order = 'DESC'
    } = req.query;

    // Build click query conditions (conversions are linked to clicks)
    const clickWhere = {};
    
    if (campaign_id) {
      clickWhere.unique_id = campaign_id;
    }
    
    if (traffic_channel_id) {
      clickWhere.traffic_channel_id = traffic_channel_id;
    }
    
    if (lander_id) {
      clickWhere.lander_id = lander_id;
    }
    
    if (offer_id) {
      clickWhere.offer_id = offer_id;
    }
    
    if (country) {
      clickWhere.country = country;
    }
    
    if (device) {
      clickWhere.device = device;
    }
    
    if (os) {
      clickWhere.os = os;
    }
    
    if (browser) {
      clickWhere.browser = browser;
    }
    
    if (ip) {
      clickWhere.ip = ip;
    }
    
    // Ensure we only get converted clicks
    clickWhere.conversion = true;
    
    // Conversion-specific filters
    const conversionWhere = {};
    
    // Date range
    if (start_date && end_date) {
      conversionWhere.createdAt = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    } else if (start_date) {
      conversionWhere.createdAt = {
        [Op.gte]: new Date(start_date)
      };
    } else if (end_date) {
      conversionWhere.createdAt = {
        [Op.lte]: new Date(end_date)
      };
    }
    
    // Revenue range
    if (minimum_revenue || maximum_revenue) {
      conversionWhere.revenue = {};
      
      if (minimum_revenue) {
        conversionWhere.revenue[Op.gte] = parseFloat(minimum_revenue);
      }
      
      if (maximum_revenue) {
        conversionWhere.revenue[Op.lte] = parseFloat(maximum_revenue);
      }
    }
    
    // Special handling for sub parameter filtering
    let macroWhere = {};
    if (sub_parameter && sub_value) {
      macroWhere[sub_parameter] = sub_value;
    }
    
    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Query with all options
    const { count, rows } = await Conversion.findAndCountAll({
      where: conversionWhere,
      include: [
        {
          model: Clicks,
          as: 'click',
          where: clickWhere,
          include: [
            { model: Campaigns, as: 'campaign' },
            { model: TrafficChannel, as: 'traffic_channel' },
            { model: Lander, as: 'lander' },
            { model: Offer, as: 'offer' },
            {
              model: Macro,
              as: 'macro',
              where: Object.keys(macroWhere).length > 0 ? macroWhere : undefined,
              required: Object.keys(macroWhere).length > 0
            }
          ]
        }
      ],
      order: [[sort_by, sort_order]],
      limit: parseInt(limit),
      offset,
      distinct: true
    });
    
    // Process results to flatten structure
    const processedConversions = rows.map(conversion => {
      const conversionData = conversion.toJSON();
      const clickData = conversionData.click || {};
      
      // Format conversion data
      const formatted = {
        id: conversionData.id,
        click_id: conversionData.click_id,
        timestamp: conversionData.createdAt,
        revenue: conversionData.revenue,
        cost: clickData.cost || 0,
        profit: conversionData.profit || conversionData.revenue - (clickData.cost || 0),
        
        // Click info
        ip: clickData.ip,
        country: clickData.country,
        region: clickData.region,
        city: clickData.city,
        device: clickData.device,
        os: clickData.os,
        browser: clickData.browser,
        
        // Related entities
        campaign_id: clickData.unique_id,
        campaign_name: clickData.campaign?.name,
        traffic_channel_id: clickData.traffic_channel_id,
        traffic_source: clickData.traffic_channel?.channelName,
        lander_id: clickData.lander_id,
        lander_name: clickData.lander?.name,
        offer_id: clickData.offer_id,
        offer_name: clickData.offer?.name,
        
        // Time from click to conversion
        click_time: new Date(clickData.createdAt).toISOString(),
        conversion_time: new Date(conversionData.createdAt).toISOString(),
        time_to_convert: Math.floor((new Date(conversionData.createdAt) - new Date(clickData.createdAt)) / 1000) // in seconds
      };
      
      // Extract sub parameters if macro data is available
      if (clickData.macro) {
        for (let i = 1; i <= 23; i++) {
          const subKey = `sub${i}`;
          if (clickData.macro[subKey]) {
            formatted[subKey] = clickData.macro[subKey];
          }
        }
      }
      
      return formatted;
    });
    
    // Return data with pagination info
    return res.json({
      conversions: processedConversions,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error getting conversion logs:', error);
    return res.status(500).json({ error: 'Failed to retrieve conversion logs', details: error.message });
  }
});

/**
 * Get a single conversion with full details
 */
router.get('/:id', async (req, res) => {
  try {
    const conversion = await Conversion.findByPk(req.params.id, {
      include: [
        {
          model: Clicks,
          as: 'click',
          include: [
            { model: Campaigns, as: 'campaign' },
            { model: TrafficChannel, as: 'traffic_channel' },
            { model: Lander, as: 'lander' },
            { model: Offer, as: 'offer' },
            { model: Macro, as: 'macro' }
          ]
        }
      ]
    });
    
    if (!conversion) {
      return res.status(404).json({ error: 'Conversion not found' });
    }
    
    // Format and enhance the conversion data
    const conversionData = conversion.toJSON();
    const clickData = conversionData.click || {};
    
    // Format conversion data
    const formatted = {
      id: conversionData.id,
      click_id: conversionData.click_id,
      timestamp: conversionData.createdAt,
      revenue: conversionData.revenue,
      cost: clickData.cost || 0,
      profit: conversionData.profit || conversionData.revenue - (clickData.cost || 0),
      
      // Click info
      ip: clickData.ip,
      country: clickData.country,
      region: clickData.region,
      city: clickData.city,
      device: clickData.device,
      os: clickData.os,
      browser: clickData.browser,
      user_agent: clickData.user_agent,
      
      // Related entities
      campaign_id: clickData.unique_id,
      campaign_name: clickData.campaign?.name,
      traffic_channel_id: clickData.traffic_channel_id,
      traffic_source: clickData.traffic_channel?.channelName,
      lander_id: clickData.lander_id,
      lander_name: clickData.lander?.name,
      offer_id: clickData.offer_id,
      offer_name: clickData.offer?.name,
      
      // Time from click to conversion
      click_time: new Date(clickData.createdAt).toISOString(),
      conversion_time: new Date(conversionData.createdAt).toISOString(),
      time_to_convert: Math.floor((new Date(conversionData.createdAt) - new Date(clickData.createdAt)) / 1000), // in seconds
      
      // Postback info
      postback_sent: conversionData.postback_sent || false,
      postback_url: conversionData.postback_url,
      postback_response: conversionData.postback_response
    };
    
    // Extract sub parameters if macro data is available
    if (clickData.macro) {
      formatted.sub_parameters = {};
      for (let i = 1; i <= 23; i++) {
        const subKey = `sub${i}`;
        if (clickData.macro[subKey]) {
          formatted.sub_parameters[subKey] = clickData.macro[subKey];
          formatted[subKey] = clickData.macro[subKey]; // Also add directly for convenience
        }
      }
    }
    
    // Timeline of events
    formatted.timeline = [
      {
        event_type: 'click',
        timestamp: clickData.createdAt,
        details: {
          ip: clickData.ip,
          device: clickData.device,
          browser: clickData.browser,
          os: clickData.os,
          country: clickData.country
        }
      }
    ];
    
    // Add LP view if it happened
    if (clickData.lp_viewed) {
      formatted.timeline.push({
        event_type: 'lp_view',
        timestamp: clickData.lp_view_time || clickData.createdAt,
        details: {
          lander_id: clickData.lander_id,
          lander_name: clickData.lander?.name
        }
      });
    }
    
    // Add conversion event
    formatted.timeline.push({
      event_type: 'conversion',
      timestamp: conversionData.createdAt,
      details: {
        revenue: conversionData.revenue,
        profit: formatted.profit,
        offer_id: clickData.offer_id,
        offer_name: clickData.offer?.name
      }
    });
    
    // Add postback event if it was sent
    if (conversionData.postback_sent) {
      formatted.timeline.push({
        event_type: 'postback',
        timestamp: conversionData.postback_time || conversionData.createdAt,
        details: {
          postback_url: conversionData.postback_url,
          postback_response: conversionData.postback_response
        }
      });
    }
    
    return res.json(formatted);
  } catch (error) {
    console.error('❌ Error getting conversion detail:', error);
    return res.status(500).json({ error: 'Failed to retrieve conversion details', details: error.message });
  }
});

/**
 * Get available filters for conversion logs
 * Returns all distinct values for key fields to populate filter dropdowns
 */
router.get('/filters/options', async (req, res) => {
  try {
    // Get unique campaigns
    const campaigns = await Campaigns.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    
    // Get unique traffic sources
    const trafficSources = await TrafficChannel.findAll({
      attributes: ['id', 'channelName'],
      order: [['channelName', 'ASC']]
    });
    
    // Get unique landers
    const landers = await Lander.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    
    // Get unique offers
    const offers = await Offer.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    
    // Get unique countries
    const countries = await Clicks.findAll({
      attributes: ['country'],
      group: ['country'],
      where: {
        country: {
          [Op.ne]: null
        },
        conversion: true
      },
      order: [['country', 'ASC']]
    });
    
    // Get unique devices
    const devices = await Clicks.findAll({
      attributes: ['device'],
      group: ['device'],
      where: {
        device: {
          [Op.ne]: null
        },
        conversion: true
      },
      order: [['device', 'ASC']]
    });
    
    // Get unique operating systems
    const operatingSystems = await Clicks.findAll({
      attributes: ['os'],
      group: ['os'],
      where: {
        os: {
          [Op.ne]: null
        },
        conversion: true
      },
      order: [['os', 'ASC']]
    });
    
    // Get unique browsers
    const browsers = await Clicks.findAll({
      attributes: ['browser'],
      group: ['browser'],
      where: {
        browser: {
          [Op.ne]: null
        },
        conversion: true
      },
      order: [['browser', 'ASC']]
    });
    
    // Get revenue range
    const revenueStats = await Conversion.findAll({
      attributes: [
        [db.sequelize.fn('MIN', db.sequelize.col('revenue')), 'min_revenue'],
        [db.sequelize.fn('MAX', db.sequelize.col('revenue')), 'max_revenue'],
        [db.sequelize.fn('AVG', db.sequelize.col('revenue')), 'avg_revenue']
      ],
      raw: true
    });
    
    // Return all filter options
    return res.json({
      campaigns: campaigns.map(c => ({ id: c.id, name: c.name })),
      traffic_sources: trafficSources.map(ts => ({ id: ts.id, name: ts.channelName })),
      landers: landers.map(l => ({ id: l.id, name: l.name })),
      offers: offers.map(o => ({ id: o.id, name: o.name })),
      countries: countries.map(c => c.country),
      devices: devices.map(d => d.device),
      operating_systems: operatingSystems.map(os => os.os),
      browsers: browsers.map(b => b.browser),
      revenue_range: {
        min: revenueStats[0]?.min_revenue || 0,
        max: revenueStats[0]?.max_revenue || 0,
        avg: revenueStats[0]?.avg_revenue || 0
      },
      sub_parameters: Array.from({ length: 23 }, (_, i) => `sub${i + 1}`)
    });
  } catch (error) {
    console.error('❌ Error getting filter options:', error);
    return res.status(500).json({ error: 'Failed to retrieve filter options', details: error.message });
  }
});

/**
 * Export conversion logs to CSV
 */
router.get('/export/csv', async (req, res) => {
  try {
    // Use same filtering logic as the main endpoint
    const {
      campaign_id,
      traffic_channel_id,
      lander_id,
      offer_id,
      country,
      start_date,
      end_date,
      ip,
      device,
      os,
      browser,
      sub_parameter,
      sub_value,
      minimum_revenue,
      maximum_revenue
    } = req.query;

    // Build click query conditions
    const clickWhere = {};
    
    if (campaign_id) clickWhere.unique_id = campaign_id;
    if (traffic_channel_id) clickWhere.traffic_channel_id = traffic_channel_id;
    if (lander_id) clickWhere.lander_id = lander_id;
    if (offer_id) clickWhere.offer_id = offer_id;
    if (country) clickWhere.country = country;
    if (device) clickWhere.device = device;
    if (os) clickWhere.os = os;
    if (browser) clickWhere.browser = browser;
    if (ip) clickWhere.ip = ip;
    
    // Ensure we only get converted clicks
    clickWhere.conversion = true;
    
    // Conversion-specific filters
    const conversionWhere = {};
    
    // Date range
    if (start_date && end_date) {
      conversionWhere.createdAt = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    } else if (start_date) {
      conversionWhere.createdAt = {
        [Op.gte]: new Date(start_date)
      };
    } else if (end_date) {
      conversionWhere.createdAt = {
        [Op.lte]: new Date(end_date)
      };
    }
    
    // Revenue range
    if (minimum_revenue || maximum_revenue) {
      conversionWhere.revenue = {};
      
      if (minimum_revenue) {
        conversionWhere.revenue[Op.gte] = parseFloat(minimum_revenue);
      }
      
      if (maximum_revenue) {
        conversionWhere.revenue[Op.lte] = parseFloat(maximum_revenue);
      }
    }
    
    // Special handling for sub parameter filtering
    let macroWhere = {};
    if (sub_parameter && sub_value) {
      macroWhere[sub_parameter] = sub_value;
    }
    
    // Get all matching conversions (no pagination for export)
    const conversions = await Conversion.findAll({
      where: conversionWhere,
      include: [
        {
          model: Clicks,
          as: 'click',
          where: clickWhere,
          include: [
            { model: Campaigns, as: 'campaign' },
            { model: TrafficChannel, as: 'traffic_channel' },
            { model: Lander, as: 'lander' },
            { model: Offer, as: 'offer' },
            {
              model: Macro,
              as: 'macro',
              where: Object.keys(macroWhere).length > 0 ? macroWhere : undefined,
              required: Object.keys(macroWhere).length > 0
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10000 // Cap at 10k for performance
    });
    
    // Generate CSV headers
    const csvHeaders = [
      'ID',
      'Click ID',
      'Click Date',
      'Click Time',
      'Conversion Date',
      'Conversion Time',
      'Time to Convert (s)',
      'Campaign',
      'Traffic Source',
      'Lander',
      'Offer',
      'Country',
      'Region',
      'City',
      'IP',
      'Device',
      'OS',
      'Browser',
      'Revenue',
      'Cost',
      'Profit',
      'Postback Sent'
    ];
    
    // Add sub parameters to headers
    for (let i = 1; i <= 23; i++) {
      csvHeaders.push(`Sub${i}`);
    }
    
    // Format each conversion for CSV
    const csvRows = conversions.map(conversion => {
      const conversionData = conversion.toJSON();
      const clickData = conversionData.click || {};
      
      const conversionDate = new Date(conversionData.createdAt);
      const conversionDateStr = conversionDate.toISOString().split('T')[0];
      const conversionTimeStr = conversionDate.toISOString().split('T')[1].split('.')[0];
      
      const clickDate = new Date(clickData.createdAt || conversionData.createdAt);
      const clickDateStr = clickDate.toISOString().split('T')[0];
      const clickTimeStr = clickDate.toISOString().split('T')[1].split('.')[0];
      
      const timeToConvert = Math.floor((conversionDate - clickDate) / 1000);
      
      const row = [
        conversionData.id,
        conversionData.click_id,
        clickDateStr,
        clickTimeStr,
        conversionDateStr,
        conversionTimeStr,
        timeToConvert,
        clickData.campaign?.name || '',
        clickData.traffic_channel?.channelName || '',
        clickData.lander?.name || '',
        clickData.offer?.name || '',
        clickData.country || '',
        clickData.region || '',
        clickData.city || '',
        clickData.ip || '',
        clickData.device || '',
        clickData.os || '',
        clickData.browser || '',
        conversionData.revenue?.toFixed(2) || '0.00',
        clickData.cost?.toFixed(2) || '0.00',
        (conversionData.profit || (conversionData.revenue - (clickData.cost || 0)))?.toFixed(2) || '0.00',
        conversionData.postback_sent ? 'Yes' : 'No'
      ];
      
      // Add sub values
      for (let i = 1; i <= 23; i++) {
        const subKey = `sub${i}`;
        row.push(clickData.macro?.[subKey] || '');
      }
      
      return row;
    });
    
    // Combine headers and rows
    csvRows.unshift(csvHeaders);
    
    // Convert to CSV string
    const csvContent = csvRows.map(row => row.map(cell => {
      // Escape quotes and wrap in quotes if needed
      const escaped = ('' + (cell || '')).replace(/"/g, '""');
      return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
    }).join(',')).join('\n');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=conversion-logs.csv');
    
    // Send CSV data
    return res.send(csvContent);
  } catch (error) {
    console.error('❌ Error exporting conversion logs:', error);
    return res.status(500).json({ error: 'Failed to export conversion logs', details: error.message });
  }
});

module.exports = router;