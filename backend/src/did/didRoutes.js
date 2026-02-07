const express = require('express');
const router = express.Router();
const didController = require('./didController');
const { requireAuth } = require('../auth/authMiddleware');

// All DID routes require authentication
router.use(requireAuth);

// POST /api/did/create - Create DID and DID Document
router.post('/create', didController.createDID);

// GET /api/did/resolve/:did - Resolve DID Document
router.get('/resolve/:did', didController.resolveDID);

module.exports = router;
