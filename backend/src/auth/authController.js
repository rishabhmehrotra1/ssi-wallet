const crypto = require('crypto');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const securityConfig = require('../config/security');
const { authAttemptsTotal } = require('../observability/metrics');

// In-memory challenge store (in production, use Redis)
const challengeStore = new Map();

// Clean up expired challenges every minute
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of challengeStore.entries()) {
        if (value.expiresAt < now) {
            challengeStore.delete(key);
        }
    }
}, 60000);

/**
 * Generate authentication challenge
 * POST /api/auth/challenge
 */
exports.requestChallenge = async (req, res, next) => {
    try {
        const { publicKey } = req.body;

        if (!publicKey) {
            return res.status(400).json({ error: { message: 'Public key is required' } });
        }

        // Validate public key format (base64)
        try {
            const decoded = Buffer.from(publicKey, 'base64');
            if (decoded.length !== 32) {
                throw new Error('Invalid key length');
            }
        } catch (err) {
            return res.status(400).json({ error: { message: 'Invalid public key format' } });
        }

        // Generate random challenge
        const challenge = crypto.randomBytes(securityConfig.challenge.length).toString('base64');
        const expiresAt = Date.now() + securityConfig.challenge.expiryMs;

        // Store challenge
        challengeStore.set(publicKey, { challenge, expiresAt });

        logger.info({ publicKey: publicKey.substring(0, 10) + '...' }, 'Challenge generated');

        res.status(200).json({
            challenge,
            expiresAt: new Date(expiresAt).toISOString(),
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Verify signature and issue JWT
 * POST /api/auth/verify
 */
exports.verifySignature = async (req, res, next) => {
    try {
        const { publicKey, signature, challenge } = req.body;

        if (!publicKey || !signature || !challenge) {
            authAttemptsTotal.inc({ result: 'failure' });
            return res.status(400).json({ error: { message: 'Missing required fields' } });
        }

        // Retrieve stored challenge
        const stored = challengeStore.get(publicKey);

        if (!stored) {
            authAttemptsTotal.inc({ result: 'failure' });
            return res.status(401).json({ error: { message: 'Challenge not found or expired' } });
        }

        // Check expiry
        if (stored.expiresAt < Date.now()) {
            challengeStore.delete(publicKey);
            authAttemptsTotal.inc({ result: 'failure' });
            return res.status(401).json({ error: { message: 'Challenge expired' } });
        }

        // Verify challenge matches
        if (stored.challenge !== challenge) {
            authAttemptsTotal.inc({ result: 'failure' });
            return res.status(401).json({ error: { message: 'Challenge mismatch' } });
        }

        // Verify signature
        try {
            const messageBytes = naclUtil.decodeUTF8(challenge);
            const signatureBytes = naclUtil.decodeBase64(signature);
            const publicKeyBytes = naclUtil.decodeBase64(publicKey);

            const isValid = nacl.sign.detached.verify(
                messageBytes,
                signatureBytes,
                publicKeyBytes
            );

            if (!isValid) {
                authAttemptsTotal.inc({ result: 'failure' });
                return res.status(401).json({ error: { message: 'Invalid signature' } });
            }
        } catch (err) {
            logger.error({ err }, 'Signature verification error');
            authAttemptsTotal.inc({ result: 'failure' });
            return res.status(401).json({ error: { message: 'Signature verification failed' } });
        }

        // Delete used challenge
        challengeStore.delete(publicKey);

        // Issue JWT
        const token = jwt.sign(
            { publicKey },
            securityConfig.jwt.secret,
            {
                expiresIn: securityConfig.jwt.expiresIn,
                algorithm: securityConfig.jwt.algorithm,
            }
        );

        authAttemptsTotal.inc({ result: 'success' });
        logger.info({ publicKey: publicKey.substring(0, 10) + '...' }, 'Authentication successful');

        res.status(200).json({
            token,
            expiresIn: 3600, // 1 hour in seconds
        });
    } catch (err) {
        next(err);
    }
};
