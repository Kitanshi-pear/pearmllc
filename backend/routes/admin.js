const express = require("express");
const bcrypt = require("bcryptjs");
const {pool} = require("../models/db");
const { verifyToken, checkAdmin, checkAdminOrManager, checkPermission } = require("../middleware/auth");
const { logActivity } = require("../middleware/activityLogger");
require("dotenv").config();

const router = express.Router();

// Employee ID functionality removed since the column doesn't exist in the database

// Get all users (Admin/Manager only)
router.get(
  "/users", 
  verifyToken, 
  checkAdminOrManager, 
  async (req, res) => {
    try {
      const [users] = await pool.query(
        "SELECT id, name, email, role, created_at FROM users"
      );
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get user by ID (Admin/Manager only)
router.get(
  "/users/:id", 
  verifyToken, 
  checkAdminOrManager, 
  async (req, res) => {
    try {
      const [user] = await pool.query(
        "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
        [req.params.id]
      );
      
      if (user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user[0]);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Add new user (Admin/Manager only)
router.post(
  "/users", 
  verifyToken, 
  checkAdminOrManager, 
  logActivity("users", "CREATE_USER"),
  async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
      // Validate role
      const validRoles = ['admin', 'manager', 'media_buyer', 'tl', 'stl', 'accounts'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: "Invalid role. Allowed roles: " + validRoles.join(", ") 
        });
      }
      
      // Additional restriction: Only admins can create admin users
      if (role === "admin" && req.user.role !== "admin") {
        return res.status(403).json({ 
          error: "Only administrators can create admin users" 
        });
      }

      // Email domain validation
      if (!email.endsWith("@pearmediallc.com")) {
        return res.status(400).json({ error: "Email must be from @pearmediallc.com domain" });
      }
      
      // Check if email already exists
      const [existingUser] = await pool.query(
        "SELECT * FROM users WHERE email = ?", 
        [email]
      );
      
      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Email already in use" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const [result] = await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, role]
      );

      res.status(201).json({ 
        message: "User created successfully", 
        user_id: result.insertId
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Update user (Admin/Manager only)
router.put(
  "/users/:id", 
  verifyToken, 
  checkAdminOrManager, 
  logActivity("users", "UPDATE_USER"),
  async (req, res) => {
    const { name, email, role } = req.body;
    const { id } = req.params;
    let { password } = req.body;

    try {
      // Check if user exists
      const [existingUser] = await pool.query(
        "SELECT * FROM users WHERE id = ?", 
        [id]
      );
      
      if (existingUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Additional restriction: Only admins can update admin users
      if (existingUser[0].role === "admin" && req.user.role !== "admin") {
        return res.status(403).json({ 
          error: "Only administrators can update admin users" 
        });
      }
      
      // Additional restriction: Only admins can set admin role
      if (role === "admin" && req.user.role !== "admin") {
        return res.status(403).json({ 
          error: "Only administrators can assign admin role" 
        });
      }
      
      // Validate role if provided
      if (role) {
        const validRoles = ['admin', 'manager', 'media_buyer', 'tl', 'stl', 'accounts'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ 
            error: "Invalid role. Allowed roles: " + validRoles.join(", ") 
          });
        }
      }
      
      // Email domain validation if provided
      if (email && !email.endsWith("@pearmediallc.com")) {
        return res.status(400).json({ error: "Email must be from @pearmediallc.com domain" });
      }
      
      // Check if email already exists (if changing email)
      if (email && email !== existingUser[0].email) {
        const [emailExists] = await pool.query(
          "SELECT * FROM users WHERE email = ? AND id != ?", 
          [email, id]
        );
        
        if (emailExists.length > 0) {
          return res.status(400).json({ error: "Email already in use" });
        }
      }
      
      // Hash password if provided
      if (password) {
        password = await bcrypt.hash(password, 10);
      }
      
      // Build update query dynamically based on provided fields
      let updateFields = [];
      let queryParams = [];
      
      if (name) {
        updateFields.push("name = ?");
        queryParams.push(name);
      }
      
      if (email) {
        updateFields.push("email = ?");
        queryParams.push(email);
      }
      
      if (password) {
        updateFields.push("password = ?");
        queryParams.push(password);
      }
      
      if (role) {
        updateFields.push("role = ?");
        queryParams.push(role);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }
      
      // Add user ID to params
      queryParams.push(id);
      
      // Update user
      await pool.query(
        `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
        queryParams
      );
      
      res.json({ message: "User updated successfully" });
      
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Delete user (Admin only)
router.delete(
  "/users/:id", 
  verifyToken, 
  checkAdmin, 
  logActivity("users", "DELETE_USER"),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if user exists
      const [existingUser] = await pool.query(
        "SELECT * FROM users WHERE id = ?", 
        [id]
      );
      
      if (existingUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Cannot delete yourself
      if (parseInt(id) === req.user.user_id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      // Delete user
      await pool.query("DELETE FROM users WHERE id = ?", [id]);
      
      res.json({ message: "User deleted successfully" });
      
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get user activity logs (Admin/Manager only)
router.get(
  "/activity", 
  verifyToken, 
  checkAdminOrManager, 
  async (req, res) => {
    try {
      // Pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      
      // Optional filtering
      const userId = req.query.user_id;
      const module = req.query.module;
      const activityType = req.query.activity_type;
      
      // Build query conditions
      let conditions = [];
      let queryParams = [];
      
      if (userId) {
        conditions.push("ua.user_id = ?");
        queryParams.push(userId);
      }
      
      if (module) {
        conditions.push("ua.module = ?");
        queryParams.push(module);
      }
      
      if (activityType) {
        conditions.push("ua.activity_type = ?");
        queryParams.push(activityType);
      }
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      
      // Get activities with user info
      const [activities] = await pool.query(
        `SELECT ua.*, u.name, u.email, u.role
         FROM user_activities ua
         JOIN users u ON ua.user_id = u.id
         ${whereClause}
         ORDER BY ua.created_at DESC
         LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );
      
      // Get total count for pagination
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM user_activities ua ${whereClause}`,
        queryParams
      );
      
      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);
      
      res.json({
        activities,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      });
      
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get activity statistics/summary (Admin/Manager only)
router.get(
  "/activity/stats", 
  verifyToken, 
  checkAdminOrManager, 
  async (req, res) => {
    try {
      // Get counts by module
      const [moduleStats] = await pool.query(
        `SELECT module, COUNT(*) as count 
         FROM user_activities 
         GROUP BY module 
         ORDER BY count DESC`
      );
      
      // Get counts by activity type
      const [activityTypeStats] = await pool.query(
        `SELECT activity_type, COUNT(*) as count 
         FROM user_activities 
         GROUP BY activity_type 
         ORDER BY count DESC`
      );
      
      // Get most active users
      const [userStats] = await pool.query(
        `SELECT ua.user_id, u.name, u.email, u.role, COUNT(*) as activity_count 
         FROM user_activities ua
         JOIN users u ON ua.user_id = u.id
         GROUP BY ua.user_id
         ORDER BY activity_count DESC
         LIMIT 10`
      );
      
      // Get recent activity count (last 7 days)
      const [recentActivity] = await pool.query(
        `SELECT DATE(created_at) as date, COUNT(*) as count 
         FROM user_activities 
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         GROUP BY DATE(created_at)
         ORDER BY date`
      );
      
      res.json({
        moduleStats,
        activityTypeStats,
        userStats,
        recentActivity
      });
      
    } catch (error) {
      console.error("Error fetching activity stats:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get dashboard summary data (Admin/Manager only)
router.get(
  "/dashboard", 
  verifyToken, 
  checkAdminOrManager, 
  async (req, res) => {
    try {
      // Get user counts by role
      const [usersByRole] = await pool.query(
        `SELECT role, COUNT(*) as count 
         FROM users 
         GROUP BY role 
         ORDER BY count DESC`
      );
      
      // Get total user count
      const [totalUsers] = await pool.query(
        "SELECT COUNT(*) as count FROM users"
      );
      
      // Get recent activities (last 10)
      const [recentActivities] = await pool.query(
        `SELECT ua.*, u.name, u.email, u.role
         FROM user_activities ua
         JOIN users u ON ua.user_id = u.id
         ORDER BY ua.created_at DESC
         LIMIT 10`
      );
      
      // Get recently added users
      const [recentUsers] = await pool.query(
        `SELECT id, name, email, role, created_at 
         FROM users 
         ORDER BY created_at DESC 
         LIMIT 5`
      );
      
      res.json({
        usersByRole,
        totalUsers: totalUsers[0].count,
        recentActivities,
        recentUsers
      });
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;