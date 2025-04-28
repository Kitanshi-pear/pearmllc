// services/MacroService.js
const db = require('../models');

class MacroService {
  constructor() {
    // Standard system macros
    this.SYSTEM_MACROS = {
      CLICK_ID: '{click_id}',
      CAMPAIGN_ID: '{campaign_id}',
      CAMPAIGN_NAME: '{campaign_name}',
      TRAFFIC_SOURCE: '{traffic_source}',
      TRAFFIC_SOURCE_ID: '{traffic_source_id}',
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
      ISP: '{isp}',
      BROWSER: '{browser}',
      OS: '{os}',
      DEVICE: '{device}',
      TIMESTAMP: '{timestamp}',
      DATE: '{date}',
      TIME: '{time}'
    };

    // Sub token macros (1-23 like RedTrack)
    this.SUB_MACROS = {};
    for (let i = 1; i <= 23; i++) {
      this.SUB_MACROS[`SUB${i}`] = `{sub${i}}`;
    }

    // Combined macros
    this.ALL_MACROS = { ...this.SYSTEM_MACROS, ...this.SUB_MACROS };
  }
  
  /**
   * Extract macros from a URL or string
   * @param {String} url - URL or string to extract macros from
   * @returns {Array} - Array of extracted macros
   */
  extractMacros(url) {
    if (!url) return [];
    
    const macros = [];
    const macroPattern = /{([^{}]+)}/g;
    let match;
    
    while ((match = macroPattern.exec(url)) !== null) {
      macros.push(match[0]);
    }
    
    return [...new Set(macros)]; // Remove duplicates
  }
  
  /**
   * Store macros for a specific click
   * @param {String} clickId - Click ID
   * @param {Object} values - Values for macros
   * @returns {Object} - Created macro record
   */
  async storeMacros(clickId, values) {
    try {
      if (!clickId) {
        throw new Error('Click ID is required');
      }
      
      // Create basic macro data
      const macroData = {
        click_id: clickId,
        traffic_channel_id: values.traffic_channel_id || null,
        campaign_id: values.campaign_id || null
      };
      
      // Add system macro values
      for (const [key, macro] of Object.entries(this.SYSTEM_MACROS)) {
        const valueKey = key.toLowerCase();
        if (values[valueKey] !== undefined) {
          macroData[valueKey] = values[valueKey];
        }
      }
      
      // Add sub parameters
      for (let i = 1; i <= 23; i++) {
        const subKey = `sub${i}`;
        if (values[subKey] !== undefined) {
          macroData[subKey] = values[subKey];
        }
      }
      
      // Create or update macro record
      const [macro, created] = await db.Macro.findOrCreate({
        where: { click_id: clickId },
        defaults: macroData
      });
      
      if (!created) {
        // Update existing record
        await macro.update(macroData);
      }
      
      return macro;
    } catch (error) {
      console.error('Error storing macros:', error);
      throw error;
    }
  }
  
  /**
   * Get macro values for a specific click
   * @param {String} clickId - Click ID
   * @returns {Object} - Macro values
   */
  async getMacroValues(clickId) {
    try {
      if (!clickId) {
        throw new Error('Click ID is required');
      }
      
      const macro = await db.Macro.findOne({ 
        where: { click_id: clickId },
        include: [
          {
            model: db.Click,
            as: 'click',
            include: [
              { model: db.Campaign, as: 'campaign' },
              { model: db.TrafficChannel, as: 'traffic_channel' }
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
        campaign_id: macro.campaign_id,
        campaign_name: macro.click?.campaign?.name || '',
        traffic_source_id: macro.traffic_channel_id,
        traffic_source: macro.click?.traffic_channel?.channelName || '',
        lander_id: macro.lander_id || '',
        lander_name: macro.lander_name || '',
        offer_id: macro.offer_id || '',
        offer_name: macro.offer_name || '',
        payout: macro.payout || '0',
        revenue: macro.revenue || '0',
        profit: macro.profit || '0',
        user_agent: macro.click?.user_agent || '',
        ip: macro.click?.ip || '',
        country: macro.click?.country || '',
        city: macro.click?.city || '',
        region: macro.click?.region || '',
        isp: macro.click?.isp || '',
        browser: macro.click?.browser || '',
        os: macro.click?.os || '',
        device: macro.click?.device || '',
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
    } catch (error) {
      console.error('Error getting macro values:', error);
      throw error;
    }
  }
  
  /**
   * Extract sub parameters from a URL or query object
   * @param {Object} query - Query parameters object
   * @returns {Object} - Extracted sub parameters
   */
  extractSubsFromQuery(query) {
    if (!query) return {};
    
    const subs = {};
    
    // Extract sub parameters
    for (let i = 1; i <= 23; i++) {
      const subParam = `sub${i}`;
      if (query[subParam] !== undefined) {
        subs[subParam] = query[subParam];
      }
    }
    
    return subs;
  }
  
  /**
   * Replace macros in a URL with actual values
   * @param {String} url - URL with macros
   * @param {Object} values - Values for macros
   * @returns {String} - URL with replaced macros
   */
  replaceMacros(url, values) {
    if (!url) return '';
    
    let processedUrl = url;
    
    // Replace system macros
    for (const [key, macro] of Object.entries(this.ALL_MACROS)) {
      const valueKey = key.toLowerCase();
      if (values[valueKey] !== undefined) {
        const regex = new RegExp(this.escapeRegExp(macro), 'g');
        processedUrl = processedUrl.replace(regex, values[valueKey]);
      }
    }
    
    return processedUrl;
  }
  
  /**
   * Generate tracking URL with macros
   * @param {Object} campaign - Campaign object
   * @param {Object} options - Additional options
   * @returns {String} - Tracking URL
   */
  generateTrackingUrl(campaign, options = {}) {
    if (!campaign) return '';
    
    const { baseUrl = process.env.TRACKING_DOMAIN || 'https://yourdomain.com', subParams = {} } = options;
    
    // Construct base tracking URL
    let trackingUrl = `${baseUrl}/click?campaign_id=${campaign.id}`;
    
    // Add traffic source if provided
    if (options.trafficSourceId) {
      trackingUrl += `&tc=${options.trafficSourceId}`;
    }
    
    // Add sub parameters
    for (const [key, value] of Object.entries(subParams)) {
      if (key.startsWith('sub') && value) {
        trackingUrl += `&${key}=${encodeURIComponent(value)}`;
      }
    }
    
    return trackingUrl;
  }
  
  /**
   * Generate postback URL for traffic source
   * @param {String} baseUrl - Base postback URL from traffic source
   * @param {String} clickId - Click ID
   * @returns {String} - Generated postback URL
   */
  async generatePostbackUrl(baseUrl, clickId) {
    if (!baseUrl || !clickId) return '';
    
    try {
      // Get macro values for this click
      const values = await this.getMacroValues(clickId);
      
      // Replace macros in postback URL
      const postbackUrl = this.replaceMacros(baseUrl, values);
      
      return postbackUrl;
    } catch (error) {
      console.error('Error generating postback URL:', error);
      throw error;
    }
  }
  
  /**
   * Helper function to escape special characters in macros for regex
   * @param {String} string - String to escape
   * @returns {String} - Escaped string
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = new MacroService();