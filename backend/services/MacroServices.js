const { MACROS } = require('../../config/constants');
const db = require('../models');

class MacroService {
  /**
   * Parse incoming URL query parameters and store macros
   * @param {Object} query - URL query parameters
   * @param {Number} trafficChannelId - ID of traffic channel
   * @param {Number} campaignId - ID of campaign (optional)
   * @return {Object} - Created macro object
   */
  async parseAndStoreMacros(query, trafficChannelId, campaignId = null) {
    try {
      // Find the traffic channel to get its macro format
      const trafficChannel = await db.TrafficChannel.findByPk(trafficChannelId);
      if (!trafficChannel) {
        throw new Error(`Traffic channel with ID ${trafficChannelId} not found`);
      }

      // Create a macro object with available sub values
      const macroData = {
        traffic_channel_id: trafficChannelId,
        campaign_id: campaignId
      };

      // Dynamically map query parameters to sub values based on the
      // traffic channel's macro format configuration
      if (trafficChannel.macro_format) {
        const macroFormat = trafficChannel.macro_format;
        
        // Loop through macro format to find corresponding query params
        for (const [macroName, queryParam] of Object.entries(macroFormat)) {
          if (macroName.startsWith('sub') && query[queryParam]) {
            macroData[macroName] = query[queryParam];
          }
        }
      } else {
        // If no specific format, use default mapping (assume subs are named sub1, sub2, etc.)
        for (let i = 1; i <= 23; i++) {
          const subName = `sub${i}`;
          if (query[subName]) {
            macroData[subName] = query[subName];
          }
        }
      }

      // Create the macro record
      const macro = await db.Macro.create(macroData);
      return macro;
    } catch (error) {
      console.error('Error parsing and storing macros:', error);
      throw error;
    }
  }

  /**
   * Associate a macro with a click
   * @param {Number} macroId - ID of the macro
   * @param {Number} clickId - ID of the click
   * @return {Object} - Updated macro object
   */
  async associateWithClick(macroId, clickId) {
    try {
      const macro = await db.Macro.findByPk(macroId);
      if (!macro) {
        throw new Error(`Macro with ID ${macroId} not found`);
      }

      macro.click_id = clickId;
      await macro.save();
      return macro;
    } catch (error) {
      console.error('Error associating macro with click:', error);
      throw error;
    }
  }

  /**
   * Generate a tracking URL with macros for a specific traffic channel
   * @param {Number} trafficChannelId - ID of traffic channel
   * @param {Number} campaignId - ID of campaign
   * @param {Object} params - Additional parameters to include
   * @return {String} - Tracking URL with macros
   */
  async generateTrackingUrl(trafficChannelId, campaignId, params = {}) {
    try {
      // Get traffic channel and campaign information
      const trafficChannel = await db.TrafficChannel.findByPk(trafficChannelId);
      const campaign = await db.Campaign.findByPk(campaignId, {
        include: [
          { model: db.Offer },
          { model: db.Lander }
        ]
      });

      if (!trafficChannel || !campaign) {
        throw new Error('Traffic channel or campaign not found');
      }

      // Base URL is either the template URL or the tracking URL
      let baseUrl = trafficChannel.template_url || trafficChannel.tracking_url;
      
      // Create URL object for manipulation
      const url = new URL(baseUrl);
      
      // Add campaign ID parameter
      url.searchParams.append('campaign_id', campaignId);
      
      // Add traffic channel ID parameter
      url.searchParams.append('tc', trafficChannelId);
      
      // Add system macros
      url.searchParams.append('click_id', MACROS.CLICK_ID);
      
      // Add custom parameters
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
      }
      
      // If this traffic channel has a specific macro format, use it
      if (trafficChannel.macro_format) {
        const macroFormat = trafficChannel.macro_format;
        
        // Add specific sub parameters based on the macro format
        for (let i = 1; i <= 23; i++) {
          const subName = `sub${i}`;
          const formatParam = macroFormat[subName];
          
          if (formatParam) {
            url.searchParams.append(formatParam, MACROS[`SUB${i}`]);
          }
        }
      }
      
      return url.toString();
    } catch (error) {
      console.error('Error generating tracking URL:', error);
      throw error;
    }
  }

  /**
   * Replace macros in a URL with actual values
   * @param {String} url - URL with macros
   * @param {Object} values - Values to replace macros with
   * @return {String} - URL with replaced macros
   */
  replaceMacros(url, values) {
    try {
      let processedUrl = url;
      
      // Replace system macros
      for (const [key, macro] of Object.entries(MACROS)) {
        if (values[key.toLowerCase()]) {
          const regex = new RegExp(this.escapeRegExp(macro), 'g');
          processedUrl = processedUrl.replace(regex, values[key.toLowerCase()]);
        }
      }
      
      // Replace custom sub macros
      for (let i = 1; i <= 23; i++) {
        const subKey = `sub${i}`;
        const subMacro = MACROS[`SUB${i}`] || `{${subKey}}`;
        
        if (values[subKey]) {
          const regex = new RegExp(this.escapeRegExp(subMacro), 'g');
          processedUrl = processedUrl.replace(regex, values[subKey]);
        }
      }
      
      return processedUrl;
    } catch (error) {
      console.error('Error replacing macros:', error);
      throw error;
    }
  }

  /**
   * Generate postback URL for conversions
   * @param {Number} clickId - ID of the click that converted
   * @param {Number} conversionValue - Value of the conversion
   * @return {String} - Postback URL with replaced macros
   */
  async generatePostbackUrl(clickId, conversionValue) {
    try {
      // Get the click with related data
      const click = await db.Click.findByPk(clickId, {
        include: [
          { model: db.TrafficChannel },
          { model: db.Campaign },
          { model: db.Offer },
          { model: db.Macro }
        ]
      });

      if (!click || !click.TrafficChannel || !click.TrafficChannel.postback_url) {
        throw new Error('Click data or postback URL not found');
      }

      // Get the base postback URL
      const postbackUrl = click.TrafficChannel.postback_url;
      
      // Gather values for replacement
      const values = {
        click_id: clickId,
        campaign_id: click.campaign_id,
        campaign_name: click.Campaign?.name || '',
        traffic_source: click.TrafficChannel.name,
        offer_id: click.offer_id,
        offer_name: click.Offer?.name || '',
        payout: conversionValue.toString()
      };
      
      // Add sub values from the macro
      if (click.Macro) {
        for (let i = 1; i <= 23; i++) {
          const subKey = `sub${i}`;
          if (click.Macro[subKey]) {
            values[subKey] = click.Macro[subKey];
          }
        }
      }
      
      // Replace macros in the postback URL
      return this.replaceMacros(postbackUrl, values);
    } catch (error) {
      console.error('Error generating postback URL:', error);
      throw error;
    }
  }

  /**
   * Helper function to escape special characters in macros for regex
   * @param {String} string - String to escape
   * @return {String} - Escaped string
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = new MacroService();