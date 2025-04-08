require("dotenv").config();
const mysql = require("mysql2");
const { Sequelize } = require("sequelize");

// MySQL Connection Pool (for raw queries)
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "kitanshi",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pearm_tracking_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Handle MySQL Connection Errors
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ MySQL Connection Failed:", err.message);
        process.exit(1); // Exit process on failurex
    }
    console.log("✅ MySQL Connected Successfully!");
    connection.release();
});

// Sequelize ORM Connection
const sequelize = new Sequelize(
    process.env.DB_NAME || "pearm_tracking_db",
    process.env.DB_USER || "kitanshi",
    process.env.DB_PASSWORD || "",
    {
        host: process.env.DB_HOST || "localhost",
        dialect: "mysql",
        logging: false, // Set true for debugging SQL queries
        retry: { max: 3 }, // Auto-retry connection failures
    }
);

// Handle Sequelize Authentication
sequelize.authenticate()
    .then(() => console.log("✅ Sequelize Connected Successfully!"))
    .catch(err => {
        console.error("❌ Sequelize Connection Failed:", err.message);
        process.exit(1);
    });

module.exports = { pool: pool.promise(), sequelize };
