const express = require('express');
const router = express.Router();
const credentialController = require('./credentialController');
const { requireAuth } = require('../auth/authMiddleware');
const { body } = require('express-validator');

// All credential routes require authentication
router.use(requireAuth);

// POST /api/credentials - Create credential
router.post('/',
    body('type').isString().trim().notEmpty(),
    body('claims').isObject(),
    credentialController.createCredential
);

// GET /api/credentials - List all credentials
router.get('/', credentialController.listCredentials);

// GET /api/credentials/:id - Get specific credential
router.get('/:id', credentialController.getCredential);

// PATCH /api/credentials/:id - Update credential status
router.patch('/:id',
    body('status').isIn(['active', 'revoked', 'suspended']),
    credentialController.updateCredentialStatus
);

// DELETE /api/credentials/:id - Delete credential
router.delete('/:id', credentialController.deleteCredential);

module.exports = router;
