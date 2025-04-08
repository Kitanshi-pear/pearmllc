const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {pool} = require("../models/db");
const { google } = require("googleapis");
const { GoogleAdsApi } = require("google-ads-api");
require("dotenv").config();
const { getGoogleAuthURL, getGoogleTokens } = require('../controller/trafficController');
const router = express.Router();

// Initialize Google OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);


// SIGNUP API
router.post("/signup", async (req, res) => {
  console.log("Signup API hit!", req.body);

  const { name, email, password, role } = req.body;

  try {
    if (!email.endsWith("@pearmediallc.com")) {
      return res.status(400).json({ error: "Email must be from @pearmediallc.com domain" });
    }

    // Check if the user already exists
    const [existingUser] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate the role
    const allowedRoles = ["admin", "manager"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role. Allowed roles: admin, manager" });
    }

    // Insert the new user
    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    res.status(201).json({ message: "User registered successfully!" });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN API
router.post("/login", async (req, res) => {
  console.log("Login API hit!", req.body);

  const { email, password } = req.body;

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("Missing JWT_SECRET in .env");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const token = jwt.sign(
      { user_id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Login Successful!");
    res.json({ token, user_id: user.id, role: user.role });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// // GET Google OAuth URL (Frontend Calls This)
// router.get("/google", (req, res) => {
//   try {
//     const authUrl = oauth2Client.generateAuthUrl({
//       access_type: "offline",
//       scope: ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/adwords"],
//       prompt: "consent",
//     });

//     console.log("Generated Google Auth URL:", authUrl);
//     res.json({ authUrl });
//   } catch (error) {
//     console.error("Error generating Google Auth URL:", error);
//     res.status(500).json({ error: "Failed to generate Google Auth URL" });
//   }
// });

// // Google OAuth Callback
// router.get("/google/callback", async (req, res) => {
//   const { code } = req.query;

//   try {
//     const { tokens } = await oauth2Client.getToken(code);
//     oauth2Client.setCredentials(tokens);

//     console.log("Tokens Received:", tokens);
//     res.json({ message: "Google Authentication Successful!", tokens });
//   } catch (error) {
//     console.error("Authentication Error:", error);
//     res.status(500).json({ error: "Authentication failed" });
//   }
// });


// // Fetch Google Ads Campaigns
// router.get("/google/campaigns", async (req, res) => {
//   try {
//     const refreshToken = req.query.refresh_token;
//     if (!refreshToken) {
//       return res.status(400).json({ error: "Missing refresh token" });
//     }

//     const client = new GoogleAdsApi({
//       client_id: process.env.GOOGLE_CLIENT_ID,
//       client_secret: process.env.GOOGLE_CLIENT_SECRET,
//       developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
//     });

//     const customer = client.Customer({
//       customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
//       refresh_token: refreshToken,
//     });

//     const campaigns = await customer.campaigns.list();
//     res.json(campaigns);
//   } catch (error) {
//     console.error("Error Fetching Campaigns:", error);
//     res.status(500).json({ error: "Failed to fetch campaigns" });
//   }
// });



// // Generate Google Login URL
// const getAuthUrl = () => {
//   return oauth2Client.generateAuthUrl({
//     access_type: "offline",
//     scope: ["https://www.googleapis.com/auth/adwords"],
//     prompt: "consent",
//   });
// };

// // Exchange auth code for tokens
// const getTokensFromCode = async (code) => {
//   try {
//     const { tokens } = await oauth2Client.getToken(code);
//     oauth2Client.setCredentials(tokens);
//     return tokens;
//   } catch (error) {
//     throw new Error("Authentication error: " + error.message);
//   }
// };

// // Fetch campaigns from Google Ads API
// const fetchCampaigns = async (refreshToken) => {
//   try {
//     if (!refreshToken) throw new Error("Missing refresh token");

//     const client = new GoogleAdsApi({
//       client_id: process.env.GOOGLE_CLIENT_ID,
//       client_secret: process.env.GOOGLE_CLIENT_SECRET,
//       developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
//       refresh_token: refreshToken,
//     });

//     const customer = client.Customer({
//       customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
//     });

//     const response = await customer.campaigns.list();
//     return response;
//   } catch (error) {
//     throw new Error("Error fetching Google Ads campaigns: " + error.message);
//   }
// };

// //Facebook Auth URL
// router.get("/facebook", (req, res) => {
//   const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&scope=email,public_profile`;

//   console.log("Generated Facebook Auth URL:", facebookAuthUrl);
//   res.json({ authUrl: facebookAuthUrl });
// });

// router.get("/facebook/callback", async (req, res) => {
//   const { code } = req.query;

//   if (!code) {
//     return res.status(400).json({ error: "Missing authorization code" });
//   }

//   try {
//     // Exchange code for access token
//     const tokenResponse = await axios.get(
//       `https://graph.facebook.com/v18.0/oauth/access_token`,
//       {
//         params: {
//           client_id: process.env.FACEBOOK_APP_ID,
//           client_secret: process.env.FACEBOOK_APP_SECRET,
//           redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
//           code,
//         },
//       }
//     );

//     const { access_token } = tokenResponse.data;

//     // Get Facebook User Data
//     const userResponse = await axios.get(
//       `https://graph.facebook.com/me?fields=id,name,email`,
//       { params: { access_token } }
//     );

//     console.log("Facebook User Data:", userResponse.data);
//     res.json({
//       message: "Facebook Authentication Successful!",
//       user: userResponse.data,
//       access_token,
//     });
//   } catch (error) {
//     console.error("Facebook Authentication Error:", error.response?.data || error.message);
//     res.status(500).json({ error: "Authentication failed" });
//   }
// });
// Route to save Facebook credentials (without channel_id)
router.post('/save-facebook-credentials', async (req, res) => {
  const { fb_pixel_id, fb_conversion_token } = req.body;

  if (!fb_pixel_id || !fb_conversion_token) {
      return res.status(400).json({ error: 'Pixel ID and Conversion Token are required' });
  }

  try {
      // Save Pixel ID and Conversion API Token (Mock DB save)
      const channel = await TrafficChannel.create({
          fb_pixel_id,
          fb_conversion_token
      });

      res.status(200).json({
          message: 'Facebook credentials saved successfully!',
          pixel_id: channel.fb_pixel_id,
          conversion_token: channel.fb_conversion_token
      });

  } catch (error) {
      console.error('Error saving Facebook credentials:', error);
      res.status(500).json({ error: 'Failed to save credentials' });
  }
});

// Route to get Facebook Pixel data (no channel_id)
router.get('/facebook-pixel', async (req, res) => {
  try {
      // Fetch the latest saved credentials
      const channel = await TrafficChannel.findOne({
          order: [['createdAt', 'DESC']]  // Get the latest entry
      });

      if (!channel || !channel.fb_pixel_id || !channel.fb_conversion_token) {
          return res.status(404).json({ error: 'No Pixel ID or Access Token found' });
      }

      // Fetch Pixel data from Facebook Graph API
      const response = await axios.get(`https://graph.facebook.com/v19.0/${channel.fb_pixel_id}`, {
          headers: {
              Authorization: `Bearer ${channel.fb_conversion_token}`
          }
      });

      res.status(200).json({
          message: 'Facebook Pixel data retrieved successfully!',
          data: response.data
      });

  } catch (error) {
      console.error('Error fetching Facebook Pixel data:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to retrieve Pixel data' });
  }
});

module.exports = router;
