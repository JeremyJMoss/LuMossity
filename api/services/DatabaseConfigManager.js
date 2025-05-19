const fs = require('fs');
const { configPath } = require('../util/constants');

class DatabaseConfigManager {

    /**
     * Checks if database config exists
     * @static
     * @method
     * @returns {boolean} whether database config exists or not
     */
    static hasConfig() {
        return fs.existsSync( configPath );
    }

    /**
     * Retrieves the database configuration from a JSON file.
     * @static
     * @method
     * @returns {Object} Database configuration object.
     * @throws {Error} If database configuration is not found.
     */
    static getConfig() {
        if ( !DatabaseConfigManager.hasConfig() ) throw new Error( 'Database configuration not found' );
        return JSON.parse(fs.readFileSync( configPath, 'utf-8' ) );
    }

    /**
     * Saves configuration to JSON file.
     * @static
     * @method
     * @param {Object} config - Configuration to be stored in JSON file 
     */
    static saveConfig( config ) {
        fs.writeFileSync( configPath, JSON.stringify( config, null, 2 ) );
    }

    /**
     * Removes config from JSON file.
     * @static
     * @method
     */
    static removeConfig() {
        if ( DatabaseConfigManager.hasConfig() ) {
            fs.unlink(configPath, (err) => {
                if (err){
                    console.log(err);
                }
            });
        }
    }
}

module.exports = DatabaseConfigManager;