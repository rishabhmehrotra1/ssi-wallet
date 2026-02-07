const crypto = require('crypto');
const naclUtil = require('tweetnacl-util');
const securityConfig = require('../config/security');

/**
 * Generate did:key from Ed25519 public key
 * @param {string} publicKeyBase64 - Base64-encoded public key
 * @returns {string} - DID in format did:key:z...
 */
exports.generateDID = (publicKeyBase64) => {
    const publicKeyBytes = Buffer.from(publicKeyBase64, 'base64');

    // Multicodec prefix for Ed25519 public key (0xed01)
    const multicodecPrefix = Buffer.from([0xed, 0x01]);
    const multicodecKey = Buffer.concat([multicodecPrefix, publicKeyBytes]);

    // Convert to base58btc (multibase z prefix)
    const base58Key = base58Encode(multicodecKey);

    return `did:key:z${base58Key}`;
};

/**
 * Create DID Document
 * @param {string} did - DID identifier
 * @param {string} publicKeyBase64 - Base64-encoded public key
 * @returns {object} - DID Document
 */
exports.createDIDDocument = (did, publicKeyBase64) => {
    const publicKeyBytes = Buffer.from(publicKeyBase64, 'base64');
    const multicodecPrefix = Buffer.from([0xed, 0x01]);
    const multicodecKey = Buffer.concat([multicodecPrefix, publicKeyBytes]);
    const publicKeyMultibase = `z${base58Encode(multicodecKey)}`;

    return {
        '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://w3id.org/security/suites/ed25519-2020/v1'
        ],
        id: did,
        verificationMethod: [{
            id: `${did}#${publicKeyMultibase}`,
            type: 'Ed25519VerificationKey2020',
            controller: did,
            publicKeyMultibase,
        }],
        authentication: [`${did}#${publicKeyMultibase}`],
        assertionMethod: [`${did}#${publicKeyMultibase}`],
    };
};

/**
 * Encrypt data using AES-256-GCM
 * @param {object} data - Data to encrypt
 * @returns {object} - { encrypted: Buffer, iv: Buffer, tag: Buffer }
 */
exports.encryptData = (data) => {
    const jsonData = JSON.stringify(data);
    const key = Buffer.from(securityConfig.encryption.key, 'hex');
    const iv = crypto.randomBytes(securityConfig.encryption.ivLength);

    const cipher = crypto.createCipheriv(securityConfig.encryption.algorithm, key, iv);

    let encrypted = cipher.update(jsonData, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const tag = cipher.getAuthTag();

    return {
        encrypted,
        iv,
        tag,
    };
};

/**
 * Decrypt data using AES-256-GCM
 * @param {Buffer} encrypted - Encrypted data
 * @param {Buffer} iv - Initialization vector
 * @param {Buffer} tag - Authentication tag
 * @returns {object} - Decrypted data
 */
exports.decryptData = (encrypted, iv, tag) => {
    const key = Buffer.from(securityConfig.encryption.key, 'hex');

    const decipher = crypto.createDecipheriv(securityConfig.encryption.algorithm, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return JSON.parse(decrypted.toString('utf8'));
};

/**
 * Simple Base58 encoding (Bitcoin alphabet)
 */
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(buffer) {
    let num = BigInt('0x' + buffer.toString('hex'));
    let encoded = '';

    while (num > 0) {
        const remainder = Number(num % 58n);
        encoded = BASE58_ALPHABET[remainder] + encoded;
        num = num / 58n;
    }

    // Add leading '1's for leading zero bytes
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
        encoded = '1' + encoded;
    }

    return encoded;
}
