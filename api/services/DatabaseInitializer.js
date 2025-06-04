const DatabaseConfigManager = require('./DatabaseConfigManager');
const { isValidDatabaseName, mapMySQLError } = require('../util/helpers');
const { presetsPath, typeConfigPath } = require('../util/constants');
const { AppError, ConflictError } = require('../models/utility/Errors');
const fs = require('fs');

class DatabaseInitializer {
    /**
     * Setup Database and save config in json file
     * @static
     * @async
     * @method
     * @param {mysql.Connection} hostConnection - Host connection to use to create the database.
     * @param {Object} config - Configuration for the new database
     * @throws {AppError} If mysql connection or query fails
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
     * Setup required tables structure
     * @static
     * @async
     * @method
     * @param {mysql.Connection} dbConnection - Connection to the mysql database.
     * @throws {AppError} If a mysql query fails during transaction.
     */
    static async setupTables(dbConnection) {

        try {
            await dbConnection.beginTransaction();

            await dbConnection.execute(`CREATE TABLE IF NOT EXISTS entities (
                ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                entity_key VARCHAR(255) NOT NULL UNIQUE,
                entity_name VARCHAR(255) NOT NULL
            )`);

            await dbConnection.execute(`CREATE TABLE IF NOT EXISTS entities_structure (
                ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                entity_id INT NOT NULL,
                field_name VARCHAR(100) NOT NULL,
                field_type VARCHAR(50) NOT NULL,
                field_config JSON DEFAULT NULL,
                is_db_column BOOL NOT NULL DEFAULT FALSE,
                is_queryable BOOL NOT NULL DEFAULT FALSE,
                is_required BOOL NOT NULL DEFAULT FALSE,
                default_value TEXT,
                order_index INT DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (entity_id) REFERENCES entities(ID),
                UNIQUE KEY unique_field_per_entity (entity_id, field_name)
            )`);

            await dbConnection.execute(`CREATE TABLE IF NOT EXISTS field_types (
                ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL UNIQUE,
                config JSON NOT NULL,
                fields JSON NOT NULL
            )`)

            await dbConnection.execute(`CREATE TABLE IF NOT EXISTS field_presets (
                ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) UNIQUE NOT NULL,
                field_type VARCHAR(50) NOT NULL,
                config JSON NOT NULL
            )`);

            if (fs.existsSync(typeConfigPath)) {
                const type_config = JSON.parse(fs.readFileSync(typeConfigPath, 'utf-8'));

                for (const type of type_config) {
                    await dbConnection.execute(
                        `INSERT INTO field_types (name, config, fields)
                        VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE config = VALUES(config), fields = VALUES(fields)`,
                        [
                            type.field_type,
                            JSON.stringify(type.default_config_schema),
                            JSON.stringify(type.fields)
                        ]
                    );
                }
            }

            if (fs.existsSync(presetsPath)) {
                const presets = JSON.parse(fs.readFileSync(presetsPath, 'utf-8'));

                for (const preset of presets) {
                    await dbConnection.execute(
                        `INSERT INTO field_presets (name, field_type, config)
                        VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE name = name`,
                        [
                            preset.name,
                            preset.field_type,
                            JSON.stringify(preset.config)
                        ]
                    );
                }
            }

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

            await dbConnection.query(`INSERT INTO roles (name) VALUES ('superadmin'), ('admin'), ('user') ON DUPLICATE KEY UPDATE name = name`)

            await dbConnection.query(`INSERT INTO permissions (name)
                VALUES('system:access'), ('users:create'), ('users:edit'), ('users:delete'), ('users:view'), 
                ('entities:create'), ('entities:edit'), ('entities:delete'), ('entities:view'),
                ('permissions:view'), ('roles:create'), ('roles:edit'), ('roles:delete'), ('roles:view')
                ON DUPLICATE KEY UPDATE name = name
            `);

            await dbConnection.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id)
                SELECT r.ID, p.ID
                FROM roles r
                JOIN permissions p
                WHERE r.name = 'superadmin'
                ;
            `);

            await dbConnection.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id)
                SELECT r.ID, p.ID
                FROM roles r
                JOIN permissions p ON p.name != 'permissions:view'
                WHERE r.name = 'admin'
            `)

            await dbConnection.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id)
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

            await dbConnection.execute(`CREATE TABLE IF NOT EXISTS user_meta (
                id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                meta_key VARCHAR(255) NOT NULL,
                meta_value TEXT,
                UNIQUE KEY unique_user_meta (user_id, meta_key),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`);

            await dbConnection.commit()

        } catch (err) {
            try {
                await dbConnection.rollback();
            } catch (rollbackErr) {
                throw new AppError('Rollback failed:', rollbackErr);
            }
            const {message, status_code} = mapMySQLError(err);
            DatabaseConfigManager.removeConfig();
            throw new Error(message, status_code);
        } finally {
            await dbConnection.end();
        }
    }
}

module.exports = DatabaseInitializer;
