// services/ConversionApiService.js
const axios = require('axios');
const crypto = require('crypto');
const { Click, Conversion, TrafficChannel, Campaign, OfferSource } = require('../models');

/**
 * Service for handling conversion API integrations
 */
class ConversionApiService {
  /**
   * Process a conversion from a postback URL
   * @param {object} params - Conversion parameters
   * @returns {Promise<object>} Conversion result
   */
  static async processConversion(params) {
    try {
      console.log('🔄 Processing conversion with params:', params);
      
      // Extract required parameters
      const { click_id, payout, event_name = 'conversion', status = 'completed' } = params;
      
      if (!click_id) {
        throw new Error('Missing required parameter: click_id');
      }
      
      // Find the click record
      const click = await Click.findByPk(click_id, {
        include: [
          { model: Campaign },
          { model: TrafficChannel }
        ]
      });
      
      if (!click) {
        throw new Error(`Click with ID ${click_id} not found`);
      }
      
      // Get offer source if available through campaign
      let offerSource = null;
      if (click.Campaign && click.Campaign.offer_source_id) {
        offerSource = await OfferSource.findByPk(click.Campaign.offer_source_id);
      }
      
      // Calculate revenue
      const payoutValue = parseFloat(payout) || (offerSource ? offerSource.payout : 0);
      
      // Create conversion record
      const conversion = await Conversion.create({
        click_id,
        campaign_id: click.campaign_id,
        traffic_channel_id: click.traffic_channel_id,
        offer_source_id: offerSource ? offerSource.id : null,
        payout: payoutValue,
        revenue: payoutValue, // Can be different if using revshare
        status,
        event_name,
        metadata: JSON.stringify(params) // Store all parameters
      });
      
      console.log(`✅ Conversion recorded with ID: ${conversion.id}`);
      
      // Forward to external APIs if enabled
      await this.forwardConversion(conversion, click, offerSource, params);
      
      return {
        success: true,
        conversion_id: conversion.id
      };
    } catch (error) {
      console.error('❌ Error processing conversion:', error);
      throw error;
    }
  }
  
  /**
   * Forward conversion to external APIs
   * @param {object} conversion - Conversion record
   * @param {object} click - Click record
   * @param {object} offerSource - Offer source record
   * @param {object} params - Original parameters
   */
  static async forwardConversion(conversion, click, offerSource, params) {
    try {
      // Get traffic channel
      const trafficChannel = click.TrafficChannel;
      if (!trafficChannel) return;
      
      // Get macro values for the conversion
      const macroValues = await this.getMacroValues(click, conversion, params);
      
      // Forward to Facebook if enabled
      if (
        trafficChannel.pixelId && 
        trafficChannel.apiAccessToken && 
        (
          (offerSource && offerSource.forward_to_facebook) || 
          (trafficChannel.forward_to_facebook)
        )
      ) {
        try {
          const fbResult = await this.sendToFacebook({
            pixelId: trafficChannel.pixelId,
            accessToken: trafficChannel.apiAccessToken,
            eventName: params.event_name || trafficChannel.defaultEventName || 'Purchase',
            conversion,
            click,
            macroValues
          });
          
          // Log successful Facebook conversion to console
          console.log(`✅ Facebook conversion sent for conversion_id: ${conversion.id}`, {
            api_type: 'facebook',
            status: 'success',
            response: JSON.stringify(fbResult).substr(0, 200) + '...'
          });
        } catch (fbError) {
          // Log failed Facebook conversion to console
          console.error('❌ Facebook conversion failed:', fbError, {
            api_type: 'facebook',
            status: 'error',
            conversion_id: conversion.id,
            error: fbError.message || fbError
          });
        }
      }
      
      // Forward to Google if enabled
      if (
        trafficChannel.googleAdsAccountId &&
        (
          (offerSource && offerSource.forward_to_google) || 
          (trafficChannel.forward_to_google)
        )
      ) {
        try {
          const googleResult = await this.sendToGoogle({
            accountId: trafficChannel.googleAdsAccountId,
            conversionId: trafficChannel.conversion_id || params.google_conversion_id,
            conversionLabel: trafficChannel.conversion_label || params.google_conversion_label,
            conversion,
            click,
            macroValues
          });
          
          // Log successful Google conversion to console
          console.log(`✅ Google conversion sent for conversion_id: ${conversion.id}`, {
            api_type: 'google',
            status: 'success',
            response: JSON.stringify(googleResult).substr(0, 200) + '...'
          });
        } catch (googleError) {
          // Log failed Google conversion to console
          console.error('❌ Google conversion failed:', googleError, {
            api_type: 'google',
            status: 'error',
            conversion_id: conversion.id,
            error: googleError.message || googleError
          });
        }
      }
    } catch (error) {
      console.error('❌ Error forwarding conversion:', error);
    }
  }
  
  /**
   * Send conversion to Facebook CAPI
   * @param {object} options - Facebook conversion options
   * @returns {Promise<object>} Facebook API response
   */
  static async sendToFacebook(options) {
    const {
      pixelId,
      accessToken,
      eventName = 'Purchase',
      conversion,
      click,
      macroValues
    } = options;
    
    if (!pixelId || !accessToken) {
      throw new Error('Missing Facebook parameters: pixelId or accessToken');
    }
    
    // Prepare user data
    const userData = {
      client_ip_address: click.ip || '',
      client_user_agent: click.user_agent || '',
      fbp: macroValues.fbp || '',
      fbc: macroValues.fbc || ''
    };
    
    // Add hashed identifiers if available
    if (macroValues.email) {
      userData.em = this.hashData(macroValues.email);
    }
    
    if (macroValues.phone) {
      userData.ph = this.hashData(macroValues.phone);
    }
    
    if (macroValues.external_id || macroValues.sub1) {
      userData.external_id = this.hashData(macroValues.external_id || macroValues.sub1);
    }
    
    // Add location data if available
    if (click.country) userData.country = click.country;
    if (click.city) userData.city = click.city;
    if (click.region) userData.state = click.region;
    
    // Prepare custom data
    const customData = {
      value: parseFloat(conversion.payout) || 0,
      currency: macroValues.currency || 'USD',
      content_name: macroValues.offer_name || '',
      content_ids: [macroValues.offer_id || '']
    };
    
    // Add campaign data if available
    if (macroValues.campaign_id) customData.campaign_id = macroValues.campaign_id;
    if (macroValues.campaign_name) customData.campaign_name = macroValues.campaign_name;
    
    // Prepare event data
    const eventData = {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: userData,
        custom_data: customData
      }],
      access_token: accessToken
    };
    
    console.log('📤 Sending to Facebook CAPI:', JSON.stringify(eventData));
    
    // Send to Facebook
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${pixelId}/events`,
      eventData
    );
    
    return response.data;
  }
  
  /**
   * Send conversion to Google Ads
   * @param {object} options - Google conversion options
   * @returns {Promise<object>} Google API response
   */
  static async sendToGoogle(options) {
    const {
      accountId,
      conversionId,
      conversionLabel,
      conversion,
      click,
      macroValues
    } = options;
    
    if (!accountId || !conversionId || !conversionLabel) {
      throw new Error('Missing Google parameters: accountId, conversionId, or conversionLabel');
    }
    
    // Extract Google Click ID from macroValues
    const gclid = macroValues.gclid || macroValues.sub1 || '';
    
    if (!gclid) {
      throw new Error('Missing gclid parameter required for Google conversion');
    }
    
    // Prepare conversion data
    const conversionData = {
      conversionId,
      conversionLabel,
      gclid,
      value: parseFloat(conversion.payout) || 0,
      currency: macroValues.currency || 'USD'
    };
    
    // Add enhanced conversion parameters if available
    if (macroValues.email) {
      conversionData.email = this.hashData(macroValues.email);
    }
    
    if (macroValues.phone) {
      conversionData.phone = this.hashData(macroValues.phone);
    }
    
    console.log('📤 Sending to Google Ads:', JSON.stringify(conversionData));
    
    // For server-to-server Google Ads conversions, we'd normally use the Google Ads API
    // But here we'll simulate with a simplified HTTP endpoint call
    
    // Replace this with actual Google Ads API call in production
    const response = await axios.post(
      `https://www.googleadservices.com/pagead/conversion/${conversionId}`,
      conversionData
    );
    
    return {
      id: conversion.id,
      status: 'sent',
      response: response.data
    };
  }
  
  /**
   * Get macro values for a click and conversion
   * @param {object} click - Click record
   * @param {object} conversion - Conversion record
   * @param {object} params - Original parameters
   * @returns {Promise<object>} Macro values
   */
  static async getMacroValues(click, conversion, params) {
    try {
      // Basic conversion macros
      const macros = {
        click_id: click.id,
        conversion_id: conversion.id,
        payout: conversion.payout,
        revenue: conversion.revenue,
        ip: click.ip,
        user_agent: click.user_agent,
        timestamp: new Date().toISOString()
      };
      
      // Add all sub parameters from the click
      const clickData = click.toJSON();
      for (let i = 1; i <= 30; i++) {
        const subKey = `sub${i}`;
        if (clickData[subKey]) {
          macros[subKey] = clickData[subKey];
        }
      }
      
      // Add campaign data if available
      if (click.Campaign) {
        macros.campaign_id = click.Campaign.id;
        macros.campaign_name = click.Campaign.name;
      }
      
      // Add traffic source data if available
      if (click.TrafficChannel) {
        macros.traffic_source_id = click.TrafficChannel.id;
        macros.traffic_source = click.TrafficChannel.channelName;
      }
      
      // Add all parameters from the conversion postback
      Object.keys(params).forEach(key => {
        if (!macros[key]) {
          macros[key] = params[key];
        }
      });
      
      return macros;
    } catch (error) {
      console.error('❌ Error getting macro values:', error);
      return {};
    }
  }
  
  /**
   * Hash data for privacy (SHA-256)
   * @param {string} data - Data to hash
   * @returns {string} Hashed data
   */
  static hashData(data) {
    if (!data) return '';
    return crypto.createHash('sha256')
      .update(String(data).toLowerCase().trim())
      .digest('hex');
  }
  
  /**
   * Generate a postback URL for an offer source
   * @param {object} options - Postback URL options
   * @returns {string} Postback URL
   */
  static generatePostbackUrl(options) {
    const {
      baseUrl = process.env.BACKEND_URL || 'https://pearmllc.onrender.com',
      clickIdParam = 'click_id',
      includePayout = true,
      includeStatus = true,
      includeRevenue = false,
      customParams = []
    } = options;
    
    // Build basic postback URL
    let postbackUrl = `${baseUrl}/api/postback/conversion?${clickIdParam}={clickid}`;
    
    // Add optional parameters
    if (includePayout) {
      postbackUrl += '&payout={payout}';
    }
    
    if (includeStatus) {
      postbackUrl += '&status={status}';
    }
    
    if (includeRevenue) {
      postbackUrl += '&revenue={revenue}';
    }
    
    // Add custom parameters
    customParams.forEach(param => {
      postbackUrl += `&${param.name}={${param.value}}`;
    });
    
    return postbackUrl;
  }
}

module.exports = ConversionApiService;