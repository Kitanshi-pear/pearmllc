// routes/traffic-channels.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();
const { TrafficChannel, Campaign, Click, Conversion } = require('../models');
const MetricsService = require('../services/metrics');
const MacroService = require('../services/MacroServices');
const { Op } = require('sequelize'); // Make sure to import Op for Sequelize operators

// Environment variables for OAuth
const FB_CLIENT_ID = process.env.FB_CLIENT_ID || '1002084978515659';
const FB_CLIENT_SECRET = process.env.FB_CLIENT_SECRET || 'd9ac796fa81d4e35dd973661529819ec';
const FB_REDIRECT_URI = process.env.FB_REDIRECT_URI;


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Store tokens in memory (replace with database storage in production)
let googleTokenStore = {};


// ----- OAuth Endpoints -----

// Facebook OAuth Login Redirect
// Redirect to Facebook OAuth
router.get('/auth/facebook', (req, res) => {
    console.log("✅ Redirecting to Facebook OAuth...");

    const fbAuthUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${FB_CLIENT_ID}&redirect_uri=${encodeURIComponent(FB_REDIRECT_URI)}&scope=public_profile,email,ads_read&response_type=code`;

    console.log("🔹 Full FB Auth URL:", fbAuthUrl);
    res.redirect(fbAuthUrl);
});

const facebookTokenStore = {};


// Facebook OAuth Callback - Exchange code for access token
router.get('/auth/facebook/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: "No authorization code provided" });
    }

    try {
        console.log("🔹 Received Facebook Auth Code:", code);

        // Exchange code for access token
        const tokenResponse = await axios.get('https://graph.facebook.com/v22.0/oauth/access_token', {
            params: {
                client_id: FB_CLIENT_ID,
                client_secret: FB_CLIENT_SECRET,
                redirect_uri: FB_REDIRECT_URI,
                code
            }
        });

        console.log("✅ Facebook Access Token Response:", tokenResponse.data);

        // Fetch user profile info
        const userResponse = await axios.get('https://graph.facebook.com/me', {
            params: {
                access_token: tokenResponse.data.access_token,
                fields: 'id,name,email'
            }
        });

        const userId = userResponse.data.id;

        // Store token info (or replace with DB write)
        facebookTokenStore[userId] = {
            access_token: tokenResponse.data.access_token,
            expires_at: Date.now() + (tokenResponse.data.expires_in * 1000),
            email: userResponse.data.email,
            name: userResponse.data.name
        };

        const sessionToken = Buffer.from(`fb_${userId}`).toString('base64');

        // Respond with script to save token and close popup
        res.send(`
            <script>
                if (window.opener && !window.opener.closed) {
                    window.opener.localStorage.setItem('sessionToken', '${sessionToken}');
                    window.opener.postMessage({
                        type: 'auth_success',
                        platform: 'Facebook',
                        session: '${sessionToken}'
                    }, '*');
                    window.opener.location.reload();
                    setTimeout(() => window.close(), 1000);
                } else {
                    window.close();
                }
            </script>
        `);

    } catch (error) {
        console.error("❌ Facebook OAuth Error:", error.response?.data || error.message);

        // Log the full error response from Facebook
        if (error.response) {
            console.error("Facebook Error Response:", error.response.data);
        }

        // Send error back to parent window
        res.send(`
            <script>
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                        type: 'auth_error',
                        platform: 'Facebook',
                        message: '${(error.message || "Authentication failed").replace(/'/g, "\\'")}'
                    }, '*');
                    setTimeout(() => window.close(), 500);
                } else {
                    window.close();
                }
            </script>
        `);
    }
});


router.get('/auth/google', (req, res) => {
    console.log("✅ Redirecting to Google OAuth...");
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
        `&response_type=code` + // response_type=code for Authorization Code Flow
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/adwords email profile')}` +
        `&access_type=offline` +
        `&prompt=consent`;
    
    console.log("🔹 Full Google Auth URL:", googleAuthUrl);
    res.redirect(googleAuthUrl);
});

// Google OAuth Callback - Exchange code for access token
router.get('/auth/google/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        console.error("❌ OAuth error:", error);
        return res.send(`
            <script>
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                        type: 'auth_error',
                        platform: 'Google',
                        message: '${error.replace(/'/g, "\\'")}'
                    }, '*');
                    setTimeout(() => window.close(), 500);
                } else {
                    window.close();
                }
            </script>
        `);
    }

    if (!code) {
        console.error("❌ No authorization code received.");
        return res.send(`
            <script>
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                        type: 'auth_error',
                        platform: 'Google',
                        message: 'No authorization code provided'
                    }, '*');
                    setTimeout(() => window.close(), 500);
                } else {
                    window.close();
                }
            </script>
        `);
    }

    try {
        console.log("🔹 Exchanging code for Google tokens...");
        
        // Exchange code for access token
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code',
            code
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
        const sessionToken = Buffer.from(`google_${userId}`).toString('base64');

        // Return pure JavaScript to handle successful authentication
        res.send(`
            <script>
                if (window.opener && !window.opener.closed) {
                    window.opener.localStorage.setItem('sessionToken', '${sessionToken}');
                    window.opener.postMessage({
                        type: 'auth_success',
                        platform: 'Google',
                        session: '${sessionToken}'
                    }, '*');
                    window.opener.location.reload();
                    setTimeout(function() { window.close(); }, 1000);
                } else {
                    window.close();
                }
            </script>
        `);
    } catch (error) {
        console.error("❌ Google OAuth Error:", error.response?.data || error);
        const errorMessage = error.response?.data?.error_description || error.message || 'Authentication failed';
        
        // Return JavaScript to handle error
        res.send(`
            <script>
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                        type: 'auth_error',
                        platform: 'Google',
                        message: '${errorMessage.replace(/'/g, "\\'")}'
                    }, '*');
                    setTimeout(() => window.close(), 500);
                } else {
                    window.close();
                }
            </script>
        `);
    }
});


// Check OAuth connection status
router.get('/auth/status', async (req, res) => {
    try {
        const authorization = req.headers.authorization;
        const sessionToken = authorization ? authorization.split(' ')[1] : null;
        
        // Default response
        const authStatus = {
            facebook: { connected: false, expires_at: null },
            google: { connected: false, expires_at: null }
        };
        
        if (sessionToken) {
            try {
                const decodedToken = Buffer.from(sessionToken, 'base64').toString();
                
                if (decodedToken.startsWith('google_')) {
                    const userId = decodedToken.substring(7);
                    
                    if (googleTokenStore[userId]) {
                        const userData = googleTokenStore[userId];
                        
                        // Check if token is still valid
                        if (Date.now() < userData.expires_at) {
                            authStatus.google = {
                                connected: true,
                                expires_at: new Date(userData.expires_at).toISOString(),
                                email: userData.email
                            };
                        }
                    }
                } else if (decodedToken.startsWith('fb_')) {
                    const userId = decodedToken.substring(3);
                    
                    if (facebookTokenStore[userId]) {
                        const fbData = facebookTokenStore[userId];
                        
                        // Check if token is still valid
                        if (!fbData.expires_at || Date.now() < fbData.expires_at) {
                            authStatus.facebook = {
                                connected: true,
                                expires_at: fbData.expires_at ? new Date(fbData.expires_at).toISOString() : null,
                                email: fbData.email
                            };
                        }
                    }
                }
            } catch (decodeError) {
                console.error("Error decoding session token:", decodeError);
            }
        }
        
        res.json(authStatus);
    } catch (error) {
        console.error("❌ Error checking auth status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Disconnect Google OAuth
router.post('/auth/google/disconnect', async (req, res) => {
    try {
        const authorization = req.headers.authorization;
        const sessionToken = authorization ? authorization.split(' ')[1] : null;
        
        if (!sessionToken) {
            return res.status(401).json({ error: "No session token provided" });
        }
        
        const decodedToken = Buffer.from(sessionToken, 'base64').toString();
        
        if (!decodedToken.startsWith('google_')) {
            return res.status(400).json({ error: "Invalid session token for Google" });
        }
        
        const userId = decodedToken.substring(7);
        
        if (userId && googleTokenStore[userId]) {
            // Optionally revoke the token with Google
            const token = googleTokenStore[userId].access_token;
            
            try {
                await axios.post(`https://oauth2.googleapis.com/revoke?token=${token}`);
                console.log("✅ Google token revoked successfully");
            } catch (revokeError) {
                console.error("⚠️ Token revoke failed (might already be invalid):", revokeError.message);
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
        const authorization = req.headers.authorization;
        const sessionToken = authorization ? authorization.split(' ')[1] : null;
        
        if (!sessionToken) {
            return res.status(401).json({ error: "No session token provided" });
        }
        
        const decodedToken = Buffer.from(sessionToken, 'base64').toString();
        
        if (!decodedToken.startsWith('fb_')) {
            return res.status(400).json({ error: "Invalid session token for Facebook" });
        }
        
        const userId = decodedToken.substring(3);
        
        if (userId && facebookTokenStore[userId]) {
            // Optionally revoke the token with Facebook
            const token = facebookTokenStore[userId].access_token;
            
            try {
                await axios.delete(`https://graph.facebook.com/v22.0/me/permissions?access_token=${token}`);
                console.log("✅ Facebook permissions revoked successfully");
            } catch (revokeError) {
                console.error("⚠️ Facebook permissions revoke failed:", revokeError.message);
            }
            
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
            status: 'Active',
            isConnected: req.body.isConnected || false
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

        // Get date range for metrics (default to last 30 days)
        const { start_date, end_date } = req.query;
        const endDate = end_date ? new Date(end_date) : new Date();
        const startDate = start_date ? new Date(start_date) : new Date(new Date().setDate(endDate.getDate() - 30));
        
        // Format dates for DB query
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];

        // Fetch all traffic channels with safer error handling
        let channels = [];
        try {
            channels = await TrafficChannel.findAll({
                attributes: [
                    'id', 'name', 'platform_type', 'channelName', 
                    'aliasChannel', 'costUpdateDepth', 'costUpdateFrequency', 
                    'currency', 's2sPostbackUrl', 'clickRefId', 'externalId', 
                    'pixelId', 'apiAccessToken', 'defaultEventName', 
                    'customConversionMatching', 'googleAdsAccountId', 
                    'googleMccAccountId', 'status', 'createdAt', 'updatedAt'
                ],
                order: [['id', 'ASC']],
            });
            
            console.log(`Successfully fetched ${channels.length} channels`);
        } catch (channelsError) {
            console.error("❌ Error fetching channels from database:", channelsError);
            return res.status(500).json({ 
                error: "Failed to fetch channels from database", 
                details: channelsError.message 
            });
        }

        // Return early if no channels found
        if (channels.length === 0) {
            return res.json([]);
        }

        // Initialize metrics array with empty objects
        const metrics = new Array(channels.length).fill({});
        
        // Only try to fetch metrics if MetricsService is properly initialized
        if (typeof MetricsService?.getAggregatedMetrics === 'function') {
            try {
                console.log("Fetching metrics for channels...");
                
                // Process channels in batches to avoid overwhelming the database
                const batchSize = 5;
                for (let i = 0; i < channels.length; i += batchSize) {
                    const batch = channels.slice(i, i + batchSize);
                    const batchPromises = batch.map((channel, batchIndex) => {
                        return MetricsService.getAggregatedMetrics(
                            'traffic_channel', 
                            channel.id, 
                            formattedStartDate, 
                            formattedEndDate
                        ).then(metric => {
                            metrics[i + batchIndex] = metric || {};
                        }).catch(metricError => {
                            console.error(`Error fetching metrics for channel ${channel.id}:`, metricError);
                            metrics[i + batchIndex] = {};
                        });
                    });
                    
                    // Wait for each batch to complete before processing the next one
                    await Promise.all(batchPromises);
                }
                
                console.log("Successfully fetched metrics for all channels");
            } catch (metricsError) {
                console.error("❌ Error in metrics fetching process:", metricsError);
                // Continue with empty metrics rather than failing
                console.log("Continuing with empty metrics due to error");
            }
        } else {
            console.warn("⚠️ MetricsService.getAggregatedMetrics is not available. Skipping metrics fetch.");
        }

        // Map channels with their metrics - with error handling
        let channelsWithMetrics = [];
        try {
            channelsWithMetrics = channels.map((channel, index) => {
                try {
                    // Check if this channel should be marked as connected based on API tokens
                    const isChannelConnected = channel.isConnected || 
                                            (channel.apiAccessToken && channel.aliasChannel === 'Facebook') || 
                                            (channel.googleAdsAccountId && channel.aliasChannel === 'Google');
                    
                    return {
                        ...channel.toJSON(),
                        isConnected: isChannelConnected,
                        metrics: metrics[index] || {}
                    };
                } catch (mappingError) {
                    console.error(`Error mapping channel at index ${index}:`, mappingError);
                    // Return a basic object if mapping fails
                    return {
                        id: channel.id || 'unknown',
                        channelName: channel.channelName || 'Error processing channel',
                        isConnected: false,
                        metrics: {}
                    };
                }
            });
        } catch (mappingError) {
            console.error("❌ Error mapping channels with metrics:", mappingError);
            return res.status(500).json({ 
                error: "Failed to map channels with metrics", 
                details: mappingError.message 
            });
        }

        // Send the response
        return res.json(channelsWithMetrics);
    } catch (error) {
        console.error("❌ Error fetching channels:", error);
        console.error("Error details:", error.message);
        console.error("Stack trace:", error.stack);
        return res.status(500).json({ 
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

        // Check if this channel should be marked as connected based on API tokens
        const isChannelConnected = channel.isConnected || 
                                (channel.apiAccessToken && channel.aliasChannel === 'Facebook') || 
                                (channel.googleAdsAccountId && channel.aliasChannel === 'Google');

        // Combine all data
        const response = {
            ...channel.toJSON(),
            isConnected: isChannelConnected,
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
            isConnected: req.body.isConnected || false,
            status: req.body.status || channel.status
        });
        
        // Re-check connection status based on available tokens
        const isChannelConnected = channel.isConnected || 
                                (channel.apiAccessToken && channel.aliasChannel === 'Facebook') || 
                                (channel.googleAdsAccountId && channel.aliasChannel === 'Google');
        
        // If connection status changed, update it
        if (isChannelConnected !== channel.isConnected) {
            await channel.update({ isConnected: isChannelConnected });
        }
        
        res.json({
            ...channel.toJSON(),
            isConnected: isChannelConnected
        });
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

// Test a conversion for a traffic channel
router.post('/:id/test-conversion', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the traffic channel
        const channel = await TrafficChannel.findByPk(id);
        if (!channel) {
            return res.status(404).json({ error: "Traffic channel not found" });
        }
        
        // Get a campaign for this traffic channel
        const campaign = await Campaign.findOne({
            where: {
                traffic_channel_id: id
            }
        });
        
        if (!campaign) {
            return res.status(404).json({ error: "No campaigns found for this traffic channel" });
        }
        
        // Check if the channel has required conversion API settings
        const hasFacebookSettings = channel.pixelId && channel.apiAccessToken;
        const hasGoogleSettings = channel.googleAdsAccountId && channel.conversion_id && channel.conversion_label;
        
        if (!hasFacebookSettings && !hasGoogleSettings) {
            return res.status(400).json({ 
                error: "This traffic channel does not have conversion API settings configured",
                requiredFields: {
                    facebook: ['pixelId', 'apiAccessToken'],
                    google: ['googleAdsAccountId', 'conversion_id', 'conversion_label']
                }
            });
        }
        
        // Create a test conversion payload
        const testConversion = {
            traffic_channel: {
                id: channel.id,
                name: channel.channelName,
                type: channel.aliasChannel
            },
            campaign: {
                id: campaign.id,
                name: campaign.name
            },
            testPayload: {
                click_id: 'test_' + Date.now(),
                payout: req.body.payout || 10.00,
                event_name: req.body.event_name || channel.defaultEventName || 'Purchase'
            },
            apiSettings: {
                facebook: {
                    enabled: hasFacebookSettings && !!channel.forward_to_facebook,
                    pixel_id: channel.pixelId,
                    has_token: !!channel.apiAccessToken
                },
                google: {
                    enabled: hasGoogleSettings && !!channel.forward_to_google,
                    ads_account_id: channel.googleAdsAccountId,
                    conversion_id: channel.conversion_id,
                    conversion_label: channel.conversion_label
                }
            }
        };
        
        // Return test info
        res.json({
            success: true,
            message: 'Conversion test info generated',
            test_conversion: testConversion,
            test_url: `/api/postback/conversion?${new URLSearchParams(testConversion.testPayload).toString()}`,
            note: 'Use this URL to test your conversion. No actual API calls will be made.'
        });
    } catch (error) {
        console.error('❌ Error testing conversion:', error);
        res.status(500).json({ error: 'Failed to test conversion' });
    }
});

// Update conversion settings for a traffic channel
router.put('/:id/conversion-settings', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the traffic channel
        const channel = await TrafficChannel.findByPk(id);
        if (!channel) {
            return res.status(404).json({ error: "Traffic channel not found" });
        }
        
        // Extract conversion API fields
        const {
            forward_to_facebook,
            forward_to_google,
            conversion_id,
            conversion_label,
            default_event_name
        } = req.body;
        
        // Update the traffic channel
        await channel.update({
            ...(forward_to_facebook !== undefined && { forward_to_facebook }),
            ...(forward_to_google !== undefined && { forward_to_google }),
            ...(conversion_id && { conversion_id }),
            ...(conversion_label && { conversion_label }),
            ...(default_event_name && { defaultEventName: default_event_name })
        });
        
        res.json({
            message: "Conversion settings updated successfully",
            channel
        });
    } catch (error) {
        console.error('❌ Error updating conversion settings:', error);
        res.status(500).json({ error: 'Failed to update conversion settings' });
    }
});

// Get conversion settings for a traffic channel
router.get('/:id/conversion-settings', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the traffic channel
        const channel = await TrafficChannel.findByPk(id);
        if (!channel) {
            return res.status(404).json({ error: "Traffic channel not found" });
        }
        
        // Prepare conversion settings
        const conversionSettings = {
            traffic_channel: {
                id: channel.id,
                name: channel.channelName
            },
            facebook: {
                enabled: !!channel.forward_to_facebook,
                pixel_id: channel.pixelId || null,
                has_token: !!channel.apiAccessToken,
                default_event_name: channel.defaultEventName || 'Purchase'
            },
            google: {
                enabled: !!channel.forward_to_google,
                ads_account_id: channel.googleAdsAccountId || null,
                conversion_id: channel.conversion_id || null,
                conversion_label: channel.conversion_label || null
            }
        };
        
        res.json(conversionSettings);
    } catch (error) {
        console.error('❌ Error fetching conversion settings:', error);
        res.status(500).json({ error: 'Failed to fetch conversion settings' });
    }
});

// Get conversions for a traffic channel
router.get('/:id/conversions', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the traffic channel
        const channel = await TrafficChannel.findByPk(id);
        if (!channel) {
            return res.status(404).json({ error: "Traffic channel not found" });
        }
        
        // Get date range from query or default to last 30 days
        const {
            start_date,
            end_date,
            limit = 50
        } = req.query;
        
        const startDate = start_date ? new Date(start_date) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = end_date ? new Date(end_date) : new Date();
        
        // Get conversions for this traffic channel
        const conversions = await Conversion.findAll({
            where: {
                traffic_channel_id: id,
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit, 10)
        });
        
        // Map conversions with campaign info if available
        const conversionsWithInfo = await Promise.all(conversions.map(async (conv) => {
            let campaign = null;
            if (conv.campaign_id) {
                campaign = await Campaign.findByPk(conv.campaign_id, {
                    attributes: ['id', 'name']
                });
            }
            
            return {
                id: conv.id,
                click_id: conv.click_id,
                campaign: campaign ? {
                    id: campaign.id,
                    name: campaign.name
                } : null,
                payout: conv.payout,
                revenue: conv.revenue,
                profit: conv.profit,
                status: conv.status,
                event_name: conv.event_name,
                created_at: conv.createdAt
            };
        }));
        
        // Calculate summary metrics
        const summary = {
            total_conversions: conversions.length,
            total_revenue: conversions.reduce((sum, conv) => sum + (parseFloat(conv.revenue) || 0), 0),
            total_payout: conversions.reduce((sum, conv) => sum + (parseFloat(conv.payout) || 0), 0),
            total_profit: conversions.reduce((sum, conv) => sum + (parseFloat(conv.profit) || 0), 0)
        };
        
        res.json({
            traffic_channel: {
                id: channel.id,
                name: channel.channelName
            },
            date_range: {
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            },
            summary,
            conversions: conversionsWithInfo
        });
    } catch (error) {
        console.error('❌ Error fetching conversions:', error);
        res.status(500).json({ error: 'Failed to fetch conversions' });
    }
});

module.exports = router;