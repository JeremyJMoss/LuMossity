const {hash, verify} = require('argon2');
const jwt = require("jsonwebtoken");
const config = require('config');
const {AppError, AuthenticationError} = require('../models/utility/Errors');

class AuthService {
    static async hashPassword( rawPassword ) {
        try {
            const hashedPassword = await hash( rawPassword );
            return hashedPassword;
        } catch (err) {
            throw new AppError('Could not hash password. Issue with hashing function.', 500);
        }
    }

    static async comparePassword(plainPassword, hashedPassword) {
        try {
            return await verify(hashedPassword, plainPassword);
        } catch (err) {
            throw new AuthenticationError('Password verification failed: ' + err.message);
        }
    }

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