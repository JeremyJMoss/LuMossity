const AuthService = require("../services/AuthService");
const DatabaseConnector = require("../services/DatabaseConnector");
const { maxFailedLoginAttempts, lockoutBaseTime } = require("../util/constants");

class User {
    constructor( firstName, lastName, email, hashedPassword, role, userId = null ) {
        this.user_id = userId;
        this.first_name = firstName;
        this.last_name = lastName;
        this.email = email;
        this.hashed_password = hashedPassword;
        this.role = role;
    }

    /**
     * Creates a new user
     * @param {string} firstName
     * @param {string} lastName
     * @param {string} email 
     * @param {string} password 
     * @param {number} role 
     * @returns User|Error
     */
    static async create( firstName, lastName, email, password, role = 'user' ) {
        try {
            const existingUserData = await User.#getExistingUserData( {email} );
            
            if ( existingUserData ) {
                throw new Error('User with that email already exists');
            }
    
            const hashedPassword = await AuthService.hashPassword(password);
            const user = new User( firstName, lastName, email, hashedPassword, role );
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

            const user = new User( 
                existingUserData.first_name, 
                existingUserData.last_name, 
                existingUserData.email, 
                existingUserData.hashed_password, 
                existingUserData.role, 
                existingUserData.userId 
            );

            return user;


        } catch (err) {
            throw err;
        }
    }

    static async #getExistingUserData( { email = '', id = null } ){
        // Get retrieval method
        let query = 'SELECT u.email, u.password, u.first_name, u.last_name, r.name as role, u.ID FROM users u JOIN roles r ON r.ID = u.role_id WHERE ';
        let query_var = null;
        if (id) {
            query_var = id;
            query += 'u.ID = ? LIMIT 1';
        } else if (email) {
            query_var = email;
            query += 'u.email = ? LIMIT 1';
        }

        if ( !query_var ){
            throw new Error('No query variable set to retrieve user');
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
                    hashed_password: user.password,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    userId: user.ID
                }
            } catch (err) {
                throw new Error('Could not retrieve user from database: ' + err);
            }
        })

        
    }

    async #create() {
        await DatabaseConnector.withConnection(async (db) => {
            try {
                const roleID = await this.getRoleId(this.role);

                const [result] = await db.execute(
                    `INSERT INTO users (first_name, last_name, email, password, role_id) VALUES(?, ?, ?, ?, ?)`,
                    [this.first_name, this.last_name, this.email, this.hashed_password, roleID]
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

    async #update(fields = {}) {
        const allowedFields = {
            first_name: 'first_name',
            last_name: 'last_name',
            username: 'username',
            email: 'email',
            failed_logins: 'failed_logins',
            lockout_until: 'lockout_until',
            last_login: 'last_login',
            is_active: 'is_active',
            role_id: 'role_id',
            password_reset_token: 'password_reset_token',
            password_reset_expires: 'password_reset_expires'
        };
    
        const keys = Object.keys(fields).filter(key => key in allowedFields);
        if (keys.length === 0) return null;
    
        const updates = keys.map(key => `${allowedFields[key]} = ?`).join(', ');
        const values = keys.map(key => fields[key]);
    
        await DatabaseConnector.withConnection(async (db) => {
            try {
                await db.query(
                    `UPDATE users SET ${updates} WHERE ID = ?`,
                    [...values, this.userId]
                );
            } catch (err) {
                throw new Error('Could not update user fields: ' + err.message);
            }
        });
    
        // Update in-memory values too
        for (const key of keys) {
            this[key] = fields[key];
        }
    }    
    
    async getRoleId(role) {
        return await DatabaseConnector.withConnection(async (db) => {
            try {
                const [row] = await db.query(
                    `SELECT ID from roles WHERE name = ? LIMIT 1`,
                    [role]
                )

                if (row.length === 0) return null;

                const roleID = row[0].ID;

                return roleID;

            } catch (err) {
                throw new Error('Issue retrieving role from database');
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
    
                const failed_logins = rows[0].failed_logins;
    
                return failed_logins;

            } catch (err) {
                throw new Error('Could not access failed logins from database');
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

                const lockoutUntil = rows[0].lockout_until;

                return lockoutUntil;

            } catch (err) {
                throw new Error('Could not get lockout info');
            }
        })
    }

    async setFailedLogins( newAmount ) {
        await this.#update({failed_logins: newAmount});
    }

    async setLastLogin() {
        await this.#update({last_login: new Date()});
    }

    async setLockout(failedLogins) {
        const amountAboveThreshold = failedLogins - 4;
        const lockoutTimeAddition = amountAboveThreshold * lockoutBaseTime;
    
        const lockoutUntil = new Date(Date.now() + lockoutTimeAddition * 1000);
    
        await this.#update({ lockout_until: lockoutUntil });
    }

    async login( password ) {
        try {
            const isCorrect = await AuthService.comparePassword( password, this.hashed_password );

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

    toJSON() {
        return {
            id: this.userId,
            email: this.email,
            role: this.role,
            first_name: this.first_name,
            last_name: this.last_name
        }
    }

}

module.exports = User;