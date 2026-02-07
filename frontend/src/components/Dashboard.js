import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { didAPI, credentialsAPI } from '../services/api';
import { clearKeyPair } from '../services/crypto';

function Dashboard({ keyPair, setKeyPair }) {
    const [did, setDid] = useState(null);
    const [credentials, setCredentials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddCredential, setShowAddCredential] = useState(false);
    const [newCredential, setNewCredential] = useState({ type: '', claims: {} });
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Create or get DID
            const didRes = await didAPI.create();
            setDid(didRes.data.did);

            // Load credentials
            const credsRes = await credentialsAPI.list();
            setCredentials(credsRes.data.credentials);
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await clearKeyPair();
        localStorage.removeItem('jwt_token');
        setKeyPair(null);
        navigate('/setup');
    };

    const handleAddCredential = async (e) => {
        e.preventDefault();
        try {
            await credentialsAPI.create(newCredential.type, newCredential.claims);
            setShowAddCredential(false);
            setNewCredential({ type: '', claims: {} });
            await loadData();
        } catch (err) {
            console.error('Error adding credential:', err);
            alert('Failed to add credential');
        }
    };

    const handleDeleteCredential = async (id) => {
        if (window.confirm('Are you sure you want to delete this credential?')) {
            try {
                await credentialsAPI.delete(id);
                await loadData();
            } catch (err) {
                console.error('Error deleting credential:', err);
            }
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await credentialsAPI.updateStatus(id, status);
            await loadData();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    if (loading) {
        return <div className="loading">Loading wallet...</div>;
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>🔐 SSI Wallet</h1>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
            </header>

            <div className="dashboard-content">
                <section className="did-section">
                    <h2>Your Decentralized Identifier</h2>
                    <div className="did-card">
                        <code>{did || 'Loading...'}</code>
                    </div>
                </section>

                <section className="credentials-section">
                    <div className="section-header">
                        <h2>Verifiable Credentials ({credentials.length})</h2>
                        <button
                            className="primary-button"
                            onClick={() => setShowAddCredential(true)}
                        >
                            + Add Credential
                        </button>
                    </div>

                    {showAddCredential && (
                        <div className="modal-overlay" onClick={() => setShowAddCredential(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <h3>Add New Credential</h3>
                                <form onSubmit={handleAddCredential}>
                                    <div className="form-group">
                                        <label>Credential Type</label>
                                        <select
                                            value={newCredential.type}
                                            onChange={(e) => setNewCredential({ ...newCredential, type: e.target.value, claims: {} })}
                                            required
                                        >
                                            <option value="">Select type...</option>
                                            <option value="UniversityDegree">University Degree</option>
                                            <option value="ProofOfEmployment">Proof of Employment</option>
                                            <option value="DriverLicense">Driver License</option>
                                        </select>
                                    </div>

                                    {newCredential.type === 'UniversityDegree' && (
                                        <>
                                            <div className="form-group">
                                                <label>Name</label>
                                                <input
                                                    type="text"
                                                    onChange={(e) => setNewCredential({
                                                        ...newCredential,
                                                        claims: { ...newCredential.claims, name: e.target.value }
                                                    })}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Degree</label>
                                                <input
                                                    type="text"
                                                    onChange={(e) => setNewCredential({
                                                        ...newCredential,
                                                        claims: { ...newCredential.claims, degree: e.target.value }
                                                    })}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>University</label>
                                                <input
                                                    type="text"
                                                    onChange={(e) => setNewCredential({
                                                        ...newCredential,
                                                        claims: { ...newCredential.claims, university: e.target.value }
                                                    })}
                                                    required
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="modal-actions">
                                        <button type="button" onClick={() => setShowAddCredential(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="primary-button">
                                            Add Credential
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="credentials-list">
                        {credentials.length === 0 ? (
                            <p className="empty-state">No credentials yet. Add your first credential!</p>
                        ) : (
                            credentials.map((cred) => (
                                <div key={cred.id} className="credential-card">
                                    <div className="credential-header">
                                        <h3>{cred.type}</h3>
                                        <span className={`status-badge status-${cred.status}`}>
                                            {cred.status}
                                        </span>
                                    </div>
                                    <p className="credential-date">
                                        Created: {new Date(cred.createdAt).toLocaleDateString()}
                                    </p>
                                    <div className="credential-actions">
                                        {cred.status === 'active' && (
                                            <button onClick={() => handleUpdateStatus(cred.id, 'revoked')}>
                                                Revoke
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteCredential(cred.id)} className="delete-btn">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Dashboard;
