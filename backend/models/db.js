require("dotenv").config();
const mysql = require("mysql2");
const { Sequelize } = require("sequelize");

// ✅ Validate required .env variables
const requiredEnv = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_PORT"];
for (const key of requiredEnv) {
    if (!process.env[key]) {
        console.error(`❌ Missing .env value: ${key}`);
        process.exit(1);
    }
}

// ✅ DB Config from environment
const DB_CONFIG = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10),
};

// ✅ Raw MySQL Connection Pool
const pool = mysql.createPool({
    ...DB_CONFIG,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 72000, // 72 seconds
});

// ✅ Test raw MySQL connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error(`❌ MySQL Pool Connection Failed: ${err.message}`);
        process.exit(1);
    }
    console.log("✅ MySQL Pool Connected");
    connection.release();
});

// ✅ Sequelize ORM
const sequelize = new Sequelize(DB_CONFIG.database, DB_CONFIG.user, DB_CONFIG.password, {
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    dialect: "mysql",
    logging: false,
    dialectOptions: {
        connectTimeout: 72000, // 72 seconds
    },
});

// ✅ Test Sequelize connection
sequelize.authenticate()
    .then(() => console.log("✅ Sequelize ORM Connected"))
    .catch((err) => {
        console.error("❌ Sequelize ORM Connection Failed:", err.message);
        process.exit(1);
    });

// ✅ Exports
module.exports = {
    sequelize,
    pool: pool.promise(),
};
