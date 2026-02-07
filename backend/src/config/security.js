module.exports = {
    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        expiresIn: '1h',
        algorithm: 'HS256',
    },

    // Encryption configuration (AES-256-GCM)
    encryption: {
        key: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 64 hex chars = 32 bytes
        algorithm: 'aes-256-gcm',
        ivLength: 12, // 96 bits for GCM
        tagLength: 16, // 128 bits
    },

    // Authentication challenge configuration
    challenge: {
        length: 32, // bytes
        expiryMs: 5 * 60 * 1000, // 5 minutes
    },
};
