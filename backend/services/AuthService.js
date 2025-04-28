const {hash, verify} = require('argon2');

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
}

module.exports = AuthService;