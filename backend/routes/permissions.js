const express = require("express");
const {pool} = require("../models/db");
const { verifyToken, checkAdmin, checkAdminOrManager } = require("../middleware/auth");
const { logActivity } = require("../middleware/activityLog");

const router = express.Router();

// Get all permissions
router.get("/", verifyToken, checkAdminOrManager, async (req, res) => {
  try {
    const [permissions] = await pool.query("SELECT * FROM permissions");
    res.json(permissions);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get permission by ID
router.get("/:id", verifyToken, checkAdminOrManager, async (req, res) => {
  try {
    const [permission] = await pool.query(
      "SELECT * FROM permissions WHERE permission_id = ?", 
      [req.params.id]
    );
    
    if (permission.length === 0) {
      return res.status(404).json({ error: "Permission not found" });
    }
    
    res.json(permission[0]);
    
  } catch (error) {
    console.error("Error fetching permission:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create new permission (Admin only)
router.post(
  "/", 
  verifyToken, 
  checkAdmin, 
  logActivity("permissions", "CREATE_PERMISSION"),
  async (req, res) => {
    const { permission_name } = req.body;

    try {
      if (!permission_name) {
        return res.status(400).json({ error: "Permission name is required" });
      }
      
      // Check if permission already exists
      const [existingPermission] = await pool.query(
        "SELECT * FROM permissions WHERE permission_name = ?", 
        [permission_name]
      );
      
      if (existingPermission.length > 0) {
        return res.status(400).json({ error: "Permission already exists" });
      }
      
      // Insert new permission
      const [result] = await pool.query(
        "INSERT INTO permissions (permission_name) VALUES (?)",
        [permission_name]
      );
      
      res.status(201).json({ 
        message: "Permission created successfully",
        permission_id: result.insertId
      });
      
    } catch (error) {
      console.error("Error creating permission:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Update permission (Admin only)
router.put(
  "/:id", 
  verifyToken, 
  checkAdmin, 
  logActivity("permissions", "UPDATE_PERMISSION"),
  async (req, res) => {
    const { permission_name } = req.body;
    const { id } = req.params;

    try {
      if (!permission_name) {
        return res.status(400).json({ error: "Permission name is required" });
      }
      
      // Check if permission exists
      const [existingPermission] = await pool.query(
        "SELECT * FROM permissions WHERE permission_id = ?", 
        [id]
      );
      
      if (existingPermission.length === 0) {
        return res.status(404).json({ error: "Permission not found" });
      }
      
      // Update permission
      await pool.query(
        "UPDATE permissions SET permission_name = ? WHERE permission_id = ?",
        [permission_name, id]
      );
      
      res.json({ message: "Permission updated successfully" });
      
    } catch (error) {
      console.error("Error updating permission:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Delete permission (Admin only)
router.delete(
  "/:id", 
  verifyToken, 
  checkAdmin, 
  logActivity("permissions", "DELETE_PERMISSION"),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if permission exists
      const [existingPermission] = await pool.query(
        "SELECT * FROM permissions WHERE permission_id = ?", 
        [id]
      );
      
      if (existingPermission.length === 0) {
        return res.status(404).json({ error: "Permission not found" });
      }
      
      // Check if permission is assigned to any roles
      const [rolePermissions] = await pool.query(
        "SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = ?",
        [id]
      );
      
      if (rolePermissions[0].count > 0) {
        return res.status(400).json({ 
          error: "Cannot delete permission. It is assigned to one or more roles." 
        });
      }
      
      // Delete permission
      await pool.query("DELETE FROM permissions WHERE permission_id = ?", [id]);
      
      res.json({ message: "Permission deleted successfully" });
      
    } catch (error) {
      console.error("Error deleting permission:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;