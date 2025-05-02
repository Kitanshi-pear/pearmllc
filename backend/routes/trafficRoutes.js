// routes/traffic-channels.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();
const { TrafficChannel, Campaign, Click, Conversion } = require('../models');
const MetricsService = require('../services/metrics');
const MacroService = require('../services/MacroServices');

// Environment variables for OAuth
const FB_CLIENT_ID = process.env.FB_CLIENT_ID || '1002084978515659';
const FB_CLIENT_SECRET = process.env.FB_CLIENT_SECRET || 'your_fb_client_secret';
const FB_REDIRECT_URI = process.env.FB_REDIRECT_URI;
const CONFIG_ID = process.env.FB_CONFIG_ID || '958823683130260';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Set redirect URIs based on environment
const isProduction = process.env.NODE_ENV === "production";
const BACKEND_URL = isProduction ? process.env.BACKEND_URL : "http://localhost:5000";
const FRONTEND_URL = isProduction ? process.env.FRONTEND_URL : "http://localhost:3000/traffic-channels";
const REDIRECT_URI = `${BACKEND_URL}/auth/google/callback`;

// ----- OAuth Endpoints -----

// Facebook OAuth Login Redirect
router.get('/auth/facebook', (req, res) => {
    console.log("✅ Redirecting to Facebook OAuth...");
    const fbAuthUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${FB_CLIENT_ID}&redirect_uri=${FB_REDIRECT_URI}&scope=public_profile,email,ads_read&config_id=${CONFIG_ID}&response_type=code`;
    res.redirect(fbAuthUrl);
});

// Facebook OAuth Callback
router.get('/auth/facebook/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "No authorization code provided" });

    try {
        console.log("🔹 Received Facebook Auth Code:", code);
        const tokenResponse = await axios.get(`https://graph.facebook.com/v22.0/oauth/access_token`, {
            params: {
                client_id: FB_CLIENT_ID,
                client_secret: FB_CLIENT_SECRET,
                redirect_uri: FB_REDIRECT_URI,
                code,
                config_id: CONFIG_ID
            }
        });

        console.log("✅ Facebook Access Token Response:", tokenResponse.data);

        // Redirect back to frontend with success flag
        res.redirect(`${FRONTEND_URL}?success=true&platform=Facebook`);
    } catch (error) {
        console.error("❌ Facebook OAuth Error:", error.response?.data || error);
        res.redirect(`${FRONTEND_URL}?error=true&platform=Facebook`);
    }
});

// Google OAuth Login Redirect
router.get('/auth/google', (req, res) => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/adwords`;
    console.log("🔹 Redirecting user to:", googleAuthUrl);
    res.redirect(googleAuthUrl);
});

// Google OAuth Callback
router.get('/auth/google/callback', async (req, res) => {
    console.log("🔹 Google OAuth Callback Triggered");
    const { code } = req.query;
    
    if (!code) {
        console.error("❌ No authorization code received.");
        return res.status(400).json({ error: "No authorization code provided" });
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post(`https://oauth2.googleapis.com/token`, {
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: "authorization_code",
            code
        });

        console.log("✅ Google Access Token Response:", tokenResponse.data);

        // Redirect back to frontend with success flag
        res.redirect(`${FRONTEND_URL}?success=true&platform=Google`);
    } catch (error) {
        console.error("❌ Google OAuth Error:", error.response?.data || error);
        res.redirect(`${FRONTEND_URL}?error=true&platform=Google`);
    }
});

// Check OAuth connection status
router.get('/auth/status', async (req, res) => {
    try {
        // In a real implementation, you'd check token validity with the providers
        // For now we'll return mock data
        res.json({
            facebook: {
                connected: false, // Change based on your actual implementation
                expires_at: null
            },
            google: {
                connected: false, // Change based on your actual implementation
                expires_at: null
            }
        });
    } catch (error) {
        console.error("❌ Error checking auth status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ----- CRUD Endpoints -----

// Create Traffic Channel
router.post('/', async (req, res) => {
    try {
        console.log("Received data:", req.body);

        const newChannel = await TrafficChannel.create({
            channelName: req.body.channelName,
            aliasChannel: req.body.aliasChannel,
            costUpdateDepth: req.body.costUpdateDepth,
            costUpdateFrequency: req.body.costUpdateFrequency,
            currency: req.body.currency,
            s2sPostbackUrl: req.body.s2sPostbackUrl,
            clickRefId: req.body.clickRefId,
            externalId: req.body.externalId,
            pixelId: req.body.pixelId,
            apiAccessToken: req.body.apiAccessToken,
            defaultEventName: req.body.defaultEventName,
            customConversionMatching: req.body.customConversionMatching,
            googleAdsAccountId: req.body.googleAdsAccountId,
            googleMccAccountId: req.body.googleMccAccountId,
            status: 'Active'
        });

        res.status(201).json(newChannel);
    } catch (error) {
        console.error("❌ Error saving channel:", error);
        res.status(500).json({ error: "Failed to save channel." });
    }
});

// Get all traffic channels with metrics - CORRECTED VERSION
router.get("/", async (req, res) => {
    try {
        console.log("Fetching traffic channels...");
        console.log(`Current environment: ${process.env.NODE_ENV}`);

        // First verify DB connectivity with a simple query
        try {
            const channelCount = await TrafficChannel.count();
            console.log(`Database connection verified. Total channels: ${channelCount}`);
        } catch (dbError) {
            console.error("❌ Database connection error:", dbError);
            return res.status(500).json({ 
                error: "Database connection failed", 
                details: dbError.message 
            });
        }

        // Fetch all traffic channels
        const channels = await TrafficChannel.findAll({
            attributes: [
                'id', 'channelName', 'aliasChannel', 'costUpdateDepth', 
                'costUpdateFrequency', 'currency', 's2sPostbackUrl', 'status', 
                'createdAt', 'updatedAt'
            ],
            order: [['id', 'ASC']],
        });
        
        console.log(`Successfully fetched ${channels.length} channels`);

        // Return early if no channels found
        if (channels.length === 0) {
            return res.json([]);
        }

        // Get date range for metrics (default to last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        // Format dates for DB query
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];

        // Get metrics for each channel - with error handling
        let metrics = [];
        try {
            console.log("Fetching metrics for channels...");
            
            const metricsPromises = channels.map(channel => {
                try {
                    return MetricsService.getAggregatedMetrics(
                        'traffic_channel', 
                        channel.id, 
                        formattedStartDate, 
                        formattedEndDate
                    ).catch(metricError => {
                        console.error(`Error fetching metrics for channel ${channel.id}:`, metricError);
                        // Return empty metrics instead of failing
                        return {};
                    });
                } catch (promiseError) {
                    console.error(`Error creating metric promise for channel ${channel.id}:`, promiseError);
                    return Promise.resolve({});
                }
            });
            
            // Wait for all metrics to be fetched
            metrics = await Promise.all(metricsPromises);
            console.log("Successfully fetched metrics for all channels");
        } catch (metricsError) {
            console.error("❌ Error in metrics fetching process:", metricsError);
            // Continue with empty metrics rather than failing
            metrics = channels.map(() => ({}));
        }

        // Map channels with their metrics - with error handling
        const channelsWithMetrics = channels.map((channel, index) => {
            try {
                return {
                    ...channel.toJSON(),
                    metrics: metrics[index] || {}
                };
            } catch (mappingError) {
                console.error(`Error mapping channel at index ${index}:`, mappingError);
                // Return a basic object if mapping fails
                return {
                    id: channel.id || 'unknown',
                    channelName: channel.channelName || 'Error processing channel',
                    metrics: {}
                };
            }
        });

        res.json(channelsWithMetrics);
    } catch (error) {
        console.error("❌ Error fetching channels:", error);
        console.error("Error details:", error.message);
        console.error("Stack trace:", error.stack);
        res.status(500).json({ 
            error: "Failed to fetch traffic channels",
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
});

// Get a single traffic channel by ID with metrics
router.get("/:id", async (req, res) => {
    try {
        const channel = await TrafficChannel.findByPk(req.params.id);
        if (!channel) {
            return res.status(404).json({ error: "Channel not found" });
        }

        // Get date range from query or default to last 30 days
        const {
            start_date,
            end_date,
            dimension,
            include_campaigns = 'true',
            include_macros = 'false'
        } = req.query;
        
        const startDate = start_date ? new Date(start_date) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = end_date ? new Date(end_date) : new Date();
        
        // Format dates for DB query
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];

        // Get channel metrics - with error handling
        let metrics = {};
        try {
            if (dimension) {
                // Get metrics breakdown by dimension
                metrics = await MetricsService.getMetricsByDimension(
                    'traffic_channel',
                    channel.id,
                    dimension,
                    formattedStartDate,
                    formattedEndDate
                );
            } else {
                // Get aggregated metrics
                metrics = await MetricsService.getAggregatedMetrics(
                    'traffic_channel',
                    channel.id,
                    formattedStartDate,
                    formattedEndDate
                );
            }
        } catch (metricsError) {
            console.error(`Error fetching metrics for channel ${channel.id}:`, metricsError);
            metrics = {}; // Continue with empty metrics
        }

        // Get campaigns associated with this traffic channel if requested
        let campaigns = [];
        if (include_campaigns === 'true') {
            try {
                // Get campaigns that have clicks from this traffic channel
                const campaignIds = await Click.findAll({
                    attributes: ['campaign_id'],
                    where: { traffic_channel_id: channel.id },
                    group: ['campaign_id'],
                    raw: true
                });
                
                if (campaignIds.length > 0) {
                    // Get campaign details
                    campaigns = await Campaign.findAll({
                        where: {
                            id: campaignIds.map(c => c.campaign_id)
                        },
                        attributes: ['id', 'name', 'status']
                    });
                    
                    // Get metrics for each campaign - with error handling
                    const campaignMetricsPromises = campaigns.map(campaign => 
                        MetricsService.getAggregatedMetrics(
                            'campaign',
                            campaign.id,
                            formattedStartDate,
                            formattedEndDate
                        ).catch(error => {
                            console.error(`Error fetching metrics for campaign ${campaign.id}:`, error);
                            return {};
                        })
                    );
                    
                    const campaignMetrics = await Promise.all(campaignMetricsPromises);
                    
                    // Map campaigns with their metrics
                    campaigns = campaigns.map((campaign, index) => ({
                        ...campaign.toJSON(),
                        metrics: campaignMetrics[index] || {}
                    }));
                }
            } catch (campaignsError) {
                console.error(`Error fetching campaigns for channel ${channel.id}:`, campaignsError);
                campaigns = []; // Continue with empty campaigns
            }
        }

        // Get macros associated with this traffic channel if requested
        let macros = [];
        if (include_macros === 'true') {
            try {
                // Get a sample of the macros detected for this traffic channel
                const sampleClicks = await Click.findAll({
                    where: { traffic_channel_id: channel.id },
                    limit: 10,
                    order: [['createdAt', 'DESC']],
                    attributes: ['id']
                });
                
                if (sampleClicks.length > 0) {
                    const macroSamplesPromises = sampleClicks.map(click => 
                        MacroService.getMacroValues(click.id).catch(error => {
                            console.error(`Error fetching macro values for click ${click.id}:`, error);
                            return {};
                        })
                    );
                    
                    const macroSamples = await Promise.all(macroSamplesPromises);
                    
                    // Flatten and deduplicate sub parameters
                    const subParams = {};
                    macroSamples.forEach(sample => {
                        if (!sample) return; // Skip if sample is undefined
                        
                        for (let i = 1; i <= 23; i++) {
                            const subKey = `sub${i}`;
                            if (sample[subKey] && sample[subKey].length > 0) {
                                if (!subParams[subKey]) {
                                    subParams[subKey] = new Set();
                                }
                                subParams[subKey].add(sample[subKey]);
                            }
                        }
                    });
                    
                    // Convert to array format
                    macros = Object.entries(subParams).map(([key, values]) => ({
                        name: key,
                        samples: Array.from(values).slice(0, 5) // Show up to 5 samples
                    }));
                }
            } catch (macrosError) {
                console.error(`Error fetching macros for channel ${channel.id}:`, macrosError);
                macros = []; // Continue with empty macros
            }
        }

        // Combine all data
        const response = {
            ...channel.toJSON(),
            metrics,
            campaigns: include_campaigns === 'true' ? campaigns : undefined,
            macros: include_macros === 'true' ? macros : undefined
        };

        res.json(response);
    } catch (error) {
        console.error("❌ Error fetching channel:", error);
        res.status(500).json({ error: "Failed to fetch channel" });
    }
});

// Update Traffic Channel
router.put('/:id', async (req, res) => {
    try {
        const channel = await TrafficChannel.findByPk(req.params.id);
        
        if (!channel) {
            return res.status(404).json({ error: "Channel not found" });
        }
        
        // Update channel with new data
        await channel.update({
            channelName: req.body.channelName,
            aliasChannel: req.body.aliasChannel,
            costUpdateDepth: req.body.costUpdateDepth,
            costUpdateFrequency: req.body.costUpdateFrequency,
            currency: req.body.currency,
            s2sPostbackUrl: req.body.s2sPostbackUrl,
            clickRefId: req.body.clickRefId,
            externalId: req.body.externalId,
            pixelId: req.body.pixelId,
            apiAccessToken: req.body.apiAccessToken,
            defaultEventName: req.body.defaultEventName,
            customConversionMatching: req.body.customConversionMatching,
            googleAdsAccountId: req.body.googleAdsAccountId,
            googleMccAccountId: req.body.googleMccAccountId,
            status: req.body.status || channel.status
        });
        
        res.json(channel);
    } catch (error) {
        console.error("❌ Error updating channel:", error);
        res.status(500).json({ error: "Failed to update channel" });
    }
});

// Delete Traffic Channel
router.delete('/:id', async (req, res) => {
    try {
        const channel = await TrafficChannel.findByPk(req.params.id);
        
        if (!channel) {
            return res.status(404).json({ error: "Channel not found" });
        }
        
        // Check if channel has associated data before deleting
        const clickCount = await Click.count({ where: { traffic_channel_id: channel.id } });
        
        if (clickCount > 0) {
            // Don't delete, just mark as inactive
            await channel.update({ status: 'Inactive' });
            return res.json({ 
                message: "Channel has associated data and cannot be deleted. It has been marked as inactive.",
                deactivated: true
            });
        }
        
        // No associated data, safe to delete
        await channel.destroy();
        res.json({ message: "Channel deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting channel:", error);
        res.status(500).json({ error: "Failed to delete channel" });
    }
});

// Get channel metrics by date range
router.get('/:id/metrics', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            start_date, 
            end_date, 
            dimension = 'day',   // default to daily breakdown
            campaign_id          // optional filter by campaign
        } = req.query;
        
        // Check if channel exists
        const channel = await TrafficChannel.findByPk(id);
        if (!channel) {
            return res.status(404).json({ error: "Channel not found" });
        }
        
        // Set date range (default to last 30 days)
        const startDate = start_date ? new Date(start_date) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = end_date ? new Date(end_date) : new Date();
        
        // Format dates for DB query
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];
        
        // Get metrics by dimension - with error handling
        let metrics = [];
        try {
            metrics = await MetricsService.getMetricsByDimension(
                'traffic_channel',
                channel.id,
                dimension,
                formattedStartDate,
                formattedEndDate
            );
        } catch (metricsError) {
            console.error(`Error fetching metrics for channel ${id}:`, metricsError);
            metrics = []; // Continue with empty metrics
        }
        
        // Filter by campaign if provided
        let filteredMetrics = metrics;
        if (campaign_id) {
            try {
                // Get metrics for specific campaign + traffic channel combination
                filteredMetrics = await MetricsService.getMetricsByDimension(
                    'campaign',
                    campaign_id,
                    dimension,
                    formattedStartDate,
                    formattedEndDate
                );
                
                // Filter to include only records that match this traffic channel
                filteredMetrics = filteredMetrics.filter(metric => 
                    metric.traffic_channel_id === parseInt(channel.id)
                );
            } catch (campaignMetricsError) {
                console.error(`Error fetching campaign metrics for campaign ${campaign_id}:`, campaignMetricsError);
                filteredMetrics = []; // Continue with empty metrics
            }
        }
        
        res.json(filteredMetrics);
    } catch (error) {
        console.error("❌ Error fetching channel metrics:", error);
        res.status(500).json({ error: "Failed to fetch channel metrics" });
    }
});

// Get traffic source-specific metrics (e.g., ads, campaigns from external API)
router.get('/:id/external-metrics', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get channel with its connection tokens
        const channel = await TrafficChannel.findByPk(id);
        if (!channel) {
            return res.status(404).json({ error: "Channel not found" });
        }
        
        // Different logic based on channel type
        switch(channel.aliasChannel.toLowerCase()) {
            case 'facebook':
                // Call Facebook API to get metrics
                if (!channel.apiAccessToken) {
                    return res.status(400).json({ 
                        error: "Facebook API access token not configured for this channel"
                    });
                }
                
                // Example Facebook Graph API call
                // In production, implement proper token validation and refresh
                try {
                    const response = await axios.get(
                        `https://graph.facebook.com/v22.0/me/adaccounts`,
                        {
                            params: {
                                access_token: channel.apiAccessToken,
                                fields: 'name,account_id,account_status'
                            }
                        }
                    );
                    
                    return res.json(response.data);
                } catch (fbError) {
                    console.error("❌ Facebook API Error:", fbError.response?.data || fbError);
                    return res.status(500).json({ 
                        error: "Failed to fetch Facebook metrics",
                        details: fbError.response?.data
                    });
                }
                
            case 'google':
                // Call Google Ads API to get metrics
                if (!channel.googleAdsAccountId) {
                    return res.status(400).json({ 
                        error: "Google Ads account ID not configured for this channel"
                    });
                }
                
                // Example mock response (replace with actual API call)
                return res.json({
                    campaigns: [
                        { id: '123456789', name: 'Search Campaign 1', status: 'ENABLED' },
                        { id: '987654321', name: 'Display Campaign 2', status: 'PAUSED' }
                    ]
                });
                
            default:
                return res.status(400).json({ 
                    error: "External metrics not available for this channel type"
                });
        }
    } catch (error) {
        console.error("❌ Error fetching external metrics:", error);
        res.status(500).json({ error: "Failed to fetch external metrics" });
    }
});

// Generate macros documentation for a traffic channel
router.get('/:id/macros', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get channel
        const channel = await TrafficChannel.findByPk(id);
        if (!channel) {
            return res.status(404).json({ error: "Channel not found" });
        }
        
        // Get system macros from the MacroService
        const systemMacros = MacroService.SYSTEM_MACROS;
        
        // Get sub macros from the MacroService
        const subMacros = MacroService.SUB_MACROS;
        
        // Get detected macros from tracking data (sample of recent clicks)
        const recentClicks = await Click.findAll({
            where: { traffic_channel_id: id },
            limit: 20,
            order: [['createdAt', 'DESC']],
            attributes: ['id']
        });
        
        // Process postback URL to find used macros
        const detectedMacros = [];
        if (channel.s2sPostbackUrl) {
            const extractedMacros = MacroService.extractMacros(channel.s2sPostbackUrl);
            detectedMacros.push(...extractedMacros);
        }
        
        // Get sub parameter samples - with error handling
        let subSamples = {};
        if (recentClicks.length > 0) {
            for (const click of recentClicks) {
                try {
                    const macroValues = await MacroService.getMacroValues(click.id);
                    
                    // Add sub values to samples
                    for (let i = 1; i <= 23; i++) {
                        const subKey = `sub${i}`;
                        if (macroValues[subKey] && macroValues[subKey].length > 0) {
                            if (!subSamples[subKey]) {
                                subSamples[subKey] = new Set();
                            }
                            subSamples[subKey].add(macroValues[subKey]);
                        }
                    }
                } catch (err) {
                    // Skip if macro values can't be retrieved for a click
                    console.error(`Error retrieving macro values for click ${click.id}:`, err);
                    continue;
                }
            }
        }
        
        // Convert subSamples sets to arrays
        const processedSubSamples = {};
        for (const [key, values] of Object.entries(subSamples)) {
            processedSubSamples[key] = Array.from(values).slice(0, 5); // Limit to 5 examples
        }
        
        // Prepare macro documentation response
        const macroDocumentation = {
            channelName: channel.channelName,
            systemMacros: Object.entries(systemMacros).map(([key, value]) => ({
                name: key,
                token: value,
                description: getMacroDescription(key),
                detected: detectedMacros.includes(value)
            })),
            subMacros: Object.entries(subMacros).map(([key, value]) => ({
                name: key,
                token: value,
                description: `Custom parameter ${key}`,
                detected: detectedMacros.includes(value),
                samples: processedSubSamples[key.toLowerCase()] || []
            })),
            postbackUrl: channel.s2sPostbackUrl,
            examples: {
                basic: `https://yourdomain.com/track/conversion?click_id={click_id}`,
                withSubs: `https://yourdomain.com/track/conversion?click_id={click_id}&payout={payout}&sub1={sub1}`
            }
        };
        
        res.json(macroDocumentation);
    } catch (error) {
        console.error("❌ Error generating macro documentation:", error);
        res.status(500).json({ error: "Failed to generate macro documentation" });
    }
});

// Helper function to get macro descriptions
function getMacroDescription(macroKey) {
    const descriptions = {
        CLICK_ID: 'Unique identifier for the click',
        CAMPAIGN_ID: 'Campaign identifier',
        CAMPAIGN_NAME: 'Campaign name',
        TRAFFIC_SOURCE: 'Name of the traffic source',
        TRAFFIC_SOURCE_ID: 'ID of the traffic source',
        LANDER_ID: 'Landing page identifier',
        LANDER_NAME: 'Landing page name',
        OFFER_ID: 'Offer identifier',
        OFFER_NAME: 'Offer name',
        PAYOUT: 'Conversion payout amount',
        REVENUE: 'Revenue amount',
        PROFIT: 'Profit amount (revenue - cost)',
        USER_AGENT: 'User agent string',
        IP: 'Visitor IP address',
        COUNTRY: 'Visitor country',
        CITY: 'Visitor city',
        REGION: 'Visitor region/state',
        ISP: 'Visitor internet service provider',
        BROWSER: 'Visitor browser',
        OS: 'Visitor operating system',
        DEVICE: 'Visitor device type',
        TIMESTAMP: 'Click timestamp (ISO format)',
        DATE: 'Click date (YYYY-MM-DD)',
        TIME: 'Click time (HH:MM:SS)'
    };
    
    return descriptions[macroKey] || 'Custom parameter';
}

module.exports = router;