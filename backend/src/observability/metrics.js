const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, memory, event loop lag)
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
    registers: [register],
});

const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'path'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [register],
});

const authAttemptsTotal = new client.Counter({
    name: 'auth_attempts_total',
    help: 'Total number of authentication attempts',
    labelNames: ['result'],
    registers: [register],
});

const didOperationsTotal = new client.Counter({
    name: 'did_operations_total',
    help: 'Total number of DID operations',
    labelNames: ['operation'],
    registers: [register],
});

const credentialOperationsTotal = new client.Counter({
    name: 'credential_operations_total',
    help: 'Total number of credential operations',
    labelNames: ['operation', 'status'],
    registers: [register],
});

// Middleware to track metrics
const metricsMiddleware = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const path = req.route ? req.route.path : req.path;

        httpRequestsTotal.inc({
            method: req.method,
            path,
            status: res.statusCode,
        });

        httpRequestDuration.observe({
            method: req.method,
            path,
        }, duration);
    });

    next();
};

module.exports = {
    register,
    metricsMiddleware,
    authAttemptsTotal,
    didOperationsTotal,
    credentialOperationsTotal,
};
