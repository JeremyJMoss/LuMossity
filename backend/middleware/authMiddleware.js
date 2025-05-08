const {verifyJwtToken} = require('../services/AuthService');

const authenticate = (requiredRole = null) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Missing or invalid Authorization header' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = verifyJwtToken(token);

            if (!decoded || !decoded.userId) {
                return res.status(403).json({ message: 'Invalid or expired token' });
            }

            req.authorizedUser = {
                id: decoded.userId,
                role: decoded.role
            };

            if (requiredRole && decoded.role !== requiredRole) {
                return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
            }

            next();
        } catch (err) {
            console.error('Authentication error:', err);
            return res.status(401).json({ message: 'Authentication failed' });
        }
    };
};

module.exports = authenticate;
