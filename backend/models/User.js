const AuthService = require("../services/AuthService");
const DatabaseConnector = require("../services/DatabaseConnector");
const { maxFailedLoginAttempts, lockoutBaseTime } = require("../util/constants");

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
    static async create( username, email, password, role = 'user' ) {
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
        let query = 'SELECT u.email, u.password, u.username, r.name as role, u.ID FROM users u JOIN roles r ON r.ID = u.role_id WHERE ';
        let query_var = null;
        if (id) {
            query_var = id;
            query += 'ID = ? LIMIT 1';
        } else if (email) {
            query_var = email;
            query += 'email = ? LIMIT 1';
        }

        if ( !query_var ){
            throw new Error('No query variable set to retreive user');
        }

        return await DatabaseConnector.withConnection(async (db) => {
            try {
                const [users] = await db.query(
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
            }
        })
    }

    async #create() {
        await DatabaseConnector.withConnection(async (db) => {
            try {
                const roleID = await this.getRoleId(this.role);

                const [result] = await db.execute(
                    `INSERT INTO users (username, email, password, role_id) VALUES(?, ?, ?, ?)`,
                    [this.username, this.email, this.hashedPassword, roleID]
                )
    
                if ( !result?.insertId ){
                    throw new Error('Insert not successful');
                }
    
                this.userId = result.insertId;
            } catch (err) {
                throw new Error('Could not create user: ' + err.message);
            }
        })
    }

    async getFailedLogins() {
        return await DatabaseConnector.withConnection(async (db) => {
            try {
                const [rows] = await db.query(
                    `SELECT failed_logins FROM users WHERE ID = ? LIMIT 1`
                    [this.userId]
                )
    
                if (rows.length === 0) return null;
    
                const failed_logins = rows[0];
    
                return failed_logins;
            } catch (err) {
                throw new Error('Could not access failed logins from database');
            }
        })
    }

    async setFailedLogins( newAmount ) {
        await DatabaseConnector.withConnection(async (db) => {
            try {
                await db.query(
                    `UPDATE users SET failed_logins = ? WHERE ID = ?`
                    [newAmount, this.userId]
                )
    
            } catch (err) {
                throw new Error('Could not update failed logins in database');
            }
        })
    }

    async setLastLogin() {
        await DatabaseConnector.withConnection(async (db) => {
            try {
                await db.query(
                    `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE ID = ?`,
                    [this.userId]
                );
            } catch {
                throw new Error('Could not update last_login in database');
            }
        })
    }

    async getLockout() {
        return await DatabaseConnector.withConnection(async (db) => {
            try {
                const [rows] = await db.query(
                    `SELECT lockout_until FROM users WHERE ID = ? LIMIT 1`,
                    [this.userId]
                )

                if (rows.length === 0) return null;

                const lockoutUntil = rows[0];

                return lockoutUntil;

            } catch (err) {
                throw new Error('Could not get lockout info');
            }
        })
    }

    async setLockout(failedLogins) {

        const amountAboveThreshold = failedLogins - 4;
        const lockoutTimeAddition = amountAboveThreshold * lockoutBaseTime;

        await DatabaseConnector.withConnection(async (db) => {
            try {
                await db.query(
                    `UPDATE users SET lockout_until = DATEADD(CURRENT_TIMESTAMP, INTERVAL ? SECOND) WHERE ID = ?`,
                    [lockoutTimeAddition, this.userId]
                );
            } catch (err) {
                throw new Error('Could not update lockout information');
            }
        });
    }

    async getRoleId(role) {
        return await DatabaseConnector.withConnection(async (db) => {
            try {
                const [row] = await db.query(
                    `SELECT ID from roles WHERE name = ? LIMIT 1`,
                    [role]
                )

                if (row.length === 0) return null;

                const roleID = row[0];

                return roleID;

            } catch (err) {
                throw new Error('Issue retrieving role from database');
            }
        })
    }

    async login( password ) {
        try {
            const isCorrect = await AuthService.comparePassword( password, this.hashedPassword );

            if ( !isCorrect ) {
                const failedLogins = await this.getFailedLogins();
                if ( failedLogins >= maxFailedLoginAttempts ) {
                    await this.setLockout(failedLogins);
                }
                await this.setFailedLogins(++failedLogins);
                throw new Error("Password Verification Failed");
            }

            await this.setLastLogin();
    
            const refreshToken = AuthService.createJwtToken('refresh', {userId: this.userId})
            const accessToken = AuthService.createJwtToken('access', {userId: this.userId, role: this.role});
    
            return {refreshToken, accessToken};

        } catch (err) {
            throw err;
        }
    }

}

module.exports = User;