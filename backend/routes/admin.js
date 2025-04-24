const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../models/db");
const { verifyToken, checkAdmin } = require("../middleware/auth");
require("dotenv").config();

const router = express.Router();


async function generateEmployeeID() {
    try {
        const [rows] = await db.query(
            "SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id, 8) AS UNSIGNED)), 0) + 1 AS next_id FROM users WHERE employee_id LIKE CONCAT('EMP', YEAR(CURDATE()), '%')"
        );
        const nextID = rows[0].next_id;
        return `EMP${new Date().getFullYear()}${String(nextID).padStart(3, "0")}`;
    } catch (error) {
        throw new Error("Error generating employee ID");
    }
}

router.post("/add", verifyToken, checkAdmin, async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        if (!["admin", "manager"].includes(role)) {
            return res.status(400).json({ error: "Role must be 'admin' or 'manager'" });
        }

        if (!email.endsWith("@pearmediallc.com")) {
            return res.status(400).json({ error: "Email must be from @pearmediallc.com domain" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const employee_id = await generateEmployeeID();

        await db.query(
            "INSERT INTO users (employee_id, name, email, password, role, created_by) VALUES (?, ?, ?, ?, ?, ?)",
            [employee_id, name, email, hashedPassword, role, req.user.user_id]
        );

        res.status(201).json({ message: `${role} added successfully!`, employee_id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
