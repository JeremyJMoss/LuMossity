const AuthService = require("../services/AuthService");
const DatabaseConnector = require("../services/DatabaseConnector");
const jwt = require('jsonwebtoken');
const config = require("config");

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
    static async create( username, email, password, role = 3 ) {
        try {
            const existingUserData = await User.#getExistingUserData( {email} );
            
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
            const existingUserData = await User.#getExistingUserData( { [method]: value } );

            if ( !existingUserData ) {
                return null;
            }

            const user = new User( existingUserData.username, existingUserData.email, existingUserData.hashedPassword, existingUserData.role, existingUserData.userId );

            return user;


        } catch (err) {
            throw err;
        }
    }

    static async #getExistingUserData( { email = '', id = null } ){
        // Get retrieval method
        let query = '';
        let query_var = null;
        if (id) {
            query_var = id;
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
            dbConnection =  await DatabaseConnector.getConnection();

            const [users] = await dbConnection.query(
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
            dbConnection = await DatabaseConnector.getConnection();
            const [result] = await dbConnection.execute(
                `INSERT INTO users (username, email, password, role_id) VALUES(?, ?, ?, ?)`,
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

    async getFailedLogins() {
        let dbConnection;

        try {
            dbConnection = await DatabaseConnector.getConnection();
            const [rows] = await dbConnection.query(
                `SELECT failed_logins FROM users WHERE ID = ? LIMIT 1`
                [this.userId]
            )

            if (rows.length === 0) return null;

            const failed_logins = rows[0];

            return failed_logins;

        } catch (err) {
            throw new Error('Could not access failed logins from database');
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

    async setFailedLogins( newAmount ) {
        let dbConnection;

        try {
            dbConnection = await DatabaseConnector.getConnection();
            
            await dbConnection.query(
                `UPDATE users SET failed_logins = ? WHERE ID = ?`
                [newAmount, this.userId]
            )

        } catch (err) {
            throw new Error('Could not update failed logins in database');
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

    async setLastLogin() {
        let dbConnection;

        try {
            dbConnection = await DatabaseConnector.getConnection();
            
            await dbConnection.query(
                `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE ID = ?`,
                [this.userId]
            )

        } catch (err) {
            throw new Error('Could not update last login in database');
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

    async login( password ) {
        try {
            const isCorrect = await AuthService.comparePassword( password, this.hashedPassword );

            if ( !isCorrect ) {
                const failedLogins = await this.getFailedLogins();
                await this.setFailedLogins(++failedLogins);
                throw new Error("Password Verification Failed");
            }

            await this.setLastLogin();
    
            const token = jwt.sign(
                { user_id: this.userId },
                config.get('jwtSecret'),
                { expiresIn: '7d' }
            );
    
            return token;

        } catch (err) {
            throw err;
        }
    }

}

module.exports = User;