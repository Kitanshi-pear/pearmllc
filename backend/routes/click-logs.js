// routes/click-logs.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Clicks, Campaigns, TrafficChannel, Lander, Offer, Macro, Conversion } = require('../models');

/**
 * Get click logs with filtering options
 * Mirrors RedTrack's click logs functionality
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
      conversion_status,
      ip,
      device,
      os,
      browser,
      sub_parameter,
      sub_value,
      page = 1,
      limit = 25,
      sort_by = 'createdAt',
      sort_order = 'DESC'
    } = req.query;

    // Build query conditions
    const where = {};
    
    if (campaign_id) {
      where.unique_id = campaign_id;
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
    
    if (country) {
      where.country = country;
    }
    
    if (device) {
      where.device = device;
    }
    
    if (os) {
      where.os = os;
    }
    
    if (browser) {
      where.browser = browser;
    }
    
    if (ip) {
      where.ip = ip;
    }
    
    // Date range
    if (start_date && end_date) {
      where.createdAt = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    } else if (start_date) {
      where.createdAt = {
        [Op.gte]: new Date(start_date)
      };
    } else if (end_date) {
      where.createdAt = {
        [Op.lte]: new Date(end_date)
      };
    }
    
    // Conversion status filtering
    if (conversion_status === 'converted') {
      where.conversion = true;
    } else if (conversion_status === 'not_converted') {
      where.conversion = false;
    }
    
    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Special handling for sub parameter filtering
    let macroWhere = {};
    if (sub_parameter && sub_value) {
      macroWhere[sub_parameter] = sub_value;
    }
    
    // Include macro data conditionally
    const includeOptions = [
      { model: Campaigns, as: 'campaign' },
      { model: TrafficChannel, as: 'traffic_channel' },
      { model: Lander, as: 'lander' },
      { model: Offer, as: 'offer' }
    ];
    
    // Only include macro if filtering by sub parameter or requesting full details
    if (sub_parameter || req.query.include_macros === 'true') {
      includeOptions.push({
        model: Macro,
        as: 'macro',
        where: Object.keys(macroWhere).length > 0 ? macroWhere : undefined
      });
    }
    
    // Include conversion details if requested
    if (req.query.include_conversions === 'true') {
      includeOptions.push({
        model: Conversion,
        as: 'conversion'
      });
    }
    
    // Query with all options
    const { count, rows } = await Clicks.findAndCountAll({
      where,
      include: includeOptions,
      order: [[sort_by, sort_order]],
      limit: parseInt(limit),
      offset,
      distinct: true // For accurate count with includes
    });
    
    // Process results to flatten structure
    const processedClicks = rows.map(click => {
      const clickData = click.toJSON();
      
      // Add campaign name
      if (clickData.campaign) {
        clickData.campaign_name = clickData.campaign.name;
      }
      
      // Add traffic source name
      if (clickData.traffic_channel) {
        clickData.traffic_source = clickData.traffic_channel.channelName;
      }
      
      // Add lander name
      if (clickData.lander) {
        clickData.lander_name = clickData.lander.name;
      }
      
      // Add offer name
      if (clickData.offer) {
        clickData.offer_name = clickData.offer.name;
      }
      
      // Extract sub parameters if macro data is available
      if (clickData.macro) {
        for (let i = 1; i <= 23; i++) {
          const subKey = `sub${i}`;
          if (clickData.macro[subKey]) {
            clickData[subKey] = clickData.macro[subKey];
          }
        }
      }
      
      return clickData;
    });
    
    // Return data with pagination info
    return res.json({
      clicks: processedClicks,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error getting click logs:', error);
    return res.status(500).json({ error: 'Failed to retrieve click logs', details: error.message });
  }
});

/**
 * Get a single click log with full details
 */
router.get('/:id', async (req, res) => {
  try {
    const click = await Clicks.findByPk(req.params.id, {
      include: [
        { model: Campaigns, as: 'campaign' },
        { model: TrafficChannel, as: 'traffic_channel' },
        { model: Lander, as: 'lander' },
        { model: Offer, as: 'offer' },
        { model: Macro, as: 'macro' },
        { model: Conversion, as: 'conversion' }
      ]
    });
    
    if (!click) {
      return res.status(404).json({ error: 'Click not found' });
    }
    
    // Format and enhance the click data
    const clickData = click.toJSON();
    
    // Add campaign name
    if (clickData.campaign) {
      clickData.campaign_name = clickData.campaign.name;
    }
    
    // Add traffic source name
    if (clickData.traffic_channel) {
      clickData.traffic_source = clickData.traffic_channel.channelName;
    }
    
    // Add lander name
    if (clickData.lander) {
      clickData.lander_name = clickData.lander.name;
    }
    
    // Add offer name
    if (clickData.offer) {
      clickData.offer_name = clickData.offer.name;
    }
    
    // Extract timeline events
    const timeline = [];
    
    // Click event
    timeline.push({
      event_type: 'click',
      timestamp: clickData.createdAt,
      details: {
        ip: clickData.ip,
        device: clickData.device,
        browser: clickData.browser,
        os: clickData.os,
        country: clickData.country
      }
    });
    
    // LP view event
    if (clickData.lp_viewed) {
      timeline.push({
        event_type: 'lp_view',
        timestamp: clickData.lp_view_time || clickData.createdAt, // Use lp_view_time if available
        details: {
          lander_id: clickData.lander_id,
          lander_name: clickData.lander_name
        }
      });
    }
    
    // Conversion event
    if (clickData.conversion) {
      timeline.push({
        event_type: 'conversion',
        timestamp: clickData.conversion_time,
        details: {
          revenue: clickData.revenue,
          profit: clickData.profit,
          offer_id: clickData.offer_id,
          offer_name: clickData.offer_name
        }
      });
    }
    
    // Add timeline to response
    clickData.timeline = timeline;
    
    return res.json(clickData);
  } catch (error) {
    console.error('❌ Error getting click detail:', error);
    return res.status(500).json({ error: 'Failed to retrieve click details', details: error.message });
  }
});

/**
 * Get available filters for click logs
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
        }
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
        }
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
        }
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
        }
      },
      order: [['browser', 'ASC']]
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
      conversion_statuses: [
        { id: 'all', name: 'All Clicks' },
        { id: 'converted', name: 'Converted' },
        { id: 'not_converted', name: 'Not Converted' }
      ],
      sub_parameters: Array.from({ length: 23 }, (_, i) => `sub${i + 1}`)
    });
  } catch (error) {
    console.error('❌ Error getting filter options:', error);
    return res.status(500).json({ error: 'Failed to retrieve filter options', details: error.message });
  }
});

/**
 * Export click logs to CSV
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
      conversion_status,
      ip,
      device,
      os,
      browser,
      sub_parameter,
      sub_value
    } = req.query;

    const where = {};
    
    if (campaign_id) where.unique_id = campaign_id;
    if (traffic_channel_id) where.traffic_channel_id = traffic_channel_id;
    if (lander_id) where.lander_id = lander_id;
    if (offer_id) where.offer_id = offer_id;
    if (country) where.country = country;
    if (device) where.device = device;
    if (os) where.os = os;
    if (browser) where.browser = browser;
    if (ip) where.ip = ip;
    
    // Date range
    if (start_date && end_date) {
      where.createdAt = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    } else if (start_date) {
      where.createdAt = {
        [Op.gte]: new Date(start_date)
      };
    } else if (end_date) {
      where.createdAt = {
        [Op.lte]: new Date(end_date)
      };
    }
    
    // Conversion status filtering
    if (conversion_status === 'converted') {
      where.conversion = true;
    } else if (conversion_status === 'not_converted') {
      where.conversion = false;
    }
    
    // Special handling for sub parameter filtering
    let macroWhere = {};
    if (sub_parameter && sub_value) {
      macroWhere[sub_parameter] = sub_value;
    }
    
    // Include options
    const includeOptions = [
      { model: Campaigns, as: 'campaign' },
      { model: TrafficChannel, as: 'traffic_channel' },
      { model: Lander, as: 'lander' },
      { model: Offer, as: 'offer' },
      {
        model: Macro,
        as: 'macro',
        where: Object.keys(macroWhere).length > 0 ? macroWhere : undefined,
        required: false
      }
    ];
    
    // Get all matching clicks (no pagination for export)
    const clicks = await Clicks.findAll({
      where,
      include: includeOptions,
      order: [['createdAt', 'DESC']],
      limit: 10000 // Cap at 10k for performance
    });
    
    // Generate CSV headers
    const csvHeaders = [
      'ID',
      'Date',
      'Time',
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
      'Converted',
      'Revenue',
      'Cost',
      'Profit'
    ];
    
    // Add sub parameters to headers
    for (let i = 1; i <= 23; i++) {
      csvHeaders.push(`Sub${i}`);
    }
    
    // Format each click for CSV
    const csvRows = clicks.map(click => {
      const clickData = click.toJSON();
      const createdAt = new Date(clickData.createdAt);
      const dateStr = createdAt.toISOString().split('T')[0];
      const timeStr = createdAt.toISOString().split('T')[1].split('.')[0];
      
      const row = [
        clickData.id,
        dateStr,
        timeStr,
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
        clickData.conversion ? 'Yes' : 'No',
        clickData.revenue?.toFixed(2) || '0.00',
        clickData.cost?.toFixed(2) || '0.00',
        clickData.profit?.toFixed(2) || '0.00'
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
    res.setHeader('Content-Disposition', 'attachment; filename=click-logs.csv');
    
    // Send CSV data
    return res.send(csvContent);
  } catch (error) {
    console.error('❌ Error exporting click logs:', error);
    return res.status(500).json({ error: 'Failed to export click logs', details: error.message });
  }
});

module.exports = router;