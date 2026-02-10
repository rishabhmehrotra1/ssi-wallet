const request = require('supertest');
const app = require('../../src/server');

describe('Health Check Endpoint', () => {
    // Note: The server starts listening automatically when imported.
    // In a real production setup, we would separate app definition from app.listen
    // to avoid port conflicts and open handles during testing.
    // For this quick test, verify simple response.

    it('should return 200 and healthy status', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toEqual(200);
        // The timestamp will vary, so just check for the status property
        expect(res.body).toHaveProperty('status', 'healthy');
        expect(res.body).toHaveProperty('timestamp');
    });
});
