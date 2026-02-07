const jwt = require('jsonwebtoken');
const securityConfig = require('../config/security');
const logger = require('../config/logger');

/**
 * Middleware to require JWT authentication
 */
exports.requireAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: { message: 'No token provided' } });
        }

        const token = authHeader.substring(7); // Remove 'Bearer '

        try {
            const decoded = jwt.verify(token, securityConfig.jwt.secret, {
                algorithms: [securityConfig.jwt.algorithm],
            });

            req.user = {
                publicKey: decoded.publicKey,
            };

            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: { message: 'Token expired' } });
            }
            if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: { message: 'Invalid token' } });
            }
            throw err;
        }
    } catch (err) {
        logger.error({ err }, 'Auth middleware error');
        res.status(500).json({ error: { message: 'Authentication error' } });
    }
};
