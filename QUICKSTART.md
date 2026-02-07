# Quick Start Guide

## Prerequisites

Before running the SSI Wallet, you need to install either Docker or Node.js.

### Option 1: Install Docker (Recommended)

```bash
# Install Docker and Docker Compose
sudo apt update
sudo apt install -y docker.io docker-compose

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### Option 2: Install Node.js

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

## Running the Application

### Using Docker (Easiest)

```bash
# Navigate to project directory
cd /home/rishabhmehrotra/.gemini/antigravity/scratch/DoT-PreWork/Problem2-SSI-Wallet

# Start all services
docker compose up --build

# Access the application:
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
# Health: http://localhost:8080/health
```

### Using Node.js (Local Development)

**Step 1: Install MySQL**
```bash
sudo apt install mysql-server
sudo systemctl start mysql
mysql -u root -p -e "CREATE DATABASE ssi_wallet;"
```

**Step 2: Load Database Schema**
```bash
mysql -u root -p ssi_wallet < backend/src/database/schema_mysql.sql
```

**Step 3: Update .env file**
Edit `.env` and set:
```
DB_HOST=localhost
DB_PORT=3306
```

**Step 4: Install Dependencies and Run**
```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend  
cd frontend
npm install
npm start
```

**Access**: http://localhost:3000

## First Time Usage

1. Open http://localhost:3000 in your browser
2. Click **"Create New Wallet"**
3. Your wallet is created automatically (keys generated in browser)
4. You'll be redirected to the dashboard
5. Your DID is displayed at the top
6. Click **"+ Add Credential"** to create your first credential

## Testing the Application

### Health Check
```bash
curl http://localhost:8080/health
```

Expected output:
```json
{"status":"healthy","timestamp":"2024-02-07T..."}
```

### View Metrics
```bash
curl http://localhost:8080/metrics
```

## Troubleshooting

### Docker Issues

**Problem**: "Cannot connect to the Docker daemon"
```bash
# Solution: Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

**Problem**: "Port already in use"
```bash
# Solution: Stop existing services
docker compose down
# Or change ports in docker-compose.yml
```

### Node.js Issues

**Problem**: "npm command not found"
```bash
# Solution: Reinstall Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**Problem**: "Cannot connect to database"
```bash
# Solution: Start MySQL
sudo systemctl start mysql
sudo systemctl status mysql
```

## Stop the Application

### Docker:
```bash
# Stop and remove containers
docker compose down

# Stop and remove volumes (deletes data)
docker compose down -v
```

### Node.js:
```bash
# Press Ctrl+C in both terminal windows
```

## For More Information

- **Complete Documentation**: See [README.md](README.md)
- **API Reference**: See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- **User Guide**: See [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
- **Architecture**: See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
