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
    
    // Try connecting to the database
    try{
        const connection = await DatabaseConnector.testHostConnection({host, user, password});
        await DatabaseInitializer.createDatabase(connection, {host, user, password, database});
        const dbConnection = await DatabaseConnector.getConnection();
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
        await dbConnection.end();
    }
    
}