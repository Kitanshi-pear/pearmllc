const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");
const session = require("cookie-session");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");

dotenv.config();
const app = express();
const port = process.env.PORT || 10000;

// ✅ CORS
const corsOptions = {
  origin: "*",
  credentials: true,
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Sessions
app.use(session({
  name: "session",
  keys: [process.env.SESSION_SECRET],
  maxAge: 24 * 60 * 60 * 1000,
}));

// ✅ Sequelize DB connection
const { sequelize } = require('./models');
sequelize.sync({ alter: true });

// ✅ All routes (API)
app.use('/api/clicks', require('./routes/clicks'));
app.use('/', require('./routes/postback'));
app.use('/offersource', require('./routes/OfferSource'));
app.use('/api/offers', require('./routes/offerRoutes'));
app.use('/api/domains', require('./routes/domains'));
app.use('/api/landers', require('./routes/landers'));
app.use('/api/lp', require('./routes/lp'));
app.use("/", require("./routes/campaignRoutes"));
app.use('/api/track', require('./routes/track'));
app.use("/api/traffic/facebook", require("./routes/trafficRoutes"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));

// ✅ Google OAuth
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

    res.redirect("https://pearmllc.onrender.com/traffic-channels");
  } catch (error) {
    console.error("OAuth Callback Error:", error.response?.data || error);
    res.status(500).send("Authentication failed");
  }
});

app.get("/auth/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

app.get("/auth/user", (req, res) => {
  res.json({ access_token: req.session.access_token || null });
});

// ✅ Serve React frontend from frontend/build
const frontendBuildPath = path.join(__dirname, "../frontend/build");
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
} else {
  console.warn("⚠️ Frontend build not found. Skipping static serve setup.");
}

// 👇 Serve universal.js statically
app.use(express.static(path.join(__dirname, '../frontend')));

// Optional: log access
app.get('/universal.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/universal.js'));
});

// ✅ API Root
app.get("/api", (req, res) => {
  res.send("Welcome to the PearM Dashboard API Server");
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("Error details:", err.stack);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

// ✅ Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
