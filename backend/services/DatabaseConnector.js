const DatabaseConfigManager = require('./DatabaseConfigManager');
const mysql = require('mysql2/promise');

class DatabaseConnector {

    static async getConnection() {
        const config = DatabaseConfigManager.getConfig();
        return await mysql.createConnection(config);
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