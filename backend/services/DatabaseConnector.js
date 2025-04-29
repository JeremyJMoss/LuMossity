const DatabaseConfigManager = require('./DatabaseConfigManager');
const mysql = require('mysql2/promise');

class DatabaseConnector {

    static async getConnection() {
        try {
            const config = DatabaseConfigManager.getConfig();
            return await mysql.createConnection(config);
        } catch (err) {
            throw new Error('Database Connection Error: Could not make connection to the database');
        }
    }

    static async withConnection(callback) {
        let dbConnection;
        try {
            dbConnection = await this.getConnection();
            return await callback(dbConnection);
        } catch (err) {
            throw err;
        } finally {
            if (dbConnection) {
                try {
                    await dbConnection.end();
                } catch (err) {
                    console.error('Failed to close database connection');
                }
            }
        }
    }

    static async testHostConnection({ host, user, password }) {
        try {
            return await mysql.createConnection({ host, user, password });
        } catch (err) {
            if (err.code === 'ECONNREFUSED') {
                throw new Error('Cannot connect to MySQL server');
            }
            throw new Error('Access denied. Please check your MySQL username/password.');
        }
    }
}

module.exports = DatabaseConnector;