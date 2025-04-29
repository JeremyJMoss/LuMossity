const {hash, verify} = require('argon2');
const jwt = require("jsonwebtoken");
const config = require('config');

class AuthService {
    static async hashPassword( rawPassword ) {
        try {
            const hashedPassword = await hash( rawPassword );
            return hashedPassword;
        } catch (err) {
            throw new Error('Could not hash password. Issue with hashing function.');
        }
    }

    static async comparePassword(plainPassword, hashedPassword) {
        try {
            return await verify(hashedPassword, plainPassword);
        } catch (err) {
            throw new Error('Password verification failed: ' + err.message);
        }
    }

    static createJwtToken (type, info) {
        if (type !== 'refresh' && type !== 'access') {
            throw new Error('Type must be either "refresh" or "access"');
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
}

module.exports = AuthService;