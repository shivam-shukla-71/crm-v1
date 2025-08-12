const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crm_database',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Get connection from pool
const getConnection = async () => {
    try {
        return await pool.getConnection();
    } catch (error) {
        console.error('Error getting database connection:', error.message);
        throw error;
    }
};

// Execute query with connection
const executeQuery = async (query, params = []) => {
    let connection;
    try {
        connection = await getConnection();
        const [results] = await connection.execute(query, params);
        return results;
    } catch (error) {
        console.error('Query execution error:', error.message);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Execute transaction
const executeTransaction = async (queries) => {
    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        const results = [];
        for (const { query, params = [] } of queries) {
            const [result] = await connection.execute(query, params);
            results.push(result);
        }

        await connection.commit();
        return results;
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Transaction error:', error.message);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    pool,
    testConnection,
    getConnection,
    executeQuery,
    executeTransaction
};
