# SSI Personal Data Wallet 🔐

A Self-Sovereign Identity (SSI) Personal Data Wallet built with decentralized identifiers (DIDs) and verifiable credentials. This project implements passwordless authentication using cryptographic key pairs and provides secure credential management.

## 🎯 Features

- **Decentralized Identity (DID)**: Client-side key generation and DID creation
- **Verifiable Credentials**: Issue, manage, revoke, and delete credentials
- **Passwordless Authentication**: Challenge-response authentication using Ed25519 signatures
- **Secure Storage**: Encrypted storage using IndexedDB (client) and MySQL (server)
- **Observability**: Metrics, logging, and health checks built-in
- **Production-Ready**: Docker containerization with comprehensive security measures

## 🏗️ Architecture

### Backend
- **Framework**: Express.js (Node.js)
- **Database**: MySQL 8.0
- **Cryptography**: TweetNaCl (Ed25519), JWT authentication
- **Security**: Helmet, CORS, rate limiting, input validation
- **Observability**: Pino logging, Prometheus metrics

### Frontend
- **Framework**: React 18 with React Router
- **UI/UX**: Custom CSS with gradient designs and animations
- **Storage**: IndexedDB via localforage
- **API Client**: Axios with JWT interceptors

## 📋 Prerequisites

- **Docker & Docker Compose** (recommended) OR
- **Node.js 18+** and **npm**
- **MySQL 8.0** (if not using Docker)

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone and navigate to the project**:
   ```bash
   cd /home/rishabhmehrotra/.gemini/antigravity/scratch/DoT-PreWork/Problem2-SSI-Wallet
   ```

2. **Set up environment variables**:
   ```bash
   # .env file is already created with development defaults
   # For production, update ENCRYPTION_KEY and JWT_SECRET:
   openssl rand -hex 32  # For ENCRYPTION_KEY
   openssl rand -base64 32  # For JWT_SECRET
   ```

3. **Start the application**:
   ```bash
   docker compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/health
   - Metrics: http://localhost:8080/metrics

### Option 2: Local Development

1. **Install dependencies**:
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend (in another terminal)
   cd frontend
   npm install
   ```

2. **Set up MySQL**:
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE ssi_wallet;"
   
   # Run schema
   mysql -u root -p ssi_wallet < backend/src/database/schema_mysql.sql
   ```

3. **Configure environment**:
   ```bash
   # Update .env with local database settings
   DB_HOST=localhost
   DB_PORT=3306
   ```

4. **Run the application**:
   ```bash
   # Backend (terminal 1)
   cd backend
   npm run dev
   
   # Frontend (terminal 2)
   cd frontend
   npm start
   ```

## 📖 Usage Guide

### First-Time Setup

1. Navigate to http://localhost:3000
2. Click **"Create New Wallet"**
3. A cryptographic key pair is generated in your browser
4. Your DID is automatically created
5. You'll be redirected to the dashboard

### Managing Credentials

**Add a Credential:**
1. Click **"+ Add Credential"**
2. Select credential type (University Degree, Proof of Employment, Driver License)
3. Fill in the required fields
4. Click **"Add Credential"**

**Revoke a Credential:**
- Click **"Revoke"** on an active credential

**Delete a Credential:**
- Click **"Delete"** and confirm

### Security Notes

⚠️ **Important**: This is a prototype for demonstration purposes.

- Keys are stored in browser IndexedDB (not encrypted with passphrase)
- Losing browser data = losing wallet access
- Do not use for real identity/sensitive data in production without additional security measures

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration
```

### Manual API Testing

```bash
# Health check
curl http://localhost:8080/health

# Request authentication challenge
curl -X POST http://localhost:8080/api/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"publicKey":"YOUR_PUBLIC_KEY_BASE64"}'

# Create DID (requires JWT token)
curl -X POST http://localhost:8080/api/did/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security Features

1. **Cryptographic Authentication**: Ed25519 signatures (no passwords)
2. **Encrypted Storage**: AES-256-GCM for sensitive data at rest
3. **JWT Tokens**: Secure session management
4. **Rate Limiting**: 100 requests per 15 minutes per IP
5. **Security Headers**: Helmet.js with CSP
6. **CORS Protection**: Configurable allowed origins
7. **Input Validation**: Express-validator on all endpoints
8. **SQL Injection Protection**: Parameterized queries

## 📊 Monitoring & Observability

### Health Endpoints

- **Health Check**: `GET /health`
- **Metrics**: `GET /metrics` (Prometheus format)

### Logs

Structured JSON logs via Pino:
```bash
# View backend logs
docker compose logs -f backend
```

### Metrics

Available Prometheus metrics:
- `http_request_duration_ms`: Request duration histogram
- `http_request_total`: Total HTTP requests counter
- `http_request_errors_total`: HTTP errors counter

## 🗂️ Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── auth/              # Authentication (challenge-response)
│   │   ├── did/               # DID management
│   │   ├── credentials/       # Verifiable credentials
│   │   ├── config/            # Database, logger, security
│   │   ├── database/          # SQL schema
│   │   ├── observability/     # Metrics, monitoring
│   │   └── server.js          # Express app entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/        # Setup, Dashboard
│   │   ├── services/          # API client, crypto utilities
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── docker-compose.yml
├── .env                       # Environment variables
└── README.md
```

## 🔧 Environment Variables

Key variables in `.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend port | `8080` |
| `NODE_ENV` | Environment | `development` / `production` |
| `DB_HOST` | MySQL host | `mysql` (Docker) / `localhost` |
| `DB_PASSWORD` | Database password | `secure_password` |
| `ENCRYPTION_KEY` | 64-char hex (32 bytes) | Generate with `openssl rand -hex 32` |
| `JWT_SECRET` | JWT signing key | Generate with `openssl rand -base64 32` |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:3000` |

## 🚢 Deployment

### Docker Production Deployment

1. **Update environment**:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   NODE_ENV=production
   ```

2. **Build and deploy**:
   ```bash
   docker compose up -d --build
   ```

3. **Set up reverse proxy** (Nginx example):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
       }
       
       location /api/ {
           proxy_pass http://localhost:8080;
       }
   }
   ```

### Kubernetes Deployment

For Kubernetes deployment, create ConfigMaps and Secrets for environment variables, then deploy using:
- StatefulSet for PostgreSQL
- Deployment for backend and frontend
- Services and Ingress for routing

## 🛠️ Development

### Adding a New Credential Type

1. **Backend**: Update `credentials/credentialController.js` validation
2. **Frontend**: Add option in `Dashboard.js` modal
3. **Frontend**: Add form fields for new type

### Customization

- **Styling**: Edit `frontend/src/App.css`
- **API Routes**: Add to respective route files in `backend/src/*/routes.js`
- **Database Schema**: Update `backend/src/database/schema_mysql.sql`

## 📚 API Documentation

See [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) for detailed endpoint documentation.

## 🤝 Contributing

This is a prototype/demonstration project. For production use:
1. Implement passphrase encryption for private keys
2. Add backup/recovery mechanisms
3. Implement proper audit logging
4. Add comprehensive test coverage (>80%)
5. Security audit by professionals

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- **DID Standards**: W3C Decentralized Identifiers
- **Verifiable Credentials**: W3C VC Data Model
- **Cryptography**: TweetNaCl, libsodium

---

**Built with ❤️ for the Department of Telecommunications (DoT) Pre-Work Assignment**
