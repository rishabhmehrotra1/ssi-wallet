const { v4: uuidv4 } = require('uuid');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');

/**
 * Generate Verifiable Credential
 * @param {string} type - Credential type
 * @param {object} claims - Credential claims
 * @param {string} issuerDID - Issuer DID
 * @param {string} subjectDID - Subject DID
 * @returns {object} - Verifiable Credential
 */
exports.generateCredential = (type, claims, issuerDID, subjectDID) => {
    const now = new Date();

    const credential = {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
        ],
        id: `urn:uuid:${uuidv4()}`,
        type: ['VerifiableCredential', type],
        issuer: issuerDID,
        issuanceDate: now.toISOString(),
        credentialSubject: {
            id: subjectDID,
            ...claims,
        },
    };

    return credential;
};

/**
 * Sign credential (simplified - in production, use proper VC signing)
 * @param {object} credential - Credential to sign
 * @param {string} privateKeyBase64 - Private key for signing
 * @returns {object} - Credential with proof
 */
exports.signCredential = (credential, privateKeyBase64) => {
    // Create canonical JSON for signing
    const canonicalJson = JSON.stringify(credential);
    const messageBytes = naclUtil.decodeUTF8(canonicalJson);
    const privateKeyBytes = naclUtil.decodeBase64(privateKeyBase64);

    // Sign
    const signature = nacl.sign.detached(messageBytes, privateKeyBytes);
    const signatureBase64 = naclUtil.encodeBase64(signature);

    // Add proof
    const signedCredential = {
        ...credential,
        proof: {
            type: 'Ed25519Signature2020',
            created: new Date().toISOString(),
            verificationMethod: `${credential.issuer}#key-1`,
            proofPurpose: 'assertionMethod',
            proofValue: signatureBase64,
        },
    };

    return signedCredential;
};

/**
 * Verify credential signature
 * @param {object} credential - Credential to verify
 * @param {string} publicKeyBase64 - Public key for verification
 * @returns {boolean} - True if valid
 */
exports.verifyCredential = (credential, publicKeyBase64) => {
    try {
        const { proof, ...credentialWithoutProof } = credential;
        const canonicalJson = JSON.stringify(credentialWithoutProof);
        const messageBytes = naclUtil.decodeUTF8(canonicalJson);
        const signatureBytes = naclUtil.decodeBase64(proof.proofValue);
        const publicKeyBytes = naclUtil.decodeBase64(publicKeyBase64);

        return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch (err) {
        return false;
    }
};
