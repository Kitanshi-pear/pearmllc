const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {pool} = require("../models/db");
const { verifyToken, checkAdmin, checkAdminOrManager } = require("../middleware/auth");
const { logActivity } = require("../middleware/activityLogger");
require("dotenv").config();

const router = express.Router();

// SIGNUP API - Only Admin/Manager can create new users
router.post(
  "/signup", 
  verifyToken, 
  checkAdminOrManager, 
  logActivity("auth", "CREATE_USER"),
  async (req, res) => {
    console.log("Signup API hit!", req.body);

    const { name, email, password, role } = req.body;

    try {
      // Email domain validation
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
      const allowedRoles = ["admin", "manager", "media_buyer", "tl", "stl", "accounts"];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ 
          error: "Invalid role. Allowed roles: " + allowedRoles.join(", ") 
        });
      }
      
      // Additional restriction: Only admins can create admin users
      if (role === "admin" && req.user.role !== "admin") {
        return res.status(403).json({ 
          error: "Only administrators can create admin users" 
        });
      }

      // Insert the new user
      const [result] = await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, role]
      );

      res.status(201).json({ 
        message: "User registered successfully!",
        user_id: result.insertId
      });

    } catch (error) {
      console.error("Signup Error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// LOGIN API with activity logging
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
      { expiresIn: "24h" }
    );

    // Log the login activity
    pool.query(
      "INSERT INTO user_activities (user_id, activity_type, module, description, ip_address) VALUES (?, ?, ?, ?, ?)",
      [user.id, "LOGIN", "auth", "User logged in", req.ip || req.connection.remoteAddress]
    );

    console.log("Login Successful!");
    res.json({ 
      token, 
      user_id: user.id, 
      role: user.role,
      name: user.name,
      email: user.email
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Logout endpoint
router.post(
  "/logout", 
  verifyToken, 
  logActivity("auth", "LOGOUT"),
  (req, res) => {
    // JWT is stateless, so there's no server-side session to invalidate
    // Client should discard the token
    res.json({ message: "Logged out successfully" });
  }
);

// Get current user profile
router.get(
  "/me", 
  verifyToken, 
  async (req, res) => {
    try {
      const [user] = await pool.query(
        "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
        [req.user.user_id]
      );
      
      if (user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user[0]);
      
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Update password
router.put(
  "/change-password", 
  verifyToken, 
  logActivity("auth", "CHANGE_PASSWORD"),
  async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    try {
      // Get user from database
      const [user] = await pool.query(
        "SELECT * FROM users WHERE id = ?",
        [req.user.user_id]
      );
      
      if (user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user[0].password);
      
      if (!isMatch) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password in database
      await pool.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, req.user.user_id]
      );
      
      res.json({ message: "Password updated successfully" });
      
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Check if token is valid
router.get("/validate-token", verifyToken, (req, res) => {
  res.json({ 
    valid: true, 
    user_id: req.user.user_id,
    role: req.user.role 
  });
});

module.exports = router;