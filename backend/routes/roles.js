const express = require("express");
const {pool} = require("../models/db");
const { verifyToken, checkAdmin, checkAdminOrManager } = require("../middleware/auth");
const { logActivity } = require("../middleware/activityLog");

const router = express.Router();

// Get all roles
router.get("/", verifyToken, checkAdminOrManager, async (req, res) => {
  try {
    const [roles] = await pool.query("SELECT * FROM roles");
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get role by ID
router.get("/:id", verifyToken, checkAdminOrManager, async (req, res) => {
  try {
    const [role] = await pool.query("SELECT * FROM roles WHERE id = ?", [req.params.id]);
    
    if (role.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }
    
    // Get role permissions
    const [permissions] = await pool.query(
      `SELECT p.* FROM permissions p
       JOIN role_permissions rp ON p.permission_id = rp.permission_id
       WHERE rp.role_id = ?`,
      [req.params.id]
    );
    
    res.json({
      ...role[0],
      permissions
    });
    
  } catch (error) {
    console.error("Error fetching role:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create new role (Admin only)
router.post(
  "/", 
  verifyToken, 
  checkAdmin, 
  logActivity("roles", "CREATE_ROLE"),
  async (req, res) => {
    const { role_name } = req.body;

    try {
      // Validate role name
      if (!role_name) {
        return res.status(400).json({ error: "Role name is required" });
      }
      
      // Check valid enum values
      const validRoles = ['admin', 'manager', 'media_buyer', 'tl', 'stl', 'accounts'];
      if (!validRoles.includes(role_name)) {
        return res.status(400).json({ 
          error: "Invalid role name. Must be one of: " + validRoles.join(", ") 
        });
      }
      
      // Check if role already exists
      const [existingRole] = await pool.query(
        "SELECT * FROM roles WHERE role_name = ?", 
        [role_name]
      );
      
      if (existingRole.length > 0) {
        return res.status(400).json({ error: "Role already exists" });
      }
      
      // Insert new role
      const [result] = await pool.query(
        "INSERT INTO roles (role_name) VALUES (?)",
        [role_name]
      );
      
      res.status(201).json({ 
        message: "Role created successfully",
        role_id: result.insertId
      });
      
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Update role (Admin only)
router.put(
  "/:id", 
  verifyToken, 
  checkAdmin, 
  logActivity("roles", "UPDATE_ROLE"),
  async (req, res) => {
    const { role_name } = req.body;
    const { id } = req.params;

    try {
      // Validate role name
      if (!role_name) {
        return res.status(400).json({ error: "Role name is required" });
      }
      
      // Check valid enum values
      const validRoles = ['admin', 'manager', 'media_buyer', 'tl', 'stl', 'accounts'];
      if (!validRoles.includes(role_name)) {
        return res.status(400).json({ 
          error: "Invalid role name. Must be one of: " + validRoles.join(", ") 
        });
      }
      
      // Check if role exists
      const [existingRole] = await pool.query(
        "SELECT * FROM roles WHERE id = ?", 
        [id]
      );
      
      if (existingRole.length === 0) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      // Update role
      await pool.query(
        "UPDATE roles SET role_name = ? WHERE id = ?",
        [role_name, id]
      );
      
      res.json({ message: "Role updated successfully" });
      
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Delete role (Admin only)
router.delete(
  "/:id", 
  verifyToken, 
  checkAdmin, 
  logActivity("roles", "DELETE_ROLE"),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if role exists
      const [existingRole] = await pool.query(
        "SELECT * FROM roles WHERE id = ?", 
        [id]
      );
      
      if (existingRole.length === 0) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      // Check if role is being used by any users
      const [usersWithRole] = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE role = ?",
        [existingRole[0].role_name]
      );
      
      if (usersWithRole[0].count > 0) {
        return res.status(400).json({ 
          error: "Cannot delete role. It is assigned to one or more users." 
        });
      }
      
      // Delete role permissions first
      await pool.query(
        "DELETE FROM role_permissions WHERE role_id = ?",
        [id]
      );
      
      // Delete role
      await pool.query("DELETE FROM roles WHERE id = ?", [id]);
      
      res.json({ message: "Role deleted successfully" });
      
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Assign permissions to role (Admin only)
router.post(
  "/:id/permissions", 
  verifyToken, 
  checkAdmin, 
  logActivity("roles", "ASSIGN_PERMISSION"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: "Permissions must be an array of permission IDs" });
      }
      
      // Check if role exists
      const [existingRole] = await pool.query(
        "SELECT * FROM roles WHERE id = ?", 
        [id]
      );
      
      if (existingRole.length === 0) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      // Begin transaction
      await pool.query("START TRANSACTION");
      
      try {
        // Remove existing permissions for this role
        await pool.query(
          "DELETE FROM role_permissions WHERE role_id = ?",
          [id]
        );
        
        // Add new permissions
        for (const permissionId of permissions) {
          await pool.query(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
            [id, permissionId]
          );
        }
        
        // Commit transaction
        await pool.query("COMMIT");
        
        res.json({ message: "Permissions assigned successfully" });
        
      } catch (error) {
        // Rollback on error
        await pool.query("ROLLBACK");
        throw error;
      }
      
    } catch (error) {
      console.error("Error assigning permissions:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;