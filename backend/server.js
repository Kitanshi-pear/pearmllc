const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");
const session = require("cookie-session");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");

console.log("📝 Starting server initialization...");

dotenv.config();
console.log("📝 Environment variables loaded");

const app = express();
const port = process.env.PORT || 10000;
console.log(`📝 Server will run on port ${port}`);

// ✅ CORS
console.log("📝 Setting up CORS...");
const corsOptions = {
  origin: "*",
  credentials: true,
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));
console.log("📝 CORS configured successfully");

// ✅ Middleware setup
console.log("📝 Setting up middleware...");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
console.log("📝 Middleware configured successfully");

// ✅ Sessions
console.log("📝 Setting up sessions...");
app.use(session({
  name: "session",
  keys: [process.env.SESSION_SECRET || "default-secret-key"],
  maxAge: 24 * 60 * 60 * 1000,
}));
console.log("📝 Sessions configured successfully");

// ✅ Sequelize DB connection
console.log("📝 Connecting to database...");
try {
  const { sequelize } = require('./models');
  console.log("📝 Sequelize models loaded successfully");
  sequelize.sync({ alter: true })
    .then(() => {
      console.log("📝 Database synchronized successfully");
    })
    .catch(err => {
      console.error("❌ Database sync error:", err);
    });
} catch (err) {
  console.error("❌ Error loading Sequelize models:", err);
}

// ✅ All routes (API)
console.log("📝 Setting up routes...");

// Helper function to load routes safely
const loadRoutes = (routePath, mountPath) => {
  try {
    console.log(`📝 Loading route: ${routePath} to be mounted at ${mountPath}`);
    
    // Check if file exists
    const routeFilePath = path.resolve(`./routes/${routePath}.js`);
    if (!fs.existsSync(routeFilePath)) {
      console.error(`❌ Route file not found: ${routeFilePath}`);
      return false;
    }
    
    // Load the route
    const routeModule = require(`./routes/${routePath}`);
    console.log(`📝 Route ${routePath} loaded, type:`, typeof routeModule);
    
    // Check if it's a router
    if (typeof routeModule !== 'function') {
      console.error(`❌ Route ${routePath} does not export a valid router function. Exports:`, routeModule);
      return false;
    }
    
    // Mount the route
    app.use(mountPath, routeModule);
    console.log(`✅ Route ${routePath} mounted successfully at ${mountPath}`);
    return true;
  } catch (err) {
    console.error(`❌ Error loading route ${routePath}:`, err);
    return false;
  }
};

// Load all routes
const routeConfig = [
  { path: 'clicks', mount: '/api/clicks' },
  { path: 'postback', mount: '/api/postback' },
  { path: 'OfferSource', mount: '/offersource' },
  { path: 'offerRoutes', mount: '/api/offers' },
  { path: 'domains', mount: '/api/domains' },
  { path: 'landers', mount: '/api/landers' },
  { path: 'lp', mount: '/api/lp' },
  { path: 'campaignRoutes', mount: '/' },
  { path: 'track', mount: '/api/track' },
  { path: 'trafficRoutes', mount: '/api/traffic' },
  { path: 'auth', mount: '/api/auth' },
  { path: 'admin', mount: '/api/admin' },
  { path: 'click-logs', mount: '/api/click-logs' },
  { path: 'conversion-logs', mount: '/api/conversion-logs' }
];

let successfulRoutes = 0;
for (const route of routeConfig) {
  if (loadRoutes(route.path, route.mount)) {
    successfulRoutes++;
  }
}

console.log(`📝 ${successfulRoutes}/${routeConfig.length} routes loaded successfully`);

// ✅ Google OAuth
console.log("📝 Setting up Google OAuth...");
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.warn("⚠️ Google OAuth credentials missing");
}

app.get("/auth/google", (req, res) => {
  console.log("📝 Google OAuth authorization request");
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${CLIENT_ID}&scope=https://www.googleapis.com/auth/adwords&redirect_uri=${REDIRECT_URI}&access_type=offline&prompt=consent`;
  res.redirect(authUrl);
});

app.get("/auth/google/callback", async (req, res) => {
  console.log("📝 Google OAuth callback received");
  const code = req.query.code;
  if (!code) {
    console.error("❌ No authorization code provided");
    return res.status(400).send("No authorization code provided");
  }

  try {
    console.log("📝 Exchanging code for tokens...");
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
    console.log("✅ OAuth tokens received and stored in session");

    res.redirect("https://pearmllc.onrender.com/traffic-channels");
  } catch (error) {
    console.error("❌ OAuth Callback Error:", error.response?.data || error);
    res.status(500).send("Authentication failed");
  }
});

app.get("/auth/logout", (req, res) => {
  console.log("📝 User logout requested");
  req.session = null;
  res.redirect("/");
});

app.get("/auth/user", (req, res) => {
  console.log("📝 User auth status requested");
  res.json({ access_token: req.session.access_token || null });
});

// ✅ Serve React frontend from frontend/build
console.log("📝 Setting up static file serving...");
const frontendBuildPath = path.join(__dirname, "../frontend/build");
if (fs.existsSync(frontendBuildPath)) {
  console.log(`📝 Frontend build found at ${frontendBuildPath}`);
  app.use(express.static(frontendBuildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
  console.log("✅ Frontend static serving configured");
} else {
  console.warn("⚠️ Frontend build not found at", frontendBuildPath);
}

// 👇 Serve universal.js statically
console.log("📝 Setting up universal.js static serving...");
const universalJsPath = path.join(__dirname, '../frontend');
if (fs.existsSync(path.join(universalJsPath, 'universal.js'))) {
  app.use(express.static(universalJsPath));
  console.log("✅ universal.js static serving configured");
} else {
  console.warn("⚠️ universal.js not found at", path.join(universalJsPath, 'universal.js'));
}

// Optional: log access
app.get('/universal.js', (req, res) => {
  console.log("📝 Universal.js requested");
  const filePath = path.join(__dirname, '../frontend/universal.js');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    console.error("❌ universal.js file not found at", filePath);
    res.status(404).send("File not found");
  }
});

// ✅ API Root
app.get("/api", (req, res) => {
  console.log("📝 API root requested");
  res.send("Welcome to the PearM Dashboard API Server");
});

// ✅ Error handler
console.log("📝 Setting up error handler...");
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

// ✅ Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});