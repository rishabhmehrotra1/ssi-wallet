# SSI Personal Data Wallet - Architecture

## System Overview

```mermaid
graph TB
    subgraph "Client (Browser)"
        UI[React Frontend]
        Storage[IndexedDB<br/>Private Keys]
        Crypto[TweetNaCl<br/>Cryptography]
    end
    
    subgraph "Backend API"
        Express[Express.js Server]
        Auth[Auth Module]
        DID[DID Module]
        Cred[Credentials Module]
        
        Express --> Auth
        Express --> DID
        Express --> Cred
    end
    
    subgraph "Infrastructure"
        DB[(MySQL<br/>Database)]
        Logs[Pino Logger]
        Metrics[Prometheus<br/>Metrics]
    end
    
    UI -->|HTTPS/API Calls| Express
    Storage -.->|Local Storage| UI
    Crypto -->|Sign/Verify| UI
    
    Auth -->|Store Public Keys| DB
    DID -->|Store DIDs| DB
    Cred -->|Store Credentials| DB
    
    Express -->|Write Logs| Logs
    Express -->|Expose Metrics| Metrics
    
    style UI fill:#667eea,color:#fff
    style Express fill:#764ba2,color:#fff
    style DB fill:#00758f,color:#fff
```

## Component Architecture

### Frontend Components

```mermaid
graph LR
    App[App.js<br/>Router]
    Setup[Setup Component<br/>Wallet Creation]
    Dashboard[Dashboard Component<br/>Main UI]
    
    API[API Service<br/>axios]
    CryptoSvc[Crypto Service<br/>Key Management]
    
    App --> Setup
    App --> Dashboard
    
    Setup --> CryptoSvc
    Setup --> API
    
    Dashboard --> API
    Dashboard --> CryptoSvc
    
    style App fill:#667eea,color:#fff
    style Setup fill:#48c774,color:#fff
    style Dashboard fill:#3298dc,color:#fff
    style API fill:#ffdd57,color:#000
    style CryptoSvc fill:#f14668,color:#fff
```

### Backend Modules

```mermaid
graph TB
    subgraph "API Routes"
        AuthRoutes[/api/auth]
        DIDRoutes[/api/did]
        CredRoutes[/api/credentials]
    end
    
    subgraph "Controllers"
        AuthCtrl[Auth Controller]
        DIDCtrl[DID Controller]
        CredCtrl[Credentials Controller]
    end
    
    subgraph "Services"
        AuthSvc[Auth Service]
        DIDSvc[DID Service]
        CredSvc[Credentials Service]
    end
    
    subgraph "Common"
        DB[Database Config]
        Security[Security Utils]
        Logger[Logger]
    end
    
    AuthRoutes --> AuthCtrl
    DIDRoutes --> DIDCtrl
    CredRoutes --> CredCtrl
    
    AuthCtrl --> AuthSvc
    DIDCtrl --> DIDSvc
    CredCtrl --> CredSvc
    
    AuthSvc --> DB
    DIDSvc --> DB
    CredSvc --> DB
    
    AuthSvc --> Security
    DIDSvc --> Security
    CredSvc --> Security
    
    AuthSvc --> Logger
    DIDSvc --> Logger
    CredSvc --> Logger
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant API
    participant DB
    
    User->>Browser: Click "Create Wallet"
    Browser->>Browser: Generate Ed25519 Key Pair
    Browser->>Browser: Save to IndexedDB
    
    Browser->>API: POST /auth/challenge<br/>{publicKey}
    API->>API: Generate Random Challenge
    API->>API: Store Challenge (temp)
    API-->>Browser: {challenge}
    
    Browser->>Browser: Sign Challenge<br/>with Private Key
    
    Browser->>API: POST /auth/verify<br/>{publicKey, signature, challenge}
    API->>API: Verify Signature
    API->>API: Generate JWT Token
    API->>DB: Store Public Key
    API-->>Browser: {token}
    
    Browser->>Browser: Store JWT in localStorage
    Browser-->>User: Redirect to Dashboard
```

## DID Creation Flow

```mermaid
sequenceDiagram
    participant Browser
    participant API
    participant DB
    
    Browser->>API: POST /api/did/create<br/>Authorization: Bearer {token}
    API->>API: Extract Public Key from JWT
    API->>API: Check if DID exists
    
    alt DID Exists
        API-->>Browser: Return Existing DID
    else DID Not Found
        API->>API: Generate DID<br/>did:key:z6Mk...
        API->>API: Create DID Document
        API->>DB: Store DID + Document
        API-->>Browser: {did, didDocument}
    end
    
    Browser->>Browser: Display DID
```

## Credential Issuance Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant API
    participant DB
    
    User->>Browser: Fill Credential Form<br/>Type + Claims
    Browser->>API: POST /api/credentials<br/>{type, claims}
    API->>API: Validate Input
    API->>DB: Get User's DID
    
    API->>API: Create Credential Object<br/>+ Add Metadata
    API->>API: Sign Credential<br/>with Server Key
    
    API->>API: Encrypt Credential<br/>(AES-256-GCM)
    API->>DB: Store Encrypted Credential
    
    API-->>Browser: {credential}
    Browser->>Browser: Display in List
    Browser-->>User: Show Success
```

## Data Model

### Database Schema (MySQL)

```mermaid
erDiagram
    DIDS ||--o{ CREDENTIALS : owns
    
    DIDS {
        int id PK
        text user_public_key
        varchar did UK
        blob encrypted_did_document
        blob iv
        blob tag
        timestamp created_at
    }
    
    CREDENTIALS {
        char id PK
        text user_public_key
        varchar type
        blob encrypted_data
        blob iv
        blob tag
        enum status
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
```

### Credential Structure

```mermaid
graph TB
    Credential[Verifiable Credential]
    
    Credential --> Context["@context"]
    Credential --> ID[id: UUID]
    Credential --> Type[type: string]
    Credential --> Issuer[issuer: DID]
    Credential --> IssuanceDate[issuanceDate]
    Credential --> Subject[credentialSubject]
    Credential --> Proof[proof]
    
    Subject --> SubjectID[id: subject DID]
    Subject --> Claims[claims: object]
    
    Proof --> ProofType[type: Ed25519Signature2020]
    Proof --> Created[created]
    Proof --> Purpose[proofPurpose]
    Proof --> Method[verificationMethod]
    Proof --> Signature[signature: base64]
    
    style Credential fill:#667eea,color:#fff
    style Subject fill:#48c774,color:#fff
    style Proof fill:#f14668,color:#fff
```

## Security Architecture

### Encryption Layers

```mermaid
graph TB
    subgraph "Client Side"
        PK[Private Key<br/>🔐 IndexedDB]
        JWT[JWT Token<br/>🔐 localStorage]
    end
    
    subgraph "In Transit"
        HTTPS[HTTPS/TLS<br/>🔒 Encrypted Channel]
    end
    
    subgraph "Server Side"
        Helmet[Helmet.js<br/>Security Headers]
        RateLimit[Rate Limiting<br/>100 req/15min]
        Validation[Input Validation<br/>express-validator]
    end
    
    subgraph "Database"
        EncData[Encrypted Data<br/>AES-256-GCM]
        Params[Parameterized Queries<br/>SQL Injection Protection]
    end
    
    PK -->|HTTPS| HTTPS
    JWT -->|Bearer Token| HTTPS
    
    HTTPS --> Helmet
    Helmet --> RateLimit
    RateLimit --> Validation
    
    Validation --> EncData
    Validation --> Params
```

### Authentication Security

1. **No Passwords**: Challenge-response using Ed25519 signatures
2. **Time-Limited Challenges**: Expire after usage or timeout
3. **JWT Tokens**: 24-hour expiry, signed with server secret
4. **Signature Verification**: Cryptographic proof of key ownership

### Data Security

1. **Client-Side**:
   - Private keys never leave the browser
   - Stored in IndexedDB (browser-encrypted)
   
2. **Transport**:
   - HTTPS/TLS encryption
   - CORS protection
   
3. **Server-Side**:
   - Credentials encrypted with AES-256-GCM
   - Encryption key from environment variable
   - Parameterized SQL queries

## Deployment Architecture

### Docker Compose Setup

```mermaid
graph TB
    subgraph "Docker Network: ssi-net"
        Frontend[Frontend Container<br/>React App<br/>Port 3000]
        Backend[Backend Container<br/>Express API<br/>Port 8080]
        DB[MySQL Container<br/>Database<br/>Port 3306]
    end
    
    User[User Browser] -->|HTTP| Frontend
    Frontend -->|API Calls| Backend
    Backend -->|SQL| DB
    
    Volume[Docker Volume<br/>mysql-data] -.->|Persist Data| DB
    
    style Frontend fill:#667eea,color:#fff
    style Backend fill:#764ba2,color:#fff
    style DB fill:#00758f,color:#fff
```

### Production Deployment

```mermaid
graph TB
    Users[Users] --> LB[Load Balancer<br/>NGINX/ALB]
    
    LB --> FE1[Frontend Instance 1]
    LB --> FE2[Frontend Instance 2]
    
    FE1 --> API
    FE2 --> API
    
    API[API Gateway] --> BE1[Backend Instance 1]
    API --> BE2[Backend Instance 2]
    
    BE1 --> Cache[Redis Cache]
    BE2 --> Cache
    
    BE1 --> DB[(MySQL<br/>Primary)]
    BE2 --> DB
    
    DB --> DBReplica[(MySQL<br/>Replica)]
    
    BE1 --> Metrics[Prometheus]
    BE2 --> Metrics
    
    Metrics --> Grafana[Grafana Dashboard]
    
    style LB fill:#f39c12,color:#fff
    style API fill:#e74c3c,color:#fff
    style DB fill:#00758f,color:#fff
    style Metrics fill:#16a085,color:#fff
```

## Technology Stack

### Frontend Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 18 | UI framework |
| Routing | React Router v6 | Client-side routing |
| HTTP Client | Axios | API communication |
| Cryptography | TweetNaCl | Ed25519 signatures |
| Storage | localforage | IndexedDB wrapper |
| Styling | Vanilla CSS | Custom styling |

### Backend Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | Node.js 18+ | JavaScript runtime |
| Framework | Express.js | Web framework |
| Database | MySQL 8.0 | Relational database |
| Cryptography | TweetNaCl, @noble/ed25519 | Signatures, encryption |
| Auth | JWT | Token-based auth |
| Security | Helmet, CORS | HTTP security |
| Logging | Pino | Structured logging |
| Metrics | prom-client | Prometheus metrics |
| Validation | express-validator | Input validation |

### Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| Containerization | Docker | Application packaging |
| Orchestration | Docker Compose | Multi-container management |
| Database | MySQL 8.0 | Data persistence |
| Reverse Proxy | NGINX (optional) | Load balancing, SSL |

## API Design Principles

1. **RESTful**: Standard HTTP methods (GET, POST, PATCH, DELETE)
2. **Stateless**: JWT tokens, no server-side sessions
3. **Versioned**: `/api/v1/...` (future-proofing)
4. **Consistent**: Uniform error responses
5. **Secure**: Authentication on all routes except /auth

## Scalability Considerations

### Horizontal Scaling

- **Stateless Design**: No server-side sessions
- **Database Connection Pooling**: Efficient DB connections
- **JWT Tokens**: No need for shared session store

### Performance Optimizations

- **Indexing**: Database indexes on frequently queried fields
- **Rate Limiting**: Prevent abuse
- **Compression**: Response compression (future)
- **CDN**: Static assets (frontend production build)

### Future Enhancements

```mermaid
graph LR
    Current[Current System]
    
    Current --> Redis[Redis Caching]
    Current --> Queue[Message Queue]
    Current --> S3[Object Storage]
    Current --> Analytics[Analytics Service]
    
    Redis --> Fast[Faster Lookups]
    Queue --> Async[Async Processing]
    S3 --> Files[File Storage]
    Analytics --> Insights[User Insights]
    
    style Current fill:#667eea,color:#fff
```

---

## Key Design Decisions

### 1. Client-Side Key Generation
**Why**: Maximum security - private keys never transmitted

### 2. DID Method: `did:key`
**Why**: Simple, self-contained, no blockchain required

### 3. Ed25519 Cryptography
**Why**: Fast, secure, small signatures

### 4. JWT Authentication
**Why**: Stateless, scalable, industry standard

### 5. MySQL Database
**Why**: Reliable, high performance, industry standard

### 6. Docker Deployment
**Why**: Consistency, easy deployment, isolation

---

For implementation details, see [README.md](../README.md) and [API Documentation](API_DOCUMENTATION.md).
