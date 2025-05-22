const { mapMySQLError } = require('../util/helpers');
const DatabaseConfigManager = require('./DatabaseConfigManager');
const mysql = require('mysql2/promise');
const {AppError} = require('../models/utility/Errors');
const logger = require('../models/utility/Logger');

class DatabaseConnector {

    /**
     * Retrieves a connection to the mysql database.
     * @static
     * @async
     * @method
     * @returns {Promise<mysql.Connection>} Connection to the mysql database.
     * @throws {AppError} If mysql fails to connect.
     */
    static async getConnection() {
        try {
            const config = DatabaseConfigManager.getConfig();
            return await mysql.createConnection(config);
        } catch (err) {
            logger.error(err);
            const {message, status_code} = mapMySQLError(err);

            throw new AppError(message, status_code);
        }
    }

    /**
     * Wrapper around mysql connection to allow for transactions to happen and closing connections
     * @async
     * @method
     * @static
     * @param {function} callback - the functionality that you want to run.
     * @param {boolean} includeTransactions - Whether to include transactions or not.
     * @returns {Promise<any>} The result of the callback function passed in
     * @throws {AppError} if connection fails/callback fails
     */
    static async withConnection( callback, includeTransactions = true ) {
        let dbConnection;
        try {
            dbConnection = await this.getConnection();
            if (includeTransactions) await dbConnection.beginTransaction();
            const result = await callback(dbConnection);
            if (includeTransactions) await dbConnection.commit()
            return result;
        } catch (err) {
            if ( dbConnection && includeTransactions ) {
                try {
                    await dbConnection.rollback();
                } catch (rollbackErr) {

                    throw new AppError('Rollback failed:', rollbackErr);
                }
            }
            if (err instanceof AppError) {
                throw err;
            }

            logger.error(err);
            const {message, statusCode} = mapMySQLError(err);

            throw new AppError(message, statusCode);
        } finally {
            if ( dbConnection ) {
                try {
                    await dbConnection.end();
                } catch (err) {
                    console.error('Failed to close database connection');
                }
            }
        }
    }

    /**
     * Test connection to the Mysql server.
     * @static
     * @async
     * @method
     * @param {{host: string, user: string, password: string}} config - Configuration for connection to the mysql server.
     * @returns Connection to the mysql server instance.
     * @throws {AppError} If mysql connection fails.
     */
    static async testHostConnection({ host, user, password }) {
        try {
            return await mysql.createConnection({ host, user, password });
        } catch (err) {
            logger.error(err);
            const {message, status_code} = mapMySQLError(err);
            
            throw new AppError(message, status_code);
        }
    }
}

module.exports = DatabaseConnector;