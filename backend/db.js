const fs = require('fs');
const mysql = require('mysql2/promise');
const {configPath} = require("./constants/constants");

// Helpers //
const isValidDatabaseName = (name) => {
    const mysqlReservedWords = ['select', 'drop', 'insert', 'update', 'delete', 'from', 'where', 'table', 'create'];

    const isSafe = /^[a-zA-Z0-9_]+$/.test(name);
    const isReserved = mysqlReservedWords.includes(name.toLowerCase());
    return isSafe && !isReserved;
};

const getDatabaseConfig = () => {
    if ( !fs.existsSync( configPath ) ) throw new Error('DB config not found');
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw);
};

const connectToDatabase = async () => {
    const config = getDatabaseConfig();
    return await mysql.createConnection( config );
};

/**
 * Checks if mysql host can be successfully connected to
 * @param {string} host 
 * @param {string} user 
 * @param {string} password 
 * @returns Error|Promise<mysql.Connection>
 */
module.exports.attemptDatabaseConnection = async ( host = null, user = null, password = null, database = null ) => {
        if ( !host && !user && !password && !database ) {
            try {
                const connection = await connectToDatabase();
                return connection;
            } catch (err) {
                throw new Error( 'Error connecting to database: ' + err.message );
            }
        }

        try {
            const connection = await mysql.createConnection({ host, user, password });
            return connection;
        } catch (err) {
            console.error('MySQL connection failed:' + err.message);
            
            if (err.code === 'ECONNREFUSED') {
                throw new Error('Cannot connect to MySQL server');
            }
            
            if (err.code === 'ER_ACCESS_DENIED_ERROR') {
                throw new Error('Access denied. Please check your MySQL username/password.');
            }
            
            throw new Error('Unknown database error: ' + err.message );
        }
}

/**
 * Attempts to create database
 * @param {Promise<mysql.Connection>} connection 
 * @param {string} databaseName
 * @returns void
 */
module.exports.attemptCreateDatabase = async (connection, config ) => {
    const isValid = isValidDatabaseName(config.database);

    if (!isValid) {
        throw new Error('Invalid database name');
    }

    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);

        await connection.end();

        try {
            fs.writeFileSync( configPath, JSON.stringify( config, null, 2 ) );
        } catch (err) {
            throw new Error( 'Error writing to config file:' + err.message );
        }

    } catch (err) {
        await connection.end();     
        throw new Error( 'Failed to create database: ' + err.message );
    }
}

module.exports.attemptSetupTables = async ( connection ) => {
    try {
        await connection.query(
            `CREATE TABLE IF NOT EXISTS \`entities\` (
                ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                entity_name VARCHAR(255) NOT NULL
            )`);
        await connection.query(
            `CREATE TABLE IF NOT EXISTS \`entities_structure\` (
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
        await connection.end();
        throw new Error( 'Could not create database tables: ' + err.message );
    }
}

