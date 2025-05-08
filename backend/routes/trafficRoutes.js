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
const FB_CLIENT_SECRET = process.env.FB_CLIENT_SECRET || 'your_fb_client_secret';
const FB_REDIRECT_URI = process.env.FB_REDIRECT_URI;
const CONFIG_ID = process.env.FB_CONFIG_ID || '958823683130260';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Store tokens in memory (replace with database storage in production)
let googleTokenStore = {};
let facebookTokenStore = {};

// ----- OAuth Endpoints -----

// Facebook OAuth Login Redirect
router.get('/auth/facebook', (req, res) => {
    console.log("✅ Redirecting to Facebook OAuth...");
    const fbAuthUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${FB_CLIENT_ID}&redirect_uri=${FB_REDIRECT_URI}&scope=public_profile,email,ads_read&config_id=${CONFIG_ID}&response_type=token`;
    console.log("🔹 Full FB Auth URL:", fbAuthUrl);
    res.redirect(fbAuthUrl);
});

// Facebook OAuth Callback - Get Access Token from URL Fragment
router.get('/auth/facebook/callback', (req, res) => {
    // Access token will be in the URL fragment: #access_token=your_access_token&expires_in=3600
    const { access_token, expires_in } = req.query;

    if (!access_token) {
        return res.status(400).json({ error: "No access token provided" });
    }

    console.log("🔹 Received Facebook Access Token:", access_token);
    console.log("🔹 Token expires in:", expires_in);

    // Store token in memory (you can replace this with DB storage)
    facebookTokenStore = {
        access_token,
        expires_at: Date.now() + (expires_in * 1000)
    };

    // Respond with a success message (you can customize this)
    res.send(`
        <script>
            if (window.opener && !window.opener.closed) {
                window.opener.localStorage.setItem('sessionToken', '${access_token}');
                window.opener.postMessage({
                    type: 'auth_success',
                    platform: 'Facebook',
                    access_token: '${access_token}'
                }, '*');
                window.opener.location.reload();
                setTimeout(function() { window.close(); }, 1000);
            } else {
                window.close();
            }
        </script>
    `);
});

// Google OAuth Login Redirect
router.get('/auth/google', (req, res) => {
    console.log("✅ Redirecting to Google OAuth...");
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
        `&response_type=token` + // Use response_type=token for Implicit Flow
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/adwords email profile')}` +
        `&access_type=offline` +
        `&prompt=consent`;
    
    console.log("🔹 Full Google Auth URL:", googleAuthUrl);
    res.redirect(googleAuthUrl);
});

// Google OAuth Callback - Get Access Token from URL Fragment
router.get('/auth/google/callback', (req, res) => {
    const { access_token, expires_in } = req.query;

    if (!access_token) {
        return res.status(400).json({ error: "No access token provided" });
    }

    console.log("🔹 Received Google Access Token:", access_token);
    console.log("🔹 Token expires in:", expires_in);

    // Store token in memory (you can replace this with DB storage)
    googleTokenStore = {
        access_token,
        expires_at: Date.now() + (expires_in * 1000)
    };

    // Respond with a success message (you can customize this)
    res.send(`
        <script>
            if (window.opener && !window.opener.closed) {
                window.opener.localStorage.setItem('sessionToken', '${access_token}');
                window.opener.postMessage({
                    type: 'auth_success',
                    platform: 'Google',
                    access_token: '${access_token}'
                }, '*');
                window.opener.location.reload();
                setTimeout(function() { window.close(); }, 1000);
            } else {
                window.close();
            }
        </script>
    `);
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

module.exports = router;
