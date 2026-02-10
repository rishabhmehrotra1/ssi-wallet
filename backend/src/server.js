require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
const logger = require('./config/logger');
const { metricsMiddleware } = require('./observability/metrics');

// Import routes
const authRoutes = require('./auth/authRoutes');
const didRoutes = require('./did/didRoutes');
const credentialRoutes = require('./credentials/credentialRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    xFrameOptions: { action: 'deny' },
}));

// CORS configuration
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'https://ssi-wallet-1770467216.netlify.app'
].filter(Boolean);

// Support Netlify preview deployments (wildcard pattern)
const netlifyPattern = /^https:\/\/.*\.netlify\.app$/;

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Check if origin matches Netlify pattern (for preview deployments)
        if (netlifyPattern.test(origin)) {
            return callback(null, true);
        }

        // In development, allow all origins for easier testing
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

        // Reject if not allowed
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Rate limiting (Disabled for testing)
/*
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // relaxed for testing
    message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);
*/

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
app.use(pinoHttp({ logger }));

// Metrics middleware
app.use(metricsMiddleware);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/did', didRoutes);
app.use('/api/credentials', credentialRoutes);

// Metrics endpoint
const { register } = require('./observability/metrics');
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error({ err, req: { method: req.method, url: req.url } }, 'Request error');

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: { message: 'Route not found' } });
});

// Start server
const server = app.listen(PORT, () => {
    logger.info(`SSI Wallet Backend running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;