const AuthService = require("../services/AuthService");
const DatabaseConnector = require("../services/DatabaseConnector");

class User {
    constructor( username, email, hashedPassword, role, userId ) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.hashedPassword = hashedPassword;
        this.role = role;
    }

    /**
     * Creates a new user
     * @param {string} username 
     * @param {string} email 
     * @param {string} password 
     * @param {number} role 
     * @returns User|Error
     */
    static async create( username, email, password, role = 2 ) {
        try {
            const existingUserData = User.#getExistingUserData( {email} );
            
            if ( existingUserData ) {
                throw new Error('User with that email already exists');
            }
    
            const hashedPassword = await AuthService.hashPassword(password);
            const user = new User( username, email, hashedPassword, role );
            await user.#create();
            return user;


        } catch (err) {
            throw err;
        }
    }

    /**
     * Searches for user by either email or userId and then returns that user
     * @param {string} method 
     * @param {string} value 
     * @returns null|User|Error
     */
    static async getUserBy( method, value ) {
        try {
            const existingUserData = User.#getExistingUserData( { [method]: value } );

            if ( !existingUserData ) {
                return null;
            }

            const user = new User( existingUserData.username, existingUserData.email, existingUserData.hashedPassword, existingUserData.role, existingUserData.userId );

            return user;


        } catch (err) {
            throw err;
        }
    }

    static async #getExistingUserData( { email = '', userId = null } ){
        // Get retrieval method
        let query = '';
        let query_var = null;
        if (userId) {
            query_var = userId;
            query = 'SELECT * FROM users WHERE ID = ? LIMIT 1';
        } else if (email) {
            query_var = email;
            query = 'SELECT * FROM users WHERE email = ? LIMIT 1';
        }

        if ( !query && !query_var){
            throw new Error('No query variable set to retreive user');
        }
        
        // Attempt to get user
        let dbConnection;

        try {
            dbConnection = DatabaseConnector.getConnection();

            const users = await dbConnection.query(
                query, 
                [query_var]
            );

            if (users.length === 0) return null;

            const user = users[0];

            return {
                email: user.email,
                hashedPassword: user.password,
                username: user.username,
                role: user.role,
                userId: user.ID
            }
        } catch (err) {
            throw new Error('Could not retrieve user from database');
        } finally {
            if (dbConnection){
                try {
                    await dbConnection.end();
                } catch (err) {
                    throw new Error('Failed to close database connection');
                }
            }
        }
    }

    async #create() {
        let dbConnection;
        try {
            dbConnection = DatabaseConnector.getConnection();
            const [result] = await dbConnection.execute(
                `INSERT INTO users (username, email, password, role) VALUES(?, ?, ?, ?)`,
                [this.username, this.email, this.hashedPassword, this.role]
            )

            if ( !result?.insertId ){
                throw new Error('Insert not successful');
            }

            this.userId = result.insertId;

        } catch (err) {
            throw new Error('Could not create user: ' + err.message);
        } finally {
            if (dbConnection) {
                try {
                    await dbConnection.end();
                } catch (err) {
                    throw new Error('Failed to close database connection');
                }
            }
        }
    }


}

module.exports = User;