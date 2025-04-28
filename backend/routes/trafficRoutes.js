const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();
const { TrafficChannel, Metrics, Clicks, Lpclicks, Offer, Campaigns, Macro } = require('../models'); // Adjust the path as necessary

const FB_CLIENT_ID = process.env.FB_CLIENT_ID || '1002084978515659';
const FB_CLIENT_SECRET = process.env.FB_CLIENT_SECRET || 'your_fb_client_secret';
const FB_REDIRECT_URI = 'https://pear-media-dash-2.onrender.com/traffic-channels/';
const CONFIG_ID = '958823683130260'; // Include config_id

// 🌟 1️⃣ Facebook OAuth Login Redirect
router.get('/auth/facebook', (req, res) => {
    console.log("✅ Redirecting to Facebook OAuth...");
    const fbAuthUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${FB_CLIENT_ID}&redirect_uri=${FB_REDIRECT_URI}&scope=public_profile,email,ads_read&config_id=${CONFIG_ID}&response_type=code`;
    res.redirect(fbAuthUrl);
});

// 🚀 Exchange Authorization Code for Access Token
router.get('/auth/facebook/callback', async (req, res) => {  // ✅ FIXED: Route should match your request
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "No authorization code provided" });

    try {
        console.log("🔹 Received Facebook Auth Code:", code);
        REDIRECT_URI = 'http://localhost:3000/traffic-channels';
        const tokenResponse = await axios.get(`https://graph.facebook.com/v22.0/oauth/access_token`, {
            params: {
                client_id: FB_CLIENT_ID,
                client_secret: FB_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                code,
                config_id: CONFIG_ID  // Include config_id if required
            }
        });

        console.log("✅ Facebook Access Token Response:", tokenResponse.data);

        // Return the access token
        res.json(tokenResponse.data);
    } catch (error) {
        console.error("❌ Facebook OAuth Error:", error.response?.data || error);
        res.status(500).json({ error: error.response?.data || "Internal Server Error" });
    }
});

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const isProduction = process.env.NODE_ENV === "production";

// ✅ Set redirect URIs dynamically
const BACKEND_URL = isProduction
    ? "https://pear-media-dash-2.onrender.com"
    : "http://localhost:5000";

const FRONTEND_URL = isProduction
    ? "https://pear-media-dash-2.onrender.com/traffic-channels"
    : "http://localhost:3000/traffic-channels";

const REDIRECT_URI = `${BACKEND_URL}/auth/google/callback`;

// 🌟 Step 1: Redirect User to Google OAuth
router.get('/auth/google', (req, res) => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/adwords`;
    console.log("🔹 Redirecting user to:", googleAuthUrl);
    res.redirect(googleAuthUrl);
});

// 🚀 Step 2: Handle Google OAuth Callback
router.get('/auth/google/callback', async (req, res) => {
    console.log("🔹 Google OAuth Callback Triggered");
    console.log("🔹 Request Query Params:", req.query);

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

        // 🔄 Redirect user to frontend traffic channels page
        console.log(`🔄 Redirecting user to frontend: ${FRONTEND_URL}`);
        res.redirect(FRONTEND_URL);
    } catch (error) {
        console.error("❌ Google OAuth Error:", error.response?.data || error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Create Traffic Channel
router.post('/', async (req, res) => {
    try {
        console.log("Received data:", req.body); // Log to debug

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
        });

        res.status(201).json(newChannel);
    } catch (error) {
        console.error("❌ Error saving channel:", error);
        res.status(500).json({ error: "Failed to save channel." });
    }
});

// Get all traffic channels with associated data (Mapped, not included)
router.get("/", async (req, res) => {
    try {
        console.log("Fetching traffic channels...");

        // Fetch all traffic channels and map the necessary data
        const channels = await TrafficChannel.findAll({
            attributes: ['id', 'channelName', 'aliasChannel', 'costUpdateDepth', 'costUpdateFrequency', 'currency', 's2sPostbackUrl'],
            order: [['id', 'ASC']],
        });

        const mappedChannels = channels.map(channel => ({
            id: channel.id,
            channelName: channel.channelName,
            aliasChannel: channel.aliasChannel,
            costUpdateDepth: channel.costUpdateDepth,
            costUpdateFrequency: channel.costUpdateFrequency,
            currency: channel.currency,
            s2sPostbackUrl: channel.s2sPostbackUrl,
        }));

        res.json(mappedChannels);
    } catch (error) {
        console.error("❌ Error fetching channels:", error);
        res.status(500).json({ error: "Failed to fetch traffic channels" });
    }
});

// Get a single traffic channel by ID with mapped data
router.get("/:id", async (req, res) => {
    try {
        const channel = await TrafficChannel.findByPk(req.params.id);

        if (!channel) {
            return res.status(404).json({ error: "Channel not found" });
        }

        const mappedChannel = {
            id: channel.id,
            channelName: channel.channelName,
            aliasChannel: channel.aliasChannel,
            costUpdateDepth: channel.costUpdateDepth,
            costUpdateFrequency: channel.costUpdateFrequency,
            currency: channel.currency,
            s2sPostbackUrl: channel.s2sPostbackUrl,
        };

        res.json(mappedChannel);
    } catch (error) {
        console.error("❌ Error fetching channel:", error);
        res.status(500).json({ error: "Failed to fetch channel" });
    }
});

module.exports = router;
