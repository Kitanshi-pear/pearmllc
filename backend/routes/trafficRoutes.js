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
const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://pearmllc.onrender.com/traffic-channels/auth/google/callback';

// Set redirect URIs based on environment
const isProduction = process.env.NODE_ENV === "production";
const BACKEND_URL = isProduction ? process.env.BACKEND_URL : "https://pearmllc.onrender.com";
const FRONTEND_URL = isProduction ? process.env.FRONTEND_URL : "https://pearmllc.onrender.com";


// Store tokens in memory (replace with database storage in production)
let googleTokenStore = {};
let facebookTokenStore = {};

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
        
        // Get user info
        const userResponse = await axios.get('https://graph.facebook.com/me', {
            params: {
                access_token: tokenResponse.data.access_token,
                fields: 'id,name,email'
            }
        });

        // Store token
        const userId = userResponse.data.id;
        facebookTokenStore[userId] = {
            access_token: tokenResponse.data.access_token,
            expires_at: tokenResponse.data.expires_in ? Date.now() + (tokenResponse.data.expires_in * 1000) : null,
            email: userResponse.data.email,
            name: userResponse.data.name
        };

        // Create session token
        const sessionToken = Buffer.from(userId).toString('base64');

        // Redirect back to frontend with success flag
        res.redirect(`${FRONTEND_URL}?success=true&platform=Facebook&session=${sessionToken}`);
    } catch (error) {
        console.error("❌ Facebook OAuth Error:", error.response?.data || error);
        res.redirect(`${FRONTEND_URL}?error=true&platform=Facebook`);
    }
});

// Google OAuth Login Redirect
router.get('/auth/google', (req, res) => {
    console.log("✅ Redirecting to Google OAuth...");
    
    // Generate state for security
    const state = Math.random().toString(36).substring(7);
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/adwords profile email')}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${state}`;
    
    console.log("🔹 Redirecting user to:", googleAuthUrl);
    res.redirect(googleAuthUrl);
});

// Google OAuth Callback
router.get('/auth/google/callback', async (req, res) => {
    console.log("🔹 Google OAuth Callback Triggered");
    const { code, state } = req.query;
    
    if (!code) {
        console.error("❌ No authorization code received.");
        return res.redirect(`${FRONTEND_URL}?error=true&platform=Google&message=No authorization code provided`);
    }

    try {
        console.log("🔹 Exchanging code for tokens...");
        
        // Exchange code for access token
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code',
            code
        });

        console.log("✅ Google Access Token Response:", {
            access_token: tokenResponse.data.access_token ? '***' : null,
            refresh_token: tokenResponse.data.refresh_token ? '***' : null,
            expires_in: tokenResponse.data.expires_in,
            token_type: tokenResponse.data.token_type
        });

        // Store the tokens
        const { access_token, refresh_token, expires_in } = tokenResponse.data;
        
        // Get user info
        const userInfo = await axios.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            { headers: { Authorization: `Bearer ${access_token}` } }
        );
        
        const userId = userInfo.data.id;
        
        // Store tokens with expiration
        googleTokenStore[userId] = {
            access_token,
            refresh_token,
            expires_at: Date.now() + (expires_in * 1000),
            email: userInfo.data.email,
            name: userInfo.data.name
        };

        // Create a session token
        const sessionToken = Buffer.from(userId).toString('base64');

        // Redirect back to frontend with success flag and session token
        res.redirect(`${FRONTEND_URL}?success=true&platform=Google&session=${sessionToken}`);
    } catch (error) {
        console.error("❌ Google OAuth Error:", error.response?.data || error);
        res.redirect(`${FRONTEND_URL}?error=true&platform=Google&message=${encodeURIComponent(error.message)}`);
    }
});

// Check OAuth connection status
router.get('/auth/status', async (req, res) => {
    try {
        const sessionToken = req.headers.authorization?.split(' ')[1];
        const userId = sessionToken ? Buffer.from(sessionToken, 'base64').toString() : null;
        
        // Check Facebook status
        let facebookStatus = {
            connected: false,
            expires_at: null,
            email: null
        };
        
        if (userId && facebookTokenStore[userId]) {
            const fbData = facebookTokenStore[userId];
            if (!fbData.expires_at || Date.now() < fbData.expires_at) {
                facebookStatus = {
                    connected: true,
                    expires_at: fbData.expires_at ? new Date(fbData.expires_at).toISOString() : null,
                    email: fbData.email
                };
            }
        }
        
        // Check Google status
        let googleStatus = {
            connected: false,
            expires_at: null,
            email: null
        };
        
        if (userId && googleTokenStore[userId]) {
            const googleData = googleTokenStore[userId];
            
            // Check if token is expired
            if (Date.now() < googleData.expires_at) {
                googleStatus = {
                    connected: true,
                    expires_at: new Date(googleData.expires_at).toISOString(),
                    email: googleData.email
                };
            } else if (googleData.refresh_token) {
                // Try to refresh the token
                try {
                    const refreshResponse = await axios.post('https://oauth2.googleapis.com/token', {
                        client_id: GOOGLE_CLIENT_ID,
                        client_secret: GOOGLE_CLIENT_SECRET,
                        refresh_token: googleData.refresh_token,
                        grant_type: 'refresh_token'
                    });
                    
                    // Update stored token
                    googleTokenStore[userId] = {
                        ...googleData,
                        access_token: refreshResponse.data.access_token,
                        expires_at: Date.now() + (refreshResponse.data.expires_in * 1000)
                    };
                    
                    googleStatus = {
                        connected: true,
                        expires_at: new Date(googleTokenStore[userId].expires_at).toISOString(),
                        email: googleData.email
                    };
                } catch (refreshError) {
                    console.error("❌ Token refresh failed:", refreshError);
                }
            }
        }
        
        res.json({
            facebook: facebookStatus,
            google: googleStatus
        });
    } catch (error) {
        console.error("❌ Error checking auth status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Disconnect Google OAuth
router.post('/auth/google/disconnect', async (req, res) => {
    try {
        const sessionToken = req.headers.authorization?.split(' ')[1];
        const userId = sessionToken ? Buffer.from(sessionToken, 'base64').toString() : null;
        
        if (userId && googleTokenStore[userId]) {
            // Revoke access token
            const token = googleTokenStore[userId].access_token;
            
            try {
                await axios.post(`https://oauth2.googleapis.com/revoke?token=${token}`);
                console.log("✅ Google token revoked successfully");
            } catch (revokeError) {
                console.error("⚠️ Token revoke failed (token might already be invalid):", revokeError.message);
            }
            
            // Remove from store
            delete googleTokenStore[userId];
            
            res.json({ success: true, message: "Google account disconnected" });
        } else {
            res.status(404).json({ error: "Google account not found or already disconnected" });
        }
    } catch (error) {
        console.error("❌ Error disconnecting Google account:", error);
        res.status(500).json({ error: "Failed to disconnect Google account" });
    }
});

// Disconnect Facebook OAuth
router.post('/auth/facebook/disconnect', async (req, res) => {
    try {
        const sessionToken = req.headers.authorization?.split(' ')[1];
        const userId = sessionToken ? Buffer.from(sessionToken, 'base64').toString() : null;
        
        if (userId && facebookTokenStore[userId]) {
            // Remove from store
            delete facebookTokenStore[userId];
            
            res.json({ success: true, message: "Facebook account disconnected" });
        } else {
            res.status(404).json({ error: "Facebook account not found or already disconnected" });
        }
    } catch (error) {
        console.error("❌ Error disconnecting Facebook account:", error);
        res.status(500).json({ error: "Failed to disconnect Facebook account" });
    }
});

// Get Google Ads accounts
router.get('/auth/google/accounts', async (req, res) => {
    try {
        const sessionToken = req.headers.authorization?.split(' ')[1];
        const userId = sessionToken ? Buffer.from(sessionToken, 'base64').toString() : null;
        
        if (!userId || !googleTokenStore[userId]) {
            return res.status(401).json({ error: "Not authenticated with Google" });
        }
        
        const { access_token } = googleTokenStore[userId];
        
        // This is a simplified example. For real Google Ads API access,
        // you need to use the Google Ads API client library
        try {
            // Example of fetching Google Ads customer IDs
            const response = await axios.get(
                'https://googleads.googleapis.com/v14/customers:listAccessibleCustomers',
                {
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN
                    }
                }
            );
            
            res.json({
                accounts: response.data.resourceNames
            });
        } catch (apiError) {
            console.error("❌ Google Ads API Error:", apiError.response?.data || apiError);
            res.status(500).json({ 
                error: "Failed to fetch Google Ads accounts",
                details: apiError.response?.data
            });
        }
    } catch (error) {
        console.error("❌ Error fetching Google Ads accounts:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Refresh Google token middleware
const refreshGoogleToken = async (req, res, next) => {
    try {
        const sessionToken = req.headers.authorization?.split(' ')[1];
        const userId = sessionToken ? Buffer.from(sessionToken, 'base64').toString() : null;
        
        if (!userId || !googleTokenStore[userId]) {
            return next();
        }
        
        const googleData = googleTokenStore[userId];
        
        // Check if token needs refresh (expires in less than 5 minutes)
        if (googleData.expires_at - Date.now() < 300000 && googleData.refresh_token) {
            console.log("🔄 Refreshing Google token...");
            
            const refreshResponse = await axios.post('https://oauth2.googleapis.com/token', {
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                refresh_token: googleData.refresh_token,
                grant_type: 'refresh_token'
            });
            
            // Update stored token
            googleTokenStore[userId] = {
                ...googleData,
                access_token: refreshResponse.data.access_token,
                expires_at: Date.now() + (refreshResponse.data.expires_in * 1000)
            };
            
            console.log("✅ Token refreshed successfully");
        }
        
        next();
    } catch (error) {
        console.error("❌ Token refresh failed:", error);
        next(error);
    }
};

// Apply middleware to routes that need fresh tokens
router.use('/auth/google/accounts', refreshGoogleToken);
router.use('/external-metrics', refreshGoogleToken);

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

// Get all traffic channels with metrics
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
                // Get session token to find user's Google token
                const sessionToken = req.headers.authorization?.split(' ')[1];
                const userId = sessionToken ? Buffer.from(sessionToken, 'base64').toString() : null;
                
                if (!userId || !googleTokenStore[userId]) {
                    return res.status(401).json({ 
                        error: "Not authenticated with Google"
                    });
                }
                
                const { access_token } = googleTokenStore[userId];
                
                // Example Google Ads API call
                try {
                    const response = await axios.get(
                        'https://googleads.googleapis.com/v14/customers:listAccessibleCustomers',
                        {
                            headers: {
                                'Authorization': `Bearer ${access_token}`,
                                'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN
                            }
                        }
                    );
                    
                    return res.json(response.data);
                } catch (googleError) {
                    console.error("❌ Google Ads API Error:", googleError.response?.data || googleError);
                    return res.status(500).json({ 
                        error: "Failed to fetch Google Ads metrics",
                        details: googleError.response?.data
                    });
                }
                
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