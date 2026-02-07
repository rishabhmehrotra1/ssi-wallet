const express = require('express');
const router = express.Router();
const authController = require('./authController');
const { body } = require('express-validator');

// POST /api/auth/challenge - Request authentication challenge
router.post('/challenge',
    body('publicKey').isBase64().notEmpty(),
    authController.requestChallenge
);

// POST /api/auth/verify - Verify signature and get JWT
router.post('/verify',
    body('publicKey').isBase64().notEmpty(),
    body('signature').isBase64().notEmpty(),
    body('challenge').isBase64().notEmpty(),
    authController.verifySignature
);

module.exports = router;
