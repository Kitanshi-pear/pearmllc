const jwt = require("jsonwebtoken");
const {pool} = require("../models/db");
require("dotenv").config();

exports.verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace('Bearer ', '');
  if (!token) return res.status(403).json({ error: "Access denied: No token provided" });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

exports.checkAdmin = async (req, res, next) => {
  try {
    const [result] = await pool.query("SELECT role FROM users WHERE id = ?", [req.user.user_id]);
    if (!result.length || result[0].role !== "admin") {
      return res.status(403).json({ error: "Access denied: Admins only" });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.checkAdminOrManager = async (req, res, next) => {
  try {
    const [result] = await pool.query("SELECT role FROM users WHERE id = ?", [req.user.user_id]);
    if (!result.length || (result[0].role !== "admin" && result[0].role !== "manager")) {
      return res.status(403).json({ error: "Access denied: Admins or Managers only" });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.checkPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      // Get user role
      const [userResult] = await pool.query(
        "SELECT role FROM users WHERE id = ?", 
        [req.user.user_id]
      );
      
      if (!userResult.length) {
        return res.status(403).json({ error: "Access denied: User not found" });
      }
      
      const userRole = userResult[0].role;
      
      // Get role id
      const [roleResult] = await pool.query(
        "SELECT id FROM roles WHERE role_name = ?", 
        [userRole]
      );
      
      if (!roleResult.length) {
        return res.status(403).json({ error: "Access denied: Role not found" });
      }
      
      const roleId = roleResult[0].id;
      
      // Check if role has permission
      const [permissionResult] = await pool.query(
        `SELECT rp.* FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.permission_id
         WHERE rp.role_id = ? AND p.permission_name = ?`,
        [roleId, permissionName]
      );
      
      if (!permissionResult.length) {
        return res.status(403).json({ error: `Access denied: Requires ${permissionName} permission` });
      }
      
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ error: "Server error" });
    }
  };
};