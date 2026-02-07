import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import localforage from 'localforage';

const STORAGE_KEY = 'wallet_keypair';

/**
 * Generate new Ed25519 key pair
 * @returns {object} { publicKey, secretKey } in Uint8Array
 */
export const generateKeyPair = () => {
    return nacl.sign.keyPair();
};

/**
 * Save key pair to IndexedDB (with passphrase encryption)
 * Note: For simplicity, storing directly. Production would encrypt with passphrase.
 * @param {object} keyPair - nacl key pair
 */
export const saveKeyPair = async (keyPair) => {
    const serialized = {
        publicKey: naclUtil.encodeBase64(keyPair.publicKey),
        secretKey: naclUtil.encodeBase64(keyPair.secretKey),
    };

    await localforage.setItem(STORAGE_KEY, serialized);
};

/**
 * Load key pair from IndexedDB
 * @returns {object|null} - key pair or null if not found
 */
export const loadKeyPair = async () => {
    const serialized = await localforage.getItem(STORAGE_KEY);

    if (!serialized) {
        return null;
    }

    return {
        publicKey: naclUtil.decodeBase64(serialized.publicKey),
        secretKey: naclUtil.decodeBase64(serialized.secretKey),
    };
};

/**
 * Sign a message/challenge
 * @param {string} message - Message to sign (UTF-8)
 * @param {Uint8Array} secretKey - Private key
 * @returns {string} - Base64-encoded signature
 */
export const signMessage = (message, secretKey) => {
    const messageBytes = naclUtil.decodeUTF8(message);
    const signature = nacl.sign.detached(messageBytes, secretKey);
    return naclUtil.encodeBase64(signature);
};

/**
 * Clear stored key pair
 */
export const clearKeyPair = async () => {
    await localforage.removeItem(STORAGE_KEY);
};

/**
 * Get public key as base64 string
 * @param {Uint8Array} publicKey
 * @returns {string}
 */
export const publicKeyToBase64 = (publicKey) => {
    return naclUtil.encodeBase64(publicKey);
};
