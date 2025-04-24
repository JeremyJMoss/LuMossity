const DatabaseConnector = require('../services/DatabaseConnector');
const DatabaseConfigManager = require('../services/DatabaseConfigManager');
const DatabaseInitializer = require('../services/DatabaseInitializer');
const {validateFields} = require('../util/validation');

module.exports.initializeDatabase = async (req, res) => {

    const alreadyInitialized = DatabaseConfigManager.hasConfig();

    if ( alreadyInitialized ) {
        return res.status(400).json({
            success: false,
            error: 'Database already initialized'
        });
    }

    const missingFields = validateFields(req.body, ['host', 'user', 'password', 'database'])

    if (missingFields.length > 0) {
        return res.status(422).json({
            success: false,
            error: 'Missing required fields',
            missing: missingFields
        });
    }

    const { host, user, password, database} = req.body;

    let connection;
    let dbConnection;
    // Try connecting to the database
    try{

        connection = await DatabaseConnector.testHostConnection({host, user, password});
        await DatabaseInitializer.createDatabase(connection, {host, user, password, database});

        dbConnection = await DatabaseConnector.getConnection();
        await DatabaseInitializer.setupTables(dbConnection);

        return res.status(200).json({
            success: true
        });
    } catch(err) {
        console.error(err.message);
        return res.status(500).json({
            success: false,
            error: err.message
        });
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