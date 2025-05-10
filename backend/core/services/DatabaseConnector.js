const { mapMySQLError } = require('../util/helpers');
const DatabaseConfigManager = require('./DatabaseConfigManager');
const mysql = require('mysql2/promise');

class DatabaseConnector {

    static async getConnection() {
        try {
            const config = DatabaseConfigManager.getConfig();
            return await mysql.createConnection(config);
        } catch (err) {
            const {message, status_code} = mapMySQLError(err);

            throw new AppError(message, status_code);
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
            const {message, status_code} = mapMySQLError(err);
            throw new Error(message, status_code);
        }
    }
}

module.exports = DatabaseConnector;