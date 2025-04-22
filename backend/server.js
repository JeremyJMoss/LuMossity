const express = require("express");
const bodyParser = require('body-parser');
const cors = require("cors");
const { attemptCreateDatabase, attemptSetupTables, attemptDatabaseConnection } = require("./db");

const server = express();
server.use(cors());

server.use(bodyParser.json());

server.post('/api/setup', async (req, res) => {

    const { host, user, password, database } = req.body || {};

    const missingFields = [];
    if (!host) missingFields.push('host');
    if (!user) missingFields.push('user');
    if (!password) missingFields.push('password');
    if (!database) missingFields.push('database');

    if (missingFields.length > 0) {
        return res.status(422).json({
            success: false,
            error: 'Missing required fields',
            missing: missingFields
        });
    }
  
    // Try connecting to the database
    try{
        const connection = await attemptDatabaseConnection(host, user, password);
        await attemptCreateDatabase(connection, {host, user, password, database});
        console.log("here");
        const dbConnection = await attemptDatabaseConnection();
        await attemptSetupTables(dbConnection);
        await dbConnection.end();
        res.status(200).json({
            success: true
        });
    } catch(err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
    
});

server.listen(4000, () => {
    console.log("server listening on port 4000");
})