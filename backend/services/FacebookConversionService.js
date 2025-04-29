// services/FacebookConversionService.js
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

class FacebookConversionService {
    /**
     * Send a conversion event to Facebook Conversions API
     * 
     * @param {Object} params - Parameters for the conversion event
     * @param {string} params.pixelId - Facebook Pixel ID
     * @param {string} params.accessToken - Facebook API Access Token
     * @param {string} params.eventName - Event name (e.g., 'Purchase', 'Lead')
     * @param {Object} params.clickData - Click record from database
     * @param {Object} params.conversionData - Conversion record from database
     * @param {Object} params.macroValues - Macro values for this click/conversion
     * @returns {Promise<Object>} - Facebook API response
     */
    static async sendConversion(params) {
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

            // Extract user data from click
            const userData = this._prepareUserData(clickData, macroValues);
            
            // Extract event data
            const eventData = this._prepareEventData(eventName, conversionData, macroValues);
            
            // Current timestamp in seconds
            const eventTime = Math.floor(Date.now() / 1000);
            
            // Prepare the event payload
            const eventPayload = {
                data: [
                    {
                        event_name: eventName,
                        event_time: eventTime,
                        event_source_url: macroValues.SOURCE_URL || '',
                        action_source: 'website',
                        user_data: userData,
                        custom_data: eventData
                    }
                ],
                test_event_code: process.env.NODE_ENV === 'production' ? undefined : 'TEST12345'
            };
            
            logger.debug('📦 Facebook event payload:', JSON.stringify(eventPayload));
            
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
            
            logger.info(`✅ Facebook Conversion sent successfully for click_id: ${clickData.id}`);
            return response.data;
            
        } catch (error) {
            logger.error('❌ Facebook Conversion API Error:', error.response?.data || error.message);
            throw error;
        }
    }
    
    /**
     * Prepare user data for Facebook Conversions API
     * We hash all user identifiers as required by Facebook
     */
    static _prepareUserData(clickData, macroValues) {
        const userData = {
            client_ip_address: clickData.ip || '',
            client_user_agent: clickData.user_agent || '',
            fbc: macroValues.FBC || '',  // Facebook click ID cookie
            fbp: macroValues.FBP || '',  // Facebook browser ID cookie
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
            userData.external_id = this._hashData(macroValues.sub1);
        }
        
        // Add em (email) if available (usually in sub params)
        if (macroValues.email || macroValues.sub2) {
            userData.em = this._hashData(macroValues.email || macroValues.sub2);
        }
        
        // Add phone if available (usually in sub params)
        if (macroValues.phone || macroValues.sub3) {
            userData.ph = this._hashData(macroValues.phone || macroValues.sub3);
        }
        
        // Add customer value parameters
        userData.customer_value = {
            ltv: parseFloat(macroValues.LTV || '0'),
            num_conversions: parseInt(macroValues.NUM_CONVERSIONS || '1')
        };
        
        return userData;
    }
    
    /**
     * Prepare event-specific data for Facebook Conversions API
     */
    static _prepareEventData(eventName, conversionData, macroValues) {
        const eventData = {
            value: conversionData.revenue || 0,
            currency: macroValues.CURRENCY || 'USD',
            content_name: macroValues.OFFER_NAME || '',
            content_ids: [macroValues.OFFER_ID || '']
        };
        
        // Add campaign info
        if (macroValues.CAMPAIGN_ID) {
            eventData.campaign_id = macroValues.CAMPAIGN_ID;
        }
        
        if (macroValues.CAMPAIGN_NAME) {
            eventData.campaign_name = macroValues.CAMPAIGN_NAME;
        }
        
        // Add order ID if available
        if (macroValues.ORDER_ID || macroValues.sub4) {
            eventData.order_id = macroValues.ORDER_ID || macroValues.sub4;
        }
        
        // Add custom parameters based on event type
        switch (eventName.toLowerCase()) {
            case 'purchase':
                eventData.num_items = parseInt(macroValues.QUANTITY || macroValues.sub5 || '1');
                break;
                
            case 'lead':
                eventData.lead_type = macroValues.LEAD_TYPE || macroValues.sub5 || 'standard';
                break;
                
            case 'subscribe':
                eventData.subscription_id = macroValues.SUBSCRIPTION_ID || macroValues.sub5 || '';
                break;
        }
        
        // Add all other sub parameters as custom properties
        for (const [key, value] of Object.entries(macroValues)) {
            if (key.startsWith('sub') && !['sub1', 'sub2', 'sub3', 'sub4', 'sub5'].includes(key)) {
                eventData[`custom_${key}`] = value;
            }
        }
        
        return eventData;
    }
    
    /**
     * Hash data according to Facebook's requirements (SHA256)
     */
    static _hashData(data) {
        if (!data) return '';
        return crypto.createHash('sha256').update(String(data).toLowerCase().trim()).digest('hex');
    }
}

module.exports = FacebookConversionService;