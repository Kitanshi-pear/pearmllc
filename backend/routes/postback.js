// routes/postback.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { Click, Conversion, TrafficSource, Campaign, Offer } = require('../models');

// Simple logging utility that doesn't require winston
const logger = {
  error: (message, ...args) => console.error(`❌ ERROR: ${message}`, ...args),
  warn: (message, ...args) => console.warn(`⚠️ WARN: ${message}`, ...args),
  info: (message, ...args) => console.info(`✅ INFO: ${message}`, ...args),
  debug: (message, ...args) => console.debug(`📝 DEBUG: ${message}`, ...args)
};

// Utils for handling macros
const macroUtil = {
  // Extract macros from a URL string (format: {macro_name})
  extractMacros: (url) => {
    const macroRegex = /\{([a-zA-Z0-9_]+)\}/g;
    const matches = url.match(macroRegex) || [];
    return matches.map(match => match.replace('{', '').replace('}', ''));
  },

  // Get macro values for a click
  getMacroValues: async (clickId) => {
    try {
      // Get click with all related data
      const click = await Click.findByPk(clickId, {
        include: [
          { model: Campaign, attributes: ['id', 'name', 'offer_id'] },
          { model: TrafficSource, attributes: ['id', 'name', 'type'] },
          { model: Offer, attributes: ['id', 'name', 'payout'] }
        ]
      });

      if (!click) return {};

      // Basic click macros
      const macros = {
        click_id: clickId,
        campaign_id: click.campaign_id || '',
        traffic_source_id: click.traffic_source_id || '',
        ip: click.ip || '',
        user_agent: click.user_agent || '',
        country: click.country || '',
        city: click.city || '',
        region: click.region || '',
        device: click.device || '',
        os: click.os || '',
        browser: click.browser || '',
        timestamp: click.createdAt ? click.createdAt.toISOString() : '',
        date: click.createdAt ? click.createdAt.toISOString().split('T')[0] : '',
        time: click.createdAt ? click.createdAt.toISOString().split('T')[1].split('.')[0] : ''
      };

      // Campaign macros
      if (click.Campaign) {
        macros.campaign_name = click.Campaign.name || '';
      }

      // Traffic source macros
      if (click.TrafficSource) {
        macros.traffic_source = click.TrafficSource.name || '';
        macros.traffic_source_type = click.TrafficSource.type || '';
      }

      // Offer macros
      if (click.Offer) {
        macros.offer_id = click.Offer.id || '';
        macros.offer_name = click.Offer.name || '';
        macros.payout = click.Offer.payout || '';
      }

      // Sub ID macros (from click data)
      const clickData = click.toJSON();
      for (let i = 1; i <= 23; i++) {
        const subKey = `sub${i}`;
        if (clickData[subKey]) {
          macros[subKey] = clickData[subKey];
        }
      }

      return macros;
    } catch (error) {
      logger.error(`Error getting macro values for click ${clickId}:`, error);
      return {};
    }
  },

  // Hash data for sending to ad platforms (SHA256)
  hashData: (data) => {
    if (!data) return '';
    return crypto.createHash('sha256').update(String(data).toLowerCase().trim()).digest('hex');
  }
};

// Facebook Conversion API Service
const facebookConversionService = {
  sendConversion: async (params) => {
    try {
      const {
        pixelId,
        accessToken,
        eventName = 'Purchase',
        clickData,
        conversionData,
        macroValues
      } = params;

      // Validate required parameters
      if (!pixelId || !accessToken) {
        throw new Error('Missing required Facebook parameters: pixelId or accessToken');
      }

      // Extract user data
      const userData = {
        client_ip_address: clickData.ip || '',
        client_user_agent: clickData.user_agent || '',
        fbc: macroValues.fbc || '',
        fbp: macroValues.fbp || '',
      };

      // Add country if available
      if (clickData.country) {
        userData.country = clickData.country;
      }

      // Add city if available
      if (clickData.city) {
        userData.city = clickData.city;
      }

      // Add state if available
      if (clickData.region) {
        userData.state = clickData.region;
      }

      // Add external ID if available (usually sub1)
      if (macroValues.sub1) {
        userData.external_id = macroUtil.hashData(macroValues.sub1);
      }

      // Add em (email) if available (usually in sub params)
      if (macroValues.email || macroValues.sub2) {
        userData.em = macroUtil.hashData(macroValues.email || macroValues.sub2);
      }

      // Add phone if available (usually in sub params)
      if (macroValues.phone || macroValues.sub3) {
        userData.ph = macroUtil.hashData(macroValues.phone || macroValues.sub3);
      }

      // Event data
      const eventData = {
        value: parseFloat(conversionData.revenue) || 0,
        currency: macroValues.currency || 'USD',
        content_name: macroValues.offer_name || '',
        content_ids: [macroValues.offer_id || '']
      };

      // Add campaign info
      if (macroValues.campaign_id) {
        eventData.campaign_id = macroValues.campaign_id;
      }

      if (macroValues.campaign_name) {
        eventData.campaign_name = macroValues.campaign_name;
      }

      // Add order ID if available
      if (macroValues.order_id || macroValues.sub4) {
        eventData.order_id = macroValues.order_id || macroValues.sub4;
      }

      // Current timestamp in seconds
      const eventTime = Math.floor(Date.now() / 1000);

      // Prepare the event payload
      const eventPayload = {
        data: [
          {
            event_name: eventName,
            event_time: eventTime,
            event_source_url: macroValues.source_url || '',
            action_source: 'website',
            user_data: userData,
            custom_data: eventData
          }
        ],
        test_event_code: process.env.NODE_ENV === 'production' ? undefined : 'TEST12345'
      };

      logger.debug('Facebook event payload:', JSON.stringify(eventPayload));

      // Send to Facebook Conversions API
      const response = await axios.post(
        `https://graph.facebook.com/v17.0/${pixelId}/events`,
        eventPayload,
        {
          params: {
            access_token: accessToken
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Facebook Conversion sent successfully for click_id: ${clickData.id}`);
      return response.data;

    } catch (error) {
      logger.error('Facebook Conversion API Error:', error.response?.data || error.message);
      throw error;
    }
  }
};

// Google Conversion API Service
const googleConversionService = {
  sendConversion: async (params) => {
    try {
      const {
        accountId,
        conversionId,
        conversionLabel,
        clickData,
        conversionData,
        macroValues
      } = params;

      // Validate required parameters
      if (!accountId || !conversionId || !conversionLabel) {
        throw new Error('Missing required Google parameters: accountId, conversionId, or conversionLabel');
      }

      // Extract Google Click ID (gclid) if available
      const gclid = macroValues.gclid || macroValues.sub1 || '';

      // Prepare payload for HTTP conversion tracking
      const payload = {
        conversion_id: conversionId,
        conversion_label: conversionLabel,
        conversion_value: parseFloat(conversionData.revenue) || 0,
        conversion_currency: macroValues.currency || 'USD',
        gclid: gclid,
        remarketing_only: false,
        // Add enhanced conversion parameters if available
        email: macroUtil.hashData(macroValues.email || macroValues.sub2 || ''),
        phone_number: macroUtil.hashData(macroValues.phone || macroValues.sub3 || '')
      };

      // Add user agent and IP if available
      if (clickData.user_agent) {
        payload.user_agent = clickData.user_agent;
      }

      if (clickData.ip) {
        payload.ip_address = clickData.ip;
      }

      // Google conversion tracking endpoint
      const url = 'https://www.googleadservices.com/pagead/conversion/';

      // Send the conversion to Google HTTP endpoint
      const response = await axios.post(`${url}${conversionId}/?cv=${conversionLabel}`, payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      logger.info(`Google HTTP Conversion sent for click_id: ${clickData.id}`);
      return {
        id: conversionData.id,
        status: 'sent',
        details: response.data
      };
    } catch (error) {
      logger.error('Google HTTP Conversion Error:', error.response?.data || error.message);
      throw error;
    }
  }
};

// Main postback endpoint that receives conversion data
router.get('/conversion', async (req, res) => {
  try {
    console.log('📣 Postback received:', req.query);
    
    // Get the click_id from the request query parameters
    const clickId = req.query.click_id;
    if (!clickId) {
      console.error('❌ No click_id provided in postback');
      return res.status(400).json({ error: 'Missing click_id parameter' });
    }
    
    // Look up the click in the database
    const click = await Click.findByPk(clickId, {
      include: [
        { model: Campaign, attributes: ['id', 'name', 'offer_id'] },
        { model: TrafficSource, attributes: ['id', 'name', 'type', 'external_id', 'api_key', 'pixel_id', 'default_event_name', 'google_ads_id', 'conversion_id', 'conversion_label'] }
      ]
    });
    
    if (!click) {
      console.error(`❌ Click with ID ${clickId} not found`);
      return res.status(404).json({ error: 'Click not found' });
    }
    
    // Get the offer details if available
    let offer = null;
    if (click.Campaign && click.Campaign.offer_id) {
      offer = await Offer.findByPk(click.Campaign.offer_id, {
        attributes: ['id', 'name', 'payout']
      });
    }

    // Extract conversion parameters from the request
    const payout = parseFloat(req.query.payout) || (offer ? offer.payout : 0);
    const revenue = parseFloat(req.query.revenue) || payout;
    const eventName = req.query.event_name || (click.TrafficSource ? click.TrafficSource.default_event_name : 'conversion');
    
    // Create a conversion record
    const conversion = await Conversion.create({
      click_id: clickId,
      campaign_id: click.campaign_id,
      traffic_source_id: click.traffic_source_id,
      offer_id: offer ? offer.id : null,
      payout,
      revenue,
      profit: revenue - (click.cost || 0),
      status: 'completed',
      event_name: eventName,
      metadata: JSON.stringify(req.query)
    });
    
    console.log(`✅ Conversion recorded with ID: ${conversion.id}`);
    
    // Send conversion data to appropriate platforms based on traffic source
    if (click.TrafficSource) {
      const trafficSource = click.TrafficSource;
      const sourceType = trafficSource.type ? trafficSource.type.toLowerCase() : '';
      
      // Extract macro values for this click
      const macroValues = await macroUtil.getMacroValues(clickId);
      
      // Add conversion-specific macros
      macroValues.payout = payout.toString();
      macroValues.revenue = revenue.toString();
      macroValues.profit = (revenue - (click.cost || 0)).toString();
      macroValues.event_name = eventName;
      
      if (sourceType === 'facebook') {
        // Send to Facebook Conversions API
        if (trafficSource.api_key && trafficSource.pixel_id) {
          try {
            const fbResult = await facebookConversionService.sendConversion({
              pixelId: trafficSource.pixel_id,
              accessToken: trafficSource.api_key,
              eventName,
              clickData: click,
              conversionData: conversion,
              macroValues
            });
            
            console.log(`✅ Facebook conversion sent: ${fbResult.id || 'success'}`);
          } catch (fbError) {
            console.error('❌ Facebook conversion error:', fbError);
            // Continue processing even if Facebook fails
          }
        } else {
          console.warn('⚠️ Facebook source missing api_key or pixel_id');
        }
      } else if (sourceType === 'google') {
        // Send to Google Ads Conversion Tracking
        if (trafficSource.google_ads_id) {
          try {
            const googleResult = await googleConversionService.sendConversion({
              accountId: trafficSource.google_ads_id,
              conversionId: trafficSource.conversion_id || req.query.google_conversion_id || 'default',
              conversionLabel: trafficSource.conversion_label || req.query.google_conversion_label || 'default',
              clickData: click,
              conversionData: conversion,
              macroValues
            });
            
            console.log(`✅ Google conversion sent: ${googleResult.id || 'success'}`);
          } catch (googleError) {
            console.error('❌ Google conversion error:', googleError);
            // Continue processing even if Google fails
          }
        } else {
          console.warn('⚠️ Google source missing google_ads_id');
        }
      }
    }
    
    // Always return a 200 response to the postback requester
    // This prevents retries and duplicates from the postback source
    res.status(200).json({
      success: true,
      conversion_id: conversion.id
    });
    
  } catch (error) {
    console.error('❌ Postback error:', error);
    
    // Always return success to postback source even if there's an error
    // Internal error handling should be done through monitoring/alerts
    res.status(200).json({
      success: false,
      error: 'Internal processing error'
    });
  }
});

// Dedicated Facebook postback endpoint (alternative to the main one)
router.get('/facebook', (req, res) => {
  // Add Facebook-specific parameters to the request and forward to the main endpoint
  req.query.platform = 'facebook';
  
  // Forward to the main conversion endpoint
  req.url = '/conversion?' + new URLSearchParams(req.query).toString();
  router.handle(req, res);
});

// Dedicated Google postback endpoint (alternative to the main one)
router.get('/google', (req, res) => {
  // Add Google-specific parameters to the request and forward to the main endpoint
  req.query.platform = 'google';
  
  // Forward to the main conversion endpoint
  req.url = '/conversion?' + new URLSearchParams(req.query).toString();
  router.handle(req, res);
});

// Endpoint to generate a postback URL for a specific click
router.get('/generate/:clickId', async (req, res) => {
  try {
    const { clickId } = req.params;
    
    // Verify the click exists
    const click = await Click.findByPk(clickId);
    if (!click) {
      return res.status(404).json({ error: 'Click not found' });
    }
    
    // Base URL of your application
    const baseUrl = process.env.BACKEND_URL || 'https://pearmllc.onrender.com';
    
    // Generate a postback URL with the click_id
    const postbackUrl = `${baseUrl}/api/postback/conversion?click_id=${clickId}`;
    
    // Allow additional parameters to be added
    const additionalParams = req.query;
    let finalUrl = postbackUrl;
    
    for (const [key, value] of Object.entries(additionalParams)) {
      finalUrl += `&${key}=${encodeURIComponent(value)}`;
    }
    
    res.json({
      click_id: clickId,
      postback_url: finalUrl,
      example_usage: `${finalUrl}&payout=10.00&event_name=purchase`
    });
    
  } catch (error) {
    console.error('❌ Error generating postback URL:', error);
    res.status(500).json({ error: 'Failed to generate postback URL' });
  }
});

// Retrieve conversion status for a click
router.get('/status/:clickId', async (req, res) => {
  try {
    const { clickId } = req.params;
    
    // Find all conversions for this click
    const conversions = await Conversion.findAll({
      where: { click_id: clickId },
      order: [['createdAt', 'DESC']]
    });
    
    if (conversions.length === 0) {
      return res.json({
        click_id: clickId,
        has_conversion: false,
        conversions: []
      });
    }
    
    res.json({
      click_id: clickId,
      has_conversion: true,
      conversions: conversions.map(conv => ({
        id: conv.id,
        status: conv.status,
        event_name: conv.event_name,
        payout: conv.payout,
        revenue: conv.revenue,
        created_at: conv.createdAt
      }))
    });
    
  } catch (error) {
    console.error('❌ Error checking conversion status:', error);
    res.status(500).json({ error: 'Failed to check conversion status' });
  }
});

// Endpoint to test the postback system without creating a real conversion
router.get('/test', (req, res) => {
  try {
    console.log('📝 Postback test requested');
    
    // Return a success message
    res.json({
      success: true,
      message: 'Postback route is working properly',
      query_params: req.query
    });
  } catch (error) {
    console.error('❌ Postback test error:', error);
    res.status(500).json({ error: 'Postback test failed' });
  }
});

module.exports = router;