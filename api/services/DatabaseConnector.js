const { mapMySQLError } = require('../util/helpers');
const DatabaseConfigManager = require('./DatabaseConfigManager');
const mysql = require('mysql2/promise');
const {AppError} = require('../models/utility/Errors');

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

    static async withConnection(callback, includeTransactions = true) {
        let dbConnection;
        try {
            dbConnection = await this.getConnection();
            if (includeTransactions) await dbConnection.beginTransaction();
            const result = await callback(dbConnection);
            if (includeTransactions) await dbConnection.commit()
            return result;
        } catch (err) {
            if (dbConnection && includeTransactions){
                try {
                    await dbConnection.rollback();
                } catch (rollbackErr) {
                    throw new AppError('Rollback failed:', rollbackErr);
                }
            }
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
            throw new AppError(message, status_code);
        }
    }
}

module.exports = DatabaseConnector;