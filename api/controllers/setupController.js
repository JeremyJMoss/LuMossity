// ==================================================
// =============== Module Dependencies ==============
// ==================================================
const DatabaseConnector = require('../services/DatabaseConnector');
const DatabaseConfigManager = require('../services/DatabaseConfigManager');
const DatabaseInitializer = require('../services/DatabaseInitializer');
const { validateBodySchema } = require('../util/validation');
const { initializeDatabaseSchema } = require("../schemas/databaseSchema");
const { ConflictError } = require('../models/utility/Errors');

// ==================================================
// ===================== Create =====================
// ==================================================
module.exports.initializeDatabase = async (req, res, next) => {

    const alreadyInitialized = DatabaseConfigManager.hasConfig();

    let connection;
    let dbConnection;

    try{
        if ( alreadyInitialized ) {
            throw new ConflictError('Database has already been initialised');
        }

        validateBodySchema(initializeDatabaseSchema, req.body);

        const { host, user, password, database} = req.body;
        
        // Try connecting to the database
        connection = await DatabaseConnector.testHostConnection({host, user, password});
        await DatabaseInitializer.createDatabase(connection, {host, user, password, database});

        dbConnection = await DatabaseConnector.getConnection();
        await DatabaseInitializer.setupTables(dbConnection);

        return res.status(200).json({
            success: true
        });
    } catch(err) {
        next(err)
    } finally {
        if (connection){
            try{
                await connection.end();
            } catch(err) {
                console.error('Failed to close connection to client');
            }
        }
        if (dbConnection) {
            try {
                await dbConnection.end();
            } catch (err) {
                console.error('Failed to close connection to database');
            }
        }
    }
    
}