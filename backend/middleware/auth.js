const jwt = require("jsonwebtoken");
const db = require("../models/db");
require("dotenv").config();

exports.verifyToken = (req, res, next) => {
    const token = req.header("Authorization");
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
        const [result] = await db.query("SELECT role FROM users WHERE id = ?", [req.user.user_id]);
        if (!result.length || result[0].role !== "admin") {
            return res.status(403).json({ error: "Access denied: Admins only" });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};
