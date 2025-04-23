const DatabaseConfigManager = require('./DatabaseConfigManager');
const { isValidDatabaseName } = require('../util/helpers');

class DatabaseInitializer {
    static async createDatabase(hostConnection, config) {
        if (!isValidDatabaseName(config.database)) {
            throw new Error('Invalid database name');
        }

        try {
            await hostConnection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
            DatabaseConfigManager.saveConfig(config);
        } catch (err) {
            throw new Error('Failed to create database: ' + err.message);
        } finally {
            await hostConnection.end();
        }
    }

    static async setupTables(dbConnection) {
        try {
            await dbConnection.query(`CREATE TABLE IF NOT EXISTS entities (
                ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                entity_key VARCHAR(255) NOT NULL UNIQUE,
                entity_name VARCHAR(255) NOT NULL
            )`);

            await dbConnection.query(`CREATE TABLE IF NOT EXISTS entities_structure (
                ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                entity_id INT NOT NULL,
                unique_meta_key VARCHAR(255) NOT NULL,
                is_queryable BOOL NOT NULL DEFAULT FALSE,
                field_name VARCHAR(100),
                field_type VARCHAR(50),
                is_required BOOL NOT NULL DEFAULT FALSE,
                default_value TEXT,
                order_index INT DEFAULT 0,
                FOREIGN KEY (entity_id) REFERENCES entities(ID)
            )`);
        } catch (err) {
            throw new Error('Could not create database tables: ' + err.message);
        } finally {
            await dbConnection.end();
        }
    }
}

module.exports = DatabaseInitializer;
