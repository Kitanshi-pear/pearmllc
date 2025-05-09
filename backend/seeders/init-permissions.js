const {pool} = require("../models/db");
const bcrypt = require("bcryptjs");
require("dotenv").config();

/**
 * Initialize default roles, permissions, and admin user
 */
async function initializeSystem() {
  try {
    console.log("Starting system initialization...");
    
    // Begin transaction
    await pool.query("START TRANSACTION");
    
    // Define default permissions
    const defaultPermissions = [
      "view_dashboard",
      "manage_users",
      "view_users",
      "create_user",
      "update_user",
      "delete_user",
      "manage_roles",
      "view_roles",
      "create_role",
      "update_role",
      "delete_role",
      "manage_permissions",
      "view_permissions",
      "assign_permissions",
      "view_activity_logs",
      "manage_media_buyers",
      "view_campaigns",
      "create_campaign",
      "update_campaign",
      "delete_campaign",
      "view_reports",
      "create_report",
      "view_statistics"
    ];
    
    // Insert permissions
    console.log("Creating default permissions...");
    for (const permission of defaultPermissions) {
      // Check if permission already exists
      const [existingPermission] = await pool.query(
        "SELECT * FROM permissions WHERE permission_name = ?",
        [permission]
      );
      
      if (existingPermission.length === 0) {
        await pool.query(
          "INSERT INTO permissions (permission_name) VALUES (?)",
          [permission]
        );
      }
    }
    
    // Get all inserted permissions
    const [permissions] = await pool.query("SELECT * FROM permissions");
    
    // Define roles and their permissions
    const roles = [
      {
        name: "admin",
        permissions: permissions.map(p => p.permission_id) // All permissions
      },
      {
        name: "manager",
        permissions: permissions
          .filter(p => !["delete_user", "delete_role", "manage_permissions", "assign_permissions"].includes(p.permission_name))
          .map(p => p.permission_id)
      },
      {
        name: "media_buyer",
        permissions: permissions
          .filter(p => ["view_dashboard", "view_campaigns", "create_campaign", "update_campaign", "view_reports", "view_statistics"].includes(p.permission_name))
          .map(p => p.permission_id)
      },
      {
        name: "tl",
        permissions: permissions
          .filter(p => ["view_dashboard", "view_campaigns", "view_reports", "view_statistics"].includes(p.permission_name))
          .map(p => p.permission_id)
      },
      {
        name: "stl",
        permissions: permissions
          .filter(p => ["view_dashboard", "view_campaigns", "view_reports", "view_statistics", "create_report"].includes(p.permission_name))
          .map(p => p.permission_id)
      },
      {
        name: "accounts",
        permissions: permissions
          .filter(p => ["view_dashboard", "view_reports", "view_statistics", "create_report"].includes(p.permission_name))
          .map(p => p.permission_id)
      }
    ];
    
    // Insert roles and their permissions
    console.log("Creating default roles and assigning permissions...");
    for (const role of roles) {
      // Check if role already exists
      const [existingRole] = await pool.query(
        "SELECT * FROM roles WHERE role_name = ?",
        [role.name]
      );
      
      let roleId;
      
      if (existingRole.length === 0) {
        const [result] = await pool.query(
          "INSERT INTO roles (role_name) VALUES (?)",
          [role.name]
        );
        roleId = result.insertId;
      } else {
        roleId = existingRole[0].id;
        // Clear existing permissions for this role
        await pool.query(
          "DELETE FROM role_permissions WHERE role_id = ?",
          [roleId]
        );
      }
      
      // Assign permissions to role
      for (const permissionId of role.permissions) {
        await pool.query(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
          [roleId, permissionId]
        );
      }
    }
    
    // Create default admin user if not exists
    console.log("Checking if default admin user exists...");
    const [existingAdmin] = await pool.query(
      "SELECT * FROM users WHERE email = 'admin@pearmediallc.com'"
    );
    
    if (existingAdmin.length === 0) {
      console.log("Creating default admin user...");
      const hashedPassword = await bcrypt.hash("adminPassword123", 10);
      
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        ["System Admin", "admin@pearmediallc.com", hashedPassword, "admin"]
      );
    }
    
    // Commit transaction
    await pool.query("COMMIT");
    
    console.log("System initialization completed successfully!");
    return true;
  } catch (error) {
    // Rollback on error
    await pool.query("ROLLBACK");
    console.error("Error during system initialization:", error);
    return false;
  }
}

// Run initialization
initializeSystem()
  .then(success => {
    if (success) {
      console.log("Initialization complete!");
    } else {
      console.error("Initialization failed!");
    }
    process.exit();
  })
  .catch(error => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });