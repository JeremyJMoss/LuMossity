const { AuthenticationError, AuthorizationError } = require('../models/utility/Errors');
const {verifyJwtToken} = require('../services/AuthService');
const logger = require('../models/utility/Logger');

/**
 * Passes through this function to make sure that the user is authenticated before moving on to functionality
 * @param {string} requiredRole - role required to be authenticated for this route.
 * @returns {async (req, res, next)) => {}}
 */
const authenticate = (requiredRole = null) => {
    return async (req, res, next) => {
        try {
            const access_token = req.cookies?.accessToken;
            if (!access_token) {
                logger.debug(`Request sent from ${req.ip } has missing or invalid access token.`);
                throw new AuthenticationError('Missing or invalid access token');
            }

            const decoded = verifyJwtToken('access', access_token);

            if (!decoded || !decoded.userId) {
                logger.debug(`Request sent from ${req.ip} with invalid or expired token.`);
                throw new AuthorizationError('Invalid or expired token');
            }

            req.authorizedUser = {
                id: decoded.userId,
                role: decoded.role
            };

            if (requiredRole && decoded.role !== requiredRole) {
                logger.warn(`Request sent from ${req.ip} with user id ${decoded.userId} has insufficient permissions to undertake this task.`);
                throw new AuthorizationError('Forbidden: insufficient permissions');
            }

            next();
        } catch (err) {
            return res.status(err.statusCode).json({ message: err.message });
        }
    };
};

module.exports = authenticate;
