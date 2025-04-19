const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");
const session = require("cookie-session");
const path = require("path");
const cookieParser = require("cookie-parser");
const trafficRoutes = require("./routes/trafficRoutes");  // 🚀 Includes Facebook API now
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");

dotenv.config();
const app = express();

// Ensure that port is properly set with a fallback if not provided
const port = process.env.PORT || 10000; 

// ✅ CORS Configuration
const corsOptions = {
  origin: "pearmllc.onrender.com",         // Local development for React app
  credentials: true,
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Session Configuration
app.use(
  session({
    name: "session",
    keys: [process.env.SESSION_SECRET],  // Ensure your session secret is stored safely
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);

const { sequelize } = require('./models');
sequelize.sync({ alter: true });

// ✅ Routes Setup
const clickRoutes = require('./routes/clicks');
app.use('/api/clicks', clickRoutes);

const postbackRoutes = require('./routes/postback');
app.use('/', postbackRoutes);

app.use(cookieParser());

const OfferSourceRoutes = require('./routes/OfferSource');
app.use('/offersource', OfferSourceRoutes);

const offerRoutes = require('./routes/offerRoutes');
app.use('/api/offers', offerRoutes);

const domainRoutes = require('./routes/domains');
app.use('/api/domains', domainRoutes);

const landerRoutes = require('./routes/landers');
app.use('/api/landers', landerRoutes);

const lpTrackingRoutes = require('./routes/lp');
app.use('/api/lp', lpTrackingRoutes);

const campaignRoutes = require('./routes/campaignRoutes');
app.use('/api/campaigns', campaignRoutes);

// ✅ Google OAuth2 Configuration
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

app.get("/auth/google", (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${CLIENT_ID}&scope=https://www.googleapis.com/auth/adwords&redirect_uri=${REDIRECT_URI}&access_type=offline&prompt=consent`;
  res.redirect(authUrl);
});

app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("No authorization code provided");

  try {
    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const { access_token, refresh_token } = tokenResponse.data;
    req.session.access_token = access_token;
    req.session.refresh_token = refresh_token;
    
    res.redirect("http://localhost:3000/traffic-channels");
  } catch (error) {
    console.error("OAuth Callback Error:", error.response?.data || error);
    res.status(500).send("Authentication failed");
  }
});

app.get("/auth/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

// ✅ Get User Info
app.get("/auth/user", (req, res) => {
  res.json({ access_token: req.session.access_token || null });
});

// ✅ Use `trafficRoutes` for Facebook Integration
app.use("/api/traffic/facebook", trafficRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Server-side routing for tracking requests
const trackRoutes = require("./routes/track");
app.use('/api/track', trackRoutes);

// API Root Route
app.get("/", (req, res) => {
  res.send("Welcome to the PearM Dashboard API Server");
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error details:", err.stack);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
