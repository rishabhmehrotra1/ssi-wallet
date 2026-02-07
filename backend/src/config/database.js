const mysql = require('mysql2/promise');
const logger = require('./logger');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'ssi_wallet',
    user: process.env.DB_USER || 'ssi_user',
    password: process.env.DB_PASSWORD || 'ssipassword',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

logger.info('MySQL connection pool created');

// Test connection
(async () => {
    try {
        const connection = await pool.getConnection();
        logger.info('Database connection established');
        connection.release();
    } catch (err) {
        logger.error({ err }, 'Failed to connect to the database');
    }
})();

module.exports = pool;
