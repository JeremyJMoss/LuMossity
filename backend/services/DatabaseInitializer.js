const DatabaseConfigManager = require('./DatabaseConfigManager');
const { isValidDatabaseName, mapMySQLError } = require('../util/helpers');
const { AppError, ConflictError } = require('../models/utility/Errors');

class DatabaseInitializer {
    /**
     * Setup Database and save config in json file 
     * @param {mysql.Connection} hostConnection 
     * @param {Object} config 
     */
    static async createDatabase(hostConnection, config) {
        try {
            if (!isValidDatabaseName(config.database)) {
                throw new ConflictError('Invalid database name');
            }
            await hostConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
            DatabaseConfigManager.saveConfig(config);
        } catch (err) {
            if (err instanceof AppError) {
                throw err;
            }

            const {message, status_code} = mapMySQLError(err);
            throw new AppError(message, status_code);
        } finally {
            await hostConnection.end();
        }
    }

    /**
     * setup required tables structure
     * @param {mysql.Connection} dbConnection 
     */
    static async setupTables(dbConnection) {

        try {

            await dbConnection.execute(`CREATE TABLE IF NOT EXISTS entities (
                ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                entity_key VARCHAR(255) NOT NULL UNIQUE,
                entity_name VARCHAR(255) NOT NULL
            )`);

            await dbConnection.execute(`CREATE TABLE IF NOT EXISTS entities_structure (
                ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                entity_id INT NOT NULL,
                field_name VARCHAR(100) NOT NULL,
                display_label VARCHAR(255) DEFAULT NULL,
                field_type VARCHAR(50),
                is_db_column BOOL NOT NULL DEFAULT FALSE,
                is_queryable BOOL NOT NULL DEFAULT FALSE,
                is_required BOOL NOT NULL DEFAULT FALSE,
                default_value TEXT,
                order_index INT DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (entity_id) REFERENCES entities(ID),
                UNIQUE KEY unique_field_per_entity (entity_id, field_name)
            )`);

            await dbConnection.execute(`CREATE TABLE IF NOT EXISTS roles (
                ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                name varchar(255) UNIQUE NOT NULL
            )`);

            await dbConnection.execute(`CREATE TABLE IF NOT EXISTS permissions(
                ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                name varchar(255) UNIQUE NOT NULL
            )`);

            await dbConnection.execute(`CREATE TABLE IF NOT EXISTS role_permissions(
                role_id INT,
                permission_id INT,
                PRIMARY KEY (role_id, permission_id),
                FOREIGN KEY (role_id) REFERENCES roles(ID),
                FOREIGN KEY (permission_id) REFERENCES permissions(ID)
            )`);

            await dbConnection.query(`INSERT INTO roles (name) VALUES ('superadmin'), ('admin'), ('user')`)

            await dbConnection.query(`INSERT INTO permissions (name) 
                VALUES('system:access'), ('users:create'), ('users:edit'), ('users:delete'), ('users:view'), 
                ('entities:create'), ('entities:edit'), ('entities:delete'), ('entities:view'),
                ('permissions:view'), ('roles:create'), ('roles:edit'), ('roles:delete'), ('roles:view')
            `);

            await dbConnection.query(`INSERT INTO role_permissions (role_id, permission_id)
                SELECT r.ID, p.ID
                FROM roles r
                JOIN permissions p
                WHERE r.name = 'superadmin';
            `);

            await dbConnection.query(`INSERT INTO role_permissions (role_id, permission_id)
                SELECT r.ID, p.ID
                FROM roles r
                JOIN permissions p ON p.name != 'permissions:view'
                WHERE r.name = 'admin'
            `)

            await dbConnection.query(`INSERT INTO role_permissions (role_id, permission_id)
                SELECT r.ID, p.ID
                FROM roles r
                JOIN permissions p
                WHERE r.name = 'user'
                AND p.name NOT LIKE 'users%' 
                AND p.name NOT LIKE 'roles%'
            `)

            await dbConnection.execute(`CREATE TABLE IF NOT EXISTS users (
                ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role_id INT NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                last_login DATETIME,
                failed_logins INT DEFAULT 0,
                lockout_until DATETIME,
                password_reset_token VARCHAR(255),
                password_reset_expires DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (role_id) REFERENCES roles(ID)
            )`);

            await dbConnection.execute(`CREATE TABLE user_meta (
                id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                meta_key VARCHAR(255) NOT NULL,
                meta_value TEXT,
                UNIQUE KEY unique_user_meta (user_id, meta_key),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`);

        } catch (err) {
            const {message, status_code} = mapMySQLError(err);
            throw new Error(message, status_code);
        } finally {
            await dbConnection.end();
        }
    }
}

module.exports = DatabaseInitializer;
