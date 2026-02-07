const pool = require('../config/database');
const didService = require('./didService');
const logger = require('../config/logger');
const { didOperationsTotal } = require('../observability/metrics');

/**
 * Create DID and DID Document
 * POST /api/did/create
 */
exports.createDID = async (req, res, next) => {
    try {
        const { publicKey } = req.user;

        // Check if DID already exists for this user
        const [existing] = await pool.query(
            'SELECT did, encrypted_did_document, iv, tag FROM dids WHERE user_public_key = ?',
            [publicKey]
        );

        if (existing.length > 0) {
            // User already has a DID, decrypt and return it
            const row = existing[0];
            const didDocument = didService.decryptData(
                row.encrypted_did_document,
                row.iv,
                row.tag
            );

            return res.status(200).json({
                did: row.did,
                didDocument,
                message: 'DID already exists',
            });
        }

        // Generate new DID
        const did = didService.generateDID(publicKey);
        const didDocument = didService.createDIDDocument(did, publicKey);

        // Encrypt DID Document
        const { encrypted, iv, tag } = didService.encryptData(didDocument);

        // Store in database
        await pool.query(
            'INSERT INTO dids (user_public_key, did, encrypted_did_document, iv, tag) VALUES (?, ?, ?, ?, ?)',
            [publicKey, did, encrypted, iv, tag]
        );

        didOperationsTotal.inc({ operation: 'create' });
        logger.info({ did }, 'DID created');

        res.status(201).json({
            did,
            didDocument,
        });
    } catch (err) {
        logger.error({ err }, 'Error creating DID');
        next(err);
    }
};

/**
 * Resolve DID Document
 * GET /api/did/resolve/:did
 */
exports.resolveDID = async (req, res, next) => {
    try {
        const { did } = req.params;
        const { publicKey } = req.user;

        // Retrieve DID Document
        const [rows] = await pool.query(
            'SELECT encrypted_did_document, iv, tag, user_public_key FROM dids WHERE did = ?',
            [did]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: { message: 'DID not found' } });
        }

        const row = rows[0];

        // Verify ownership
        if (row.user_public_key !== publicKey) {
            return res.status(403).json({ error: { message: 'Access denied' } });
        }

        // Decrypt DID Document
        const didDocument = didService.decryptData(
            row.encrypted_did_document,
            row.iv,
            row.tag
        );

        didOperationsTotal.inc({ operation: 'resolve' });

        res.status(200).json({ didDocument });
    } catch (err) {
        logger.error({ err }, 'Error resolving DID');
        next(err);
    }
};
