const pool = require('../config/database');
const credentialService = require('./credentialService');
const didService = require('../did/didService');
const logger = require('../config/logger');
const { credentialOperationsTotal } = require('../observability/metrics');
const { v4: uuidv4 } = require('uuid');

// Temporary issuer key pair for prototype (in production, would be separate issuer service)
const ISSUER_PRIVATE_KEY = 'your-issuer-private-key-base64'; // TODO: Generate proper key
const ISSUER_DID = 'did:key:z6MkIssuerDID'; // TODO: Generate from public key

/**
 * Create/Add Verifiable Credential
 * POST /api/credentials
 */
exports.createCredential = async (req, res, next) => {
    try {
        const { type, claims } = req.body;
        const { publicKey } = req.user;

        if (!type || !claims) {
            return res.status(400).json({ error: { message: 'Type and claims are required' } });
        }

        // Get user's DID
        const [didRows] = await pool.query(
            'SELECT did FROM dids WHERE user_public_key = ?',
            [publicKey]
        );

        if (didRows.length === 0) {
            return res.status(400).json({ error: { message: 'User must create DID first' } });
        }

        const subjectDID = didRows[0].did;

        // Generate credential
        let credential = credentialService.generateCredential(
            type,
            claims,
            ISSUER_DID,
            subjectDID
        );

        // Sign credential (using issuer's key)
        credential.proof = {
            type: 'Ed25519Signature2020',
            created: new Date().toISOString(),
            verificationMethod: `${ISSUER_DID}#key-1`,
            proofPurpose: 'assertionMethod',
            proofValue: 'mock-signature-for-prototype',
        };

        // Encrypt credential
        const { encrypted, iv, tag } = didService.encryptData(credential);

        // Generate ID
        const id = uuidv4();
        const createdAt = new Date();

        // Store in database
        await pool.query(
            `INSERT INTO credentials (id, user_public_key, type, encrypted_data, iv, tag, status, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
            [id, publicKey, type, encrypted, iv, tag, createdAt, createdAt]
        );

        credentialOperationsTotal.inc({ operation: 'create', status: 'active' });
        logger.info({ credentialId: id, type }, 'Credential created');

        res.status(201).json({
            id,
            credential,
            createdAt,
        });
    } catch (err) {
        logger.error({ err }, 'Error creating credential');
        next(err);
    }
};

/**
 * List all credentials
 * GET /api/credentials
 */
exports.listCredentials = async (req, res, next) => {
    try {
        const { publicKey } = req.user;

        const [rows] = await pool.query(
            `SELECT id, type, status, created_at, updated_at 
             FROM credentials 
             WHERE user_public_key = ? AND status != 'deleted'
             ORDER BY created_at DESC`,
            [publicKey]
        );

        credentialOperationsTotal.inc({ operation: 'list', status: 'success' });

        res.status(200).json({
            credentials: rows.map(row => ({
                id: row.id,
                type: row.type,
                status: row.status,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            })),
        });
    } catch (err) {
        logger.error({ err }, 'Error listing credentials');
        next(err);
    }
};

/**
 * Get specific credential
 * GET /api/credentials/:id
 */
exports.getCredential = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { publicKey } = req.user;

        const [rows] = await pool.query(
            `SELECT encrypted_data, iv, tag, type, status, user_public_key 
             FROM credentials 
             WHERE id = ? AND status != 'deleted'`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: { message: 'Credential not found' } });
        }

        const row = rows[0];

        // Verify ownership
        if (row.user_public_key !== publicKey) {
            return res.status(403).json({ error: { message: 'Access denied' } });
        }

        // Decrypt credential
        const credential = didService.decryptData(row.encrypted_data, row.iv, row.tag);

        credentialOperationsTotal.inc({ operation: 'get', status: row.status });

        res.status(200).json({ credential });
    } catch (err) {
        logger.error({ err }, 'Error retrieving credential');
        next(err);
    }
};

/**
 * Update credential status
 * PATCH /api/credentials/:id
 */
exports.updateCredentialStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { publicKey } = req.user;

        const validStatuses = ['active', 'revoked', 'suspended'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: { message: 'Invalid status. Must be: active, revoked, or suspended' }
            });
        }

        // Verify ownership and update
        const [result] = await pool.query(
            `UPDATE credentials 
             SET status = ?, updated_at = NOW() 
             WHERE id = ? AND user_public_key = ? AND status != 'deleted'`,
            [status, id, publicKey]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: { message: 'Credential not found or access denied' } });
        }

        credentialOperationsTotal.inc({ operation: 'update', status });
        logger.info({ credentialId: id, newStatus: status }, 'Credential status updated');

        const [updatedRows] = await pool.query(
            'SELECT id, status, updated_at FROM credentials WHERE id = ?',
            [id]
        );

        res.status(200).json({
            id: updatedRows[0].id,
            status: updatedRows[0].status,
            updatedAt: updatedRows[0].updated_at,
        });
    } catch (err) {
        logger.error({ err }, 'Error updating credential status');
        next(err);
    }
};

/**
 * Delete credential (soft delete)
 * DELETE /api/credentials/:id
 */
exports.deleteCredential = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { publicKey } = req.user;

        const [result] = await pool.query(
            `UPDATE credentials 
             SET status = 'deleted', deleted_at = NOW(), updated_at = NOW() 
             WHERE id = ? AND user_public_key = ? AND status != 'deleted'`,
            [id, publicKey]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: { message: 'Credential not found or already deleted' } });
        }

        credentialOperationsTotal.inc({ operation: 'delete', status: 'deleted' });
        logger.info({ credentialId: id }, 'Credential deleted');

        res.status(204).send();
    } catch (err) {
        logger.error({ err }, 'Error deleting credential');
        next(err);
    }
};
