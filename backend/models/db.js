require("dotenv").config();
const mysql = require("mysql2");
const { Sequelize } = require("sequelize");

const isProduction = process.env.NODE_ENV === "production";

// Environment-aware DB config
const DB_CONFIG = {
    host: isProduction ? process.env.DB_HOST : process.env.DB_HOST_LOCAL || "localhost",
    user: isProduction ? process.env.DB_USER : process.env.DB_USER_LOCAL || "root",
    password: isProduction ? process.env.DB_PASSWORD : process.env.DB_PASSWORD_LOCAL || "",
    database: process.env.DB_NAME || "pearm_tracking_db",
    port: parseInt(process.env.DB_PORT || 3306),
};

// ✅ MySQL Connection Pool (for raw queries)
const pool = mysql.createPool({
    ...DB_CONFIG,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// ✅ Handle MySQL Connection Errors
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ MySQL Connection Failed:", err.message);
        process.exit(1);
    }
    console.log("✅ MySQL Connected Successfully!");
    connection.release();
});

// ✅ Sequelize ORM Connection
const sequelize = new Sequelize(DB_CONFIG.database, DB_CONFIG.user, DB_CONFIG.password, {
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    dialect: "mysql",
    dialectOptions: {
        connectTimeout: 10000,
    },
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    logging: false,
    retry: { max: 3 },
});

// ✅ Handle Sequelize Authentication
sequelize.authenticate()
    .then(() => console.log("✅ Sequelize Connected Successfully!"))
    .catch(err => {
        console.error("❌ Sequelize Connection Failed:", err.message);
        process.exit(1);
    });

module.exports = { pool: pool.promise(), sequelize };
