const { AuthenticationError, AuthorizationError } = require('../models/utility/Errors');
const {verifyJwtToken} = require('../services/AuthService');

const authenticate = (requiredRole = null) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new AuthenticationError('Missing or invalid Authorization header');
            }

            const token = authHeader.split(' ')[1];
            const decoded = verifyJwtToken(token);

            if (!decoded || !decoded.userId) {
                throw new AuthorizationError('Invalid or expired token');
            }

            req.authorizedUser = {
                id: decoded.userId,
                role: decoded.role
            };

            if (requiredRole && decoded.role !== requiredRole) {
                throw new AuthorizationError('Forbidden: insufficient permissions');
            }

            next();
        } catch (err) {
            return res.status(err.statusCode).json({ message: err.message });
        }
    };
};

module.exports = authenticate;
