// ==================================================
// =============== Module Dependencies ==============
// ==================================================

const AuthService = require("../services/AuthService");
const DatabaseConnector = require("../services/DatabaseConnector");
const { maxFailedLoginAttempts, lockoutBaseTime } = require("../util/constants");
const { mapMySQLError } = require("../util/helpers");
const { AuthenticationError, AppError, ConflictError } = require("./utility/Errors");
const logger = require ("./utility/Logger");


// ==================================================
// ================= User Class =====================
// ==================================================
class User {
    // ==================================================
    // =============== Class Initialization =============
    // ==================================================
    #user_id;
    #first_name;
    #last_name;
    #email;
    #hashed_password;
    #role;
    
    constructor( first_name, last_name, email, hashed_password, role, user_id = null ) {
        this.#user_id = user_id;
        this.#first_name = first_name;
        this.#last_name = last_name;
        this.#email = email;
        this.#hashed_password = hashed_password;
        this.#role = role;
    }
    
    // ==================================================
    // =========== Public Getters and Setters ===========
    // ==================================================
    /**
     * Gets the role id for the role name given.
     * @async
     * @method
     * @param {string} role - The name of the role.
     * @returns {Promise<int|null>} The ID of the role or null if role does not exist.
     * @throws {AppError} If mysql request fails
     */
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
                logger.error(err, {
                    class: "User",
                    method: "getRoleId"
                })
                const {message, status_code} = mapMySQLError(err);
                throw new AppError(message, status_code);
            }
        })
    }

    /**
     * The amount of failed_login attempts the user has had.
     * @async
     * @method
     * @returns {Promise<int>} The amount of failed login attempts the user has had.
     * @throws {AppError} If mysql request fails.
     */
    async getFailedLogins() {
        return await DatabaseConnector.withConnection(async (db) => {
            try {
                const [rows] = await db.query(
                    `SELECT failed_logins FROM users WHERE ID = ? LIMIT 1`,
                    [this.#user_id]
                )
    
                if (rows.length === 0) return null;
    
                const failed_logins = rows[0].failed_logins;
    
                return failed_logins;

            } catch (err) {
                logger.error(err, {
                    class: "User",
                    method: "getFailedLogins"
                })
                const {message, status_code} = mapMySQLError(err);
                throw new AppError(message, status_code);
            }
        })
    }

    /**
     * The timestamp of when the user is locked out until.
     * @async
     * @method
     * @returns {int} Timestamp of when the user is locked out until.
     * @throws {AppError} If mysql request fails.
     */
    async getLockout() {
        return await DatabaseConnector.withConnection(async (db) => {
            try {
                const [rows] = await db.query(
                    `SELECT lockout_until FROM users WHERE ID = ? LIMIT 1`,
                    [this.#user_id]
                )

                if (rows.length === 0) return null;

                const lockout_until = rows[0].lockout_until;

                return lockout_until;

            } catch (err) {
                logger.error(err, {
                    class: "User",
                    method: "getLockout"
                })
                const {message, status_code} = mapMySQLError(err);
                throw new AppError(message, status_code);
            }
        })
    }

    /**
     * Sets failed login to new value.
     * @async
     * @method
     * @param {int} new_amount - New value for failed logins.
     * @returns {Promise<null>} nothing
     * @throws {AppError} Throws AppError when mysql request fails.
     */
    async setFailedLogins( new_amount ) {
        try{
            await this.#update({failed_logins: new_amount});
        } catch (err) {
            throw err;
        }
    }

    /**
     * Sets last login date
     * @async
     * @method
     * @returns {Promise<null>}
     * @throws {AppError} When mysql request fails.
     */
    async setLastLogin() {
        try {
            await this.#update({last_login: new Date()});
        } catch (err) {
            throw err;
        }
    }

    /**
     * Sets new lockout value based on how many failed login attempts the user has had
     * @async
     * @method
     * @param {int} failed_logins - new value for amount of failed logins.
     * @returns {Promise<null>}
     * @throws {AppError} Throws AppError when mysql request fails.
     */
    async setLockout(failed_logins) {
        const amount_above_threshold = failed_logins - 4;
        const lockout_time_addition = amount_above_threshold * lockoutBaseTime;
    
        const lockout_until = new Date(Date.now() + lockout_time_addition * 1000);
        try{
            await this.#update({ lockout_until });
            logger.warn(`User ${this.#email} locked out until ${lockout_until}`);
        } catch(err) {
            throw err;
        }
    }

    // ==================================================
    // ============== Public Instance Methods ===========
    // ==================================================
    /**
     * Attempts to login user by comparing their password with the one in the database.
     * @async
     * @method
     * @param {string} password - Password to compare with database password.
     * @returns {Promise<{refresh_token: string, access_token: string}>} The tokens to be returned to the user.
     * @throws {AuthenticationError|AppError} Throws Authentication Error if password verification fails. Throws AppError if mysql request fails.
     */
    async login( password ) {
        try {
            const is_correct = await AuthService.comparePassword( password, this.#hashed_password );

            if ( !is_correct ) {
                logger.debug(`User login failed for user ${this.#email}`);
                const failed_logins = await this.getFailedLogins();
                if ( failed_logins >= maxFailedLoginAttempts ) {
                    await this.setLockout(failed_logins);
                }
                await this.setFailedLogins(failed_logins+1);
                throw new AuthenticationError("Email or password was invalid");
            }

            logger.debug(`User ${this.#email} logged in successfully`);

            await this.setLastLogin();
    
            const refresh_token = AuthService.createJwtToken('refresh', {userId: this.#user_id})
            const access_token = AuthService.createJwtToken('access', {userId: this.#user_id, role: this.#role});

            logger.debug(`Generated tokens for user ${this.#email}`);
    
            return {refresh_token, access_token};

        } catch (err) {
            throw err;
        }
    }

    /**
     * Formats User object to a JSON object.
     * @method
     * @returns {Object} JSON formatted User object.
     */
    toJSON() {
        return {
            id: this.#user_id,
            email: this.#email,
            role: this.#role,
            first_name: this.#first_name,
            last_name: this.#last_name
        }
    }

    // ==================================================
    // ============ Private Instance Methods ============
    // ==================================================
    /**
     * Creates user in database.
     * @async
     * @method
     * @returns {Promise<null>}
     * @throws {AppError} Throws AppError when mysql request fails.
     */
    async #create() {
        await DatabaseConnector.withConnection(async (db) => {
            try {
                const role_id = await this.getRoleId(this.#role);

                logger.info(`Creating User: ${this.#email}`);

                const [result] = await db.execute(
                    `INSERT INTO users (first_name, last_name, email, password, role_id) VALUES(?, ?, ?, ?, ?)`,
                    [this.#first_name, this.#last_name, this.#email, this.#hashed_password, role_id]
                )
    
                if ( !result?.insertId ){
                    throw new AppError('Insert not successful', 500);
                }

                logger.info(`Created user: ${this.#email}`)
    
                this.#user_id = result.insertId;
            } catch (err) {
                if (err instanceof AppError){
                    throw err
                }

                logger.error(err, {
                    class: "User",
                    method: "#create"
                })

                const {message, status_code} = mapMySQLError(err);
                
                throw new AppError(message, status_code);
            }
        })
    }   

    /**
     * Updates fields that have changed for user.
     * @async
     * @method
     * @param {Object} fields - Fields that have changed.
     * @returns {Promise<null>}
     * @throws {AppError} Throws AppError when mysql request fails.
     */
    async #update( fields = {} ) {
        logger.info(`Attempting update for User: ${this.#email}`);
    
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
    
        const keys = Object.keys(fields).filter(key => 
            key in allowed_fields && fields[key] !== this[key]
        );
    
        if (keys.length === 0) {
            logger.debug(`No updates needed for user ${this.#email} (values unchanged)`);
            return;
        }
    
        await DatabaseConnector.withConnection(async (db) => {
            try {
                const updates = keys.map(key => `${allowed_fields[key]} = ?`).join(', ');
                const values = keys.map(key => fields[key]);
    
                await db.query(
                    `UPDATE users SET ${updates} WHERE ID = ?`,
                    [...values, this.#user_id]
                );
    
                logger.info(`Updated user ${this.#email} fields: ${keys.join(', ')}`);
            } catch (err) {
                logger.error(err, {
                    class: "User",
                    method: "#update"
                });
                const {message, status_code} = mapMySQLError(err);
                throw new AppError(message, status_code);
            }
        });
    
        // Update in-memory values too
        for (const key of keys) {
            this[key] = fields[key];
        }
    }

    // ==================================================
    // ============== Public Static Methods =============
    // ==================================================
    /**
     * Creates a new user.
     * @async
     * @method
     * @static
     * @param {string} first_name - First name of the new user
     * @param {string} last_name - Last name of the new user
     * @param {string} email - Email of the new user
     * @param {string} password - Password of the new user
     * @param {number} role - Role of the new user
     * @returns {Promise<User>} User that has been created.
     * @throws {ConflictError|AppError} Throws ConflictError if user with email already exists. Throws AppError if mysql request fails.
     */
    static async create( first_name, last_name, email, password, role = 'user' ) {
        try {
            const existing_user_data = await User.#getExistingUserData( {email} );
            
            if ( existing_user_data ) {
                logger.debug(`User with email ${email} already exists`);
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
     * Retrieves users from the database either all or paged.
     * @async
     * @method
     * @static
     * @param {int} page - Page number to retrieve.
     * @param {int} limit - How many per page.
     * @returns {Promise<[User]>} Array of Users from database.
     * @throws {AppError} Throws AppError if mysql request fails.
     */
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

        logger.debug(`Fetching users: page=${page}, limit=${limit}`);

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

                logger.error(err, {
                    class: "User",
                    method: "getAllUsers"
                });

                const {message, status_code} = mapMySQLError(err);
                
                throw new AppError(message, status_code);
            }
        });
    }

    /**
     * Searches for user by either email or user_id and then returns that user.
     * @async
     * @method
     * @static
     * @param {string} method - To get the user by either email or id.
     * @param {string} value - Value of that email or id.
     * @returns {Promise<User|null>} User that matches query.
     * @throws {AppError} Throws AppError if mysql request fails.
     */
    static async getUserBy( method, value ) {
        try {
            const existing_user_data = await User.#getExistingUserData( { [method]: value } );

            if ( !existing_user_data ) {
                logger.debug(`User with ${method}: ${value} does not exist`);
                return null;
            }

            logger.debug(`User retrieved by ${method}: ${value}`);

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

    /**
     * Gets the data for a user based on identifier passed in.
     * @async
     * @method
     * @static
     * @param {Object} identifier - Identifier to get the existing user by.
     * @param {string} [identifier.email] - Optional email.
     * @param {int} [identifier.id] - Optional id.
     * @returns {Promise<User>} User that matches identifier and value that are passed in.
     * @throws {AppError} throws AppError if no parameters are passed in or if mysql fails in some way.
     */
    static async #getExistingUserData( { email = '', id = null } ) {

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

                logger.error(err, {
                    class: "User",
                    method: "#getExistingUserData"
                });

                const {message, status_code} = mapMySQLError(err);
                
                throw new AppError(message, status_code);
            }
        })
    }
}

module.exports = User;