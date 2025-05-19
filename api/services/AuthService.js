const {hash, verify} = require('argon2');
const jwt = require('jsonwebtoken');
const config = require('config');
const {AppError, AuthenticationError} = require('../models/utility/Errors');

class AuthService {

    /**
     * Hashes the password
     * @async
     * @method
     * @static
     * @param {string} raw_password - the password to hash.
     * @returns {Promise<string>} The hashed password.
     * @throws {AppError} The password failed to be hashed.
     */
    static async hashPassword( raw_password ) {
        try {
            const hashed_password = await hash( raw_password );
            return hashed_password;
        } catch (err) {
            throw new AppError('Could not hash password. Issue with hashing function.', 500);
        }
    }

    /**
     * Compares the plain password to the hashed password.
     * @async
     * @method
     * @static
     * @param {string} plain_password - The plain password to compare.
     * @param {string} hashed_password - The hashed password to compare.
     * @returns {Promise<boolean>} whether the two passwords match.
     * @throws {AuthenticationError} If password verification fails to work.
     */
    static async comparePassword(plain_password, hashed_password) {
        try {
            return await verify(hashed_password, plain_password);
        } catch (err) {
            throw new AuthenticationError('Password verification failed: ' + err.message);
        }
    }

    /**
     * Creates and returns a new JWT token.
     * @static
     * @method
     * @param {string} type - The type of token to create ("refresh" or "access"). 
     * @param {Object} info - Information for the JWT token to contain. Such as user_id, role, etc. 
     * @returns {string} JWT token string.
     * @throws {AppError} Type is not refresh or access.
     */
    static createJwtToken (type, info) {
        if (type !== 'refresh' && type !== 'access') {
            throw new AppError('Type must be either "refresh" or "access"', 500);
        }

        let expiresIn = '1d';
        if (type === "refresh") {
            expiresIn = '7d';
        }

        const token = jwt.sign(
            info,
            config.get('jwtSecret'),
            { expiresIn }
        );

        return token;
    }

    /**
     * Verifies that the token passed in is a valid token.
     * @static
     * @method
     * @param {string} token - JWT token to verify.
     * @returns {Object|null} Information stored in valid JWT token.
     */
    static verifyJwtToken (token) {
        const secret = config.get('jwtSecret');

        try {
            const payload = jwt.verify(token, secret);
            return payload;
        } catch (err) {
            // Token is invalid or expired
            return null;
        }
    }
}

module.exports = AuthService;