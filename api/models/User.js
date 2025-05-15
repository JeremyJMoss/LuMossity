const AuthService = require("../services/AuthService");
const DatabaseConnector = require("../services/DatabaseConnector");
const { maxFailedLoginAttempts, lockoutBaseTime } = require("../util/constants");
const { mapMySQLError } = require("../util/helpers");
const { AuthenticationError, AppError } = require("./utility/Errors");

class User {
    constructor( first_name, last_name, email, hashed_password, role, user_id = null ) {
        this.user_id = user_id;
        this.first_name = first_name;
        this.last_name = last_name;
        this.email = email;
        this.hashed_password = hashed_password;
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
    static async create( first_name, last_name, email, password, role = 'user' ) {
        try {
            const existing_user_data = await User.#getExistingUserData( {email} );
            
            if ( existing_user_data ) {
                throw new ConflictError('User with that email already exists');
            }
    
            const hashed_password = await AuthService.hashPassword(password);
            const user = new User( first_name, last_name, email, hashed_password, role );
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
            const existing_user_data = await User.#getExistingUserData( { [method]: value } );

            if ( !existing_user_data ) {
                return null;
            }

            const user = new User( 
                existing_user_data.first_name, 
                existing_user_data.last_name, 
                existing_user_data.email, 
                existing_user_data.hashed_password, 
                existing_user_data.role, 
                existing_user_data.user_id 
            );

            return user;


        } catch (err) {
            throw err;
        }
    }

    static async getAllUsers( page = null, limit = null ) {
        let limit_sql = '';
        if (limit !== null) {
            limit_sql = ` LIMIT ${limit}`;
        }

        let page_sql = '';
        if (page !== null && limit !== null) {
            if (page < 1) {
                page = 1;
            }
            const offset = (page - 1) * limit;
            page_sql = ` OFFSET ${offset}`;
        }

        return await DatabaseConnector.withConnection( async db => {
            try {
                const [users] = await db.query(
                    `SELECT * FROM users${limit_sql}${page_sql};`
                );

                if (users.length === 0) return [];

                const user_objs = users.map((user) => new User (
                        user.first_name,
                        user.last_name,
                        user.email,
                        user.password,
                        user.role,
                        user.ID
                ));

                return user_objs;

            } catch (err) {
                if (err instanceof AppError){
                    throw err
                }

                const {message, status_code} = mapMySQLError(err);
                
                throw new AppError(message, status_code);
            }
        });
    }

    static async #getExistingUserData( { email = '', id = null } ){

        return await DatabaseConnector.withConnection(async (db) => {
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

            try {
                if ( !query_var ){
                    throw new AppError('No query variable set to retrieve user', 500);
                }
            
                const [users] = await db.query(
                    query, 
                    [query_var]
                );

                if (users.length === 0) return null;

                const user = users[0];

                return new User (
                    user.first_name,
                    user.last_name,
                    user.email,
                    user.password,
                    user.role,
                    user.ID
                )
            } catch (err) {
                if (err instanceof AppError){
                    throw err
                }

                const {message, status_code} = mapMySQLError(err);
                
                throw new AppError(message, status_code);
            }
        })

        
    }

    async #create() {
        await DatabaseConnector.withConnection(async (db) => {
            try {
                const role_id = await this.getRoleId(this.role);

                const [result] = await db.execute(
                    `INSERT INTO users (first_name, last_name, email, password, role_id) VALUES(?, ?, ?, ?, ?)`,
                    [this.first_name, this.last_name, this.email, this.hashed_password, role_id]
                )
    
                if ( !result?.insertId ){
                    throw new AppError('Insert not successful', 500);
                }
    
                this.user_id = result.insertId;
            } catch (err) {
                if (err instanceof AppError){
                    throw err
                }

                const {message, status_code} = mapMySQLError(err);
                
                throw new AppError(message, status_code);
            }
        })
    }

    async #update(fields = {}) {
        const allowed_fields = {
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
    
        const keys = Object.keys(fields).filter(key => key in allowed_fields);
    
        await DatabaseConnector.withConnection(async (db) => {
            try {
                const updates = keys.map(key => `${allowed_fields[key]} = ?`).join(', ');
                const values = keys.map(key => fields[key]);

                await db.query(
                    `UPDATE users SET ${updates} WHERE ID = ?`,
                    [...values, this.user_id]
                );
            } catch (err) {
                const {message, status_code} = mapMySQLError(err);
                throw new AppError(message, status_code);
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
                const {message, status_code} = mapMySQLError(err);
                throw new AppError(message, status_code);
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
                const {message, status_code} = mapMySQLError(err);
                throw new AppError(message, status_code);
            }
        })
    }

    async getLockout() {
        return await DatabaseConnector.withConnection(async (db) => {
            try {
                const [rows] = await db.query(
                    `SELECT lockout_until FROM users WHERE ID = ? LIMIT 1`,
                    [this.user_id]
                )

                if (rows.length === 0) return null;

                const lockout_until = rows[0].lockout_until;

                return lockout_until;

            } catch (err) {
                const {message, status_code} = mapMySQLError(err);
                throw new AppError(message, status_code);
            }
        })
    }

    async setFailedLogins( new_amount ) {
        try{
            await this.#update({failed_logins: new_amount});
        } catch (err) {
            throw err;
        }
    }

    async setLastLogin() {
        try {
            await this.#update({last_login: new Date()});
        } catch (err) {
            throw err;
        }
    }

    async setLockout(failed_logins) {
        const amount_above_threshold = failed_logins - 4;
        const lockout_time_addition = amount_above_threshold * lockoutBaseTime;
    
        const lockout_until = new Date(Date.now() + lockout_time_addition * 1000);
        try{
            await this.#update({ lockout_until });
        } catch(err) {
            throw err;
        }
    }

    async login( password ) {
        try {
            const is_correct = await AuthService.comparePassword( password, this.hashed_password );

            if ( !is_correct ) {
                const failed_logins = await this.getFailedLogins();
                if ( failed_logins >= maxFailedLoginAttempts ) {
                    await this.setLockout(failed_logins);
                }
                await this.setFailedLogins(++failed_logins);
                throw new AuthenticationError("Email or password was invalid");
            }

            await this.setLastLogin();
    
            const refresh_token = AuthService.createJwtToken('refresh', {userId: this.user_id})
            const access_token = AuthService.createJwtToken('access', {userId: this.user_id, role: this.role});
    
            return {refresh_token, access_token};

        } catch (err) {
            throw err;
        }
    }

    toJSON() {
        return {
            id: this.user_id,
            email: this.email,
            role: this.role,
            first_name: this.first_name,
            last_name: this.last_name
        }
    }

}

module.exports = User;