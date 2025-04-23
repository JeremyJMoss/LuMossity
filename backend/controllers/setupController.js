const DatabaseConnector = require('../services/DatabaseConnector');
const DatabaseInitializer = require('../services/DatabaseInitializer');
const {validateDbInput} = require('../util/validation');

module.exports.initializeDatabase = async (req, res) => {

    const missingFields = validateDbInput( req.body );

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

        res.status(200).json({
            success: true
        });
    } catch(err) {
        console.error(err.message);
        res.status(500).json({
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