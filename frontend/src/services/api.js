import axios from 'axios';

// Determine API base URL based on environment
// In development: use localhost:8080
// In production: use REACT_APP_API_URL (must be set in Netlify environment variables)
const getApiBaseUrl = () => {
    // If explicitly set, use it (required for production)
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }

    // In development, use localhost:8080
    if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        return 'http://localhost:8080/api';
    }

    // In production, REACT_APP_API_URL must be set
    // This should be the full URL to your backend API
    // e.g., https://your-backend-domain.com/api
    console.error('REACT_APP_API_URL is not set. Please set it in Netlify environment variables.');
    // Return a placeholder that will cause obvious errors
    // This prevents silent failures and makes debugging easier
    return 'MISSING_API_URL';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only handle 401 errors (authentication failures)
        // Clear token but don't redirect - let components handle navigation
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('jwt_token');
        }
        return Promise.reject(error);
    }
);

// Authentication API
export const authAPI = {
    requestChallenge: (publicKey) =>
        api.post('/auth/challenge', { publicKey }),

    verifySignature: (publicKey, signature, challenge) =>
        api.post('/auth/verify', { publicKey, signature, challenge }),
};

// DID API
export const didAPI = {
    create: () => api.post('/did/create'),
    resolve: (did) => api.get(`/did/resolve/${did}`),
};

// Credentials API
export const credentialsAPI = {
    create: (type, claims) => api.post('/credentials', { type, claims }),
    list: () => api.get('/credentials'),
    get: (id) => api.get(`/credentials/${id}`),
    updateStatus: (id, status) => api.patch(`/credentials/${id}`, { status }),
    delete: (id) => api.delete(`/credentials/${id}`),
};

export default api;