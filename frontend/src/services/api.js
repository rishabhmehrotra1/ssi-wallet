import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

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
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('jwt_token');
            window.location.href = '/login';
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
