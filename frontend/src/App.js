import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { loadKeyPair } from './services/crypto';
import Setup from './components/Setup';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
    const [keyPair, setKeyPair] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initApp = async () => {
            const storedKeyPair = await loadKeyPair();
            setKeyPair(storedKeyPair);
            setLoading(false);
        };

        initApp();
    }, []);

    if (loading) {
        return (
            <div className="app-loading">
                <div className="spinner"></div>
                <p>Loading SSI Wallet...</p>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <div className="app">
                <Routes>
                    <Route
                        path="/setup"
                        element={!keyPair ? <Setup setKeyPair={setKeyPair} /> : <Navigate to="/dashboard" />}
                    />
                    <Route
                        path="/dashboard"
                        element={keyPair ? <Dashboard keyPair={keyPair} setKeyPair={setKeyPair} /> : <Navigate to="/setup" />}
                    />
                    <Route path="*" element={<Navigate to={keyPair ? "/dashboard" : "/setup"} />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
