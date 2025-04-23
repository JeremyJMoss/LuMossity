const fs = require('fs');
const { configPath } = require('../util/constants');

class DatabaseConfigManager {
    static getConfig() {
        if ( !fs.existsSync( configPath ) ) throw new Error( 'DB config not found' );
        return JSON.parse(fs.readFileSync( configPath, 'utf-8' ) );
    }

    static saveConfig( config ) {
        fs.writeFileSync( configPath, JSON.stringify( config, null, 2 ) );
    }
}

module.exports = DatabaseConfigManager;