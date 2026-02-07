import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateKeyPair, saveKeyPair, publicKeyToBase64, signMessage } from '../services/crypto';
import { authAPI } from '../services/api';

function Setup({ setKeyPair }) {
    const [step, setStep] = useState('intro');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleCreateWallet = async () => {
        try {
            setLoading(true);
            setError(null);

            // Generate key pair
            const newKeyPair = generateKeyPair();

            // Save to IndexedDB
            await saveKeyPair(newKeyPair);

            // Authenticate with backend
            const publicKey = publicKeyToBase64(newKeyPair.publicKey);

            // Request challenge
            const challengeRes = await authAPI.requestChallenge(publicKey);
            const { challenge } = challengeRes.data;

            // Sign challenge
            const signature = signMessage(challenge, newKeyPair.secretKey);

            // Verify and get JWT
            const authRes = await authAPI.verifySignature(publicKey, signature, challenge);
            const { token } = authRes.data;

            // Store JWT
            localStorage.setItem('jwt_token', token);

            // Update app state
            setKeyPair(newKeyPair);

            setStep('success');
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (err) {
            console.error('Setup error:', err);
            setError(err.response?.data?.error?.message || 'Failed to create wallet');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="setup-container">
            <div className="setup-card">
                <h1>🔐 SSI Personal Data Wallet</h1>

                {step === 'intro' && (
                    <>
                        <p className="setup-description">
                            Set up your Self-Sovereign Identity wallet with passwordless authentication.
                            A new cryptographic key pair will be generated and stored securely in your browser.
                        </p>

                        <div className="feature-list">
                            <div className="feature">
                                <span className="icon">🔑</span>
                                <span>Client-side key generation</span>
                            </div>
                            <div className="feature">
                                <span className="icon">🆔</span>
                                <span>Decentralized Identifier (DID)</span>
                            </div>
                            <div className="feature">
                                <span className="icon">📜</span>
                                <span>Verifiable Credentials</span>
                            </div>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button
                            className="primary-button"
                            onClick={handleCreateWallet}
                            disabled={loading}
                        >
                            {loading ? 'Creating Wallet...' : 'Create New Wallet'}
                        </button>

                        <p className="warning-text">
                            ⚠️ Warning: If you lose access to this browser/device, you will permanently lose access to your wallet.
                            This is a prototype - do not use for real identity data.
                        </p>
                    </>
                )}

                {step === 'success' && (
                    <div className="success-message">
                        <h2>✅ Wallet Created Successfully!</h2>
                        <p>Redirecting to dashboard...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Setup;
