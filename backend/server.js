const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
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
  { path: 'campaignRoutes', mount: '/api/campaigns' }, // Changed from '/' to '/api/campaigns'
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

// ✅ Auth endpoints (simplified - no Google OAuth)
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
  
  // ✅ API Root
  app.get("/api", (req, res) => {
    console.log("📝 API root requested");
    res.send("Welcome to the PearM Dashboard API Server");
  });
  
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
  
  // Make sure campaign routes are correctly loaded for the /track endpoint
  // Load campaignRoutes for /track directly without changing the original structure
  try {
    console.log("📝 Setting up dedicated track route handler...");
    const campaignRoutesModule = require('./routes/campaignRoutes');
    app.use('/', campaignRoutesModule);
    console.log("✅ Track route handler configured");
  } catch (err) {
    console.error("❌ Error setting up track route:", err);
  }
  
  // This catch-all route must be AFTER all API routes
  app.get("*", (req, res) => {
    // Skip for API routes
    if (req.path.startsWith('/api/')) {
      console.log(`📝 API route requested: ${req.path}`);
      return res.status(404).json({ error: "API endpoint not found" });
    }
    
    console.log(`📝 Serving frontend for path: ${req.path}`);
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
  
  console.log("✅ Frontend static serving configured");
} else {
  console.warn("⚠️ Frontend build not found at", frontendBuildPath);
}

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