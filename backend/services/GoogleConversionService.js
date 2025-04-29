// services/GoogleConversionService.js
const axios = require('axios');
const { GoogleAdsApi } = require('google-ads-api');
const logger = require('../utils/logger');

class GoogleConversionService {
    /**
     * Send a conversion event to Google Ads Conversion Tracking API
     * 
     * @param {Object} params - Parameters for the conversion event
     * @param {string} params.accountId - Google Ads Account ID
     * @param {string} params.conversionId - Google Conversion ID
     * @param {string} params.conversionLabel - Google Conversion Label
     * @param {Object} params.clickData - Click record from database
     * @param {Object} params.conversionData - Conversion record from database
     * @param {Object} params.macroValues - Macro values for this click/conversion
     * @returns {Promise<Object>} - Google API response
     */
    static async sendConversion(params) {
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

            // For HTTP POST conversion tracking method
            if (process.env.GOOGLE_CONVERSION_METHOD === 'http') {
                return this._sendHttpConversion(params);
            }
            
            // For Google Ads API method (preferred)
            return this._sendGoogleAdsApiConversion(params);
        } catch (error) {
            logger.error('❌ Google Conversion API Error:', error.message);
            throw error;
        }
    }

    /**
     * Send conversion using Google Ads API
     * This is the preferred method as it supports more features
     */
    static async _sendGoogleAdsApiConversion(params) {
        const {
            accountId,
            conversionId,
            conversionLabel,
            clickData,
            conversionData,
            macroValues
        } = params;

        try {
            // Initialize Google Ads API client
            // Note: This requires OAuth setup as shown in traffic-channels.js
            const client = new GoogleAdsApi({
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                developer_token: process.env.GOOGLE_DEVELOPER_TOKEN
            });

            // Get customer instance
            const customer = client.Customer({
                customer_id: accountId,
                refresh_token: process.env.GOOGLE_REFRESH_TOKEN
            });

            // Extract user data
            const gclid = macroValues.GCLID || macroValues.sub1 || '';
            
            // Get the conversion time (current time or from the conversion record)
            const conversionTime = conversionData.createdAt || new Date();
            
            // Prepare conversion data
            const conversionAction = {
                conversion_action: `customers/${accountId}/conversionActions/${conversionId}`,
                conversion_date_time: conversionTime.toISOString(),
                conversion_value: conversionData.revenue || 0,
                currency_code: macroValues.CURRENCY || 'USD',
                order_id: macroValues.ORDER_ID || macroValues.sub4 || '',
                external_attribution_data: {
                    external_attribution_credit: 1.0,
                    external_attribution_model: 'LAST_CLICK'
                },
                custom_variables: this._prepareCustomVariables(macroValues)
            };
            
            // Use gclid if available
            if (gclid) {
                conversionAction.gclid = gclid;
            } 
            // Fallback to enhanced conversion parameters if no gclid
            else {
                // Prepare enhanced conversion data (email, phone, address, etc)
                conversionAction.user_identifiers = this._prepareUserIdentifiers(macroValues);
            }

            // Send the conversion to Google
            const response = await customer.conversionUploads.uploadClickConversion(conversionAction);
            
            logger.info(`✅ Google Conversion sent successfully for click_id: ${clickData.id}`);
            return {
                id: conversionData.id,
                status: 'sent',
                details: response
            };
        } catch (error) {
            logger.error('❌ Google Ads API Error:', error);
            throw error;
        }
    }

    /**
     * Alternative method: Send conversion using Google's HTTP POST endpoint
     * This can be used as a fallback if API access is not available
     */
    static async _sendHttpConversion(params) {
        const {
            conversionId,
            conversionLabel,
            clickData,
            conversionData,
            macroValues
        } = params;

        try {
            // Google conversion tracking endpoint
            const url = 'https://www.googleadservices.com/pagead/conversion/';
            
            // Extract Google Click ID (gclid) if available
            const gclid = macroValues.GCLID || macroValues.sub1 || '';
            
            // Prepare payload for HTTP conversion tracking
            const payload = {
                conversion_id: conversionId,
                conversion_label: conversionLabel,
                conversion_value: conversionData.revenue || 0,
                conversion_currency: macroValues.CURRENCY || 'USD',
                gclid: gclid,
                remarketing_only: false,
                // Add enhanced conversion parameters if available
                email: macroValues.email || macroValues.sub2 || '',
                phone_number: macroValues.phone || macroValues.sub3 || ''
            };
            
            // Add user agent and IP if available
            if (clickData.user_agent) {
                payload.user_agent = clickData.user_agent;
            }
            
            if (clickData.ip) {
                payload.ip_address = clickData.ip;
            }
            
            // Send the conversion to Google HTTP endpoint
            const response = await axios.post(`${url}${conversionId}/?cv=${conversionLabel}`, payload, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            
            logger.info(`✅ Google HTTP Conversion sent for click_id: ${clickData.id}`);
            return {
                id: conversionData.id,
                status: 'sent',
                details: response.data
            };
        } catch (error) {
            logger.error('❌ Google HTTP Conversion Error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Prepare custom variables for Google Ads API
     */
    static _prepareCustomVariables(macroValues) {
        const customVariables = [];
        
        // Add sub parameters as custom variables
        for (let i = 6; i <= 20; i++) {
            const key = `sub${i}`;
            if (macroValues[key]) {
                customVariables.push({
                    conversion_custom_variable: `customers/${macroValues.ACCOUNT_ID}/conversionCustomVariables/${i-5}`,
                    value: macroValues[key]
                });
            }
        }
        
        // Add campaign info if available
        if (macroValues.CAMPAIGN_NAME) {
            customVariables.push({
                conversion_custom_variable: `customers/${macroValues.ACCOUNT_ID}/conversionCustomVariables/1`,
                value: macroValues.CAMPAIGN_NAME
            });
        }
        
        return customVariables;
    }

    /**
     * Prepare user identifiers for Google Enhanced Conversions
     */
    static _prepareUserIdentifiers(macroValues) {
        const userIdentifiers = [];
        
        // Add email if available
        if (macroValues.email || macroValues.sub2) {
            userIdentifiers.push({
                user_identifier_source: 'EMAIL',
                hashed_email: this._hashUserData(macroValues.email || macroValues.sub2)
            });
        }
        
        // Add phone if available
        if (macroValues.phone || macroValues.sub3) {
            userIdentifiers.push({
                user_identifier_source: 'PHONE',
                hashed_phone_number: this._hashUserData(macroValues.phone || macroValues.sub3)
            });
        }
        
        // Add name if available
        if (macroValues.first_name && macroValues.last_name) {
            userIdentifiers.push({
                user_identifier_source: 'FIRST_PARTY',
                address_info: {
                    hashed_first_name: this._hashUserData(macroValues.first_name),
                    hashed_last_name: this._hashUserData(macroValues.last_name)
                }
            });
        }
        
        return userIdentifiers;
    }

    /**
     * Hash user data for Google Enhanced Conversions
     */
    static _hashUserData(data) {
        if (!data) return '';
        
        // Google requires SHA-256 hashing for enhanced conversions
        return crypto.createHash('sha256')
            .update(String(data).toLowerCase().trim())
            .digest('hex');
    }
}

module.exports = GoogleConversionService;