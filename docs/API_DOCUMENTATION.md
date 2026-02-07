# API Documentation

## Base URL
```
http://localhost:8080/api
```

## Authentication

All endpoints except `/auth/*` require a JWT Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Request Challenge

Request a challenge for signature-based authentication.

**Endpoint**: `POST /api/auth/challenge`

**Request Body**:
```json
{
  "publicKey": "base64_encoded_public_key"
}
```

**Response** (200 OK):
```json
{
  "challenge": "random_string_to_sign"
}
```

**Errors**:
- `400 Bad Request`: Invalid or missing publicKey

---

### Verify Signature

Verify the signed challenge and receive a JWT token.

**Endpoint**: `POST /api/auth/verify`

**Request Body**:
```json
{
  "publicKey": "base64_encoded_public_key",
  "signature": "base64_encoded_signature",
  "challenge": "challenge_from_previous_step"
}
```

**Response** (200 OK):
```json
{
  "token": "jwt_token_string",
  "expiresIn": "24h"
}
```

**Errors**:
- `400 Bad Request`: Missing fields or invalid format
- `401 Unauthorized`: Invalid signature or expired challenge

---

## DID Endpoints

### Create DID

Create or retrieve the DID for the authenticated user.

**Endpoint**: `POST /api/did/create`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (201 Created or 200 OK):
```json
{
  "did": "did:key:z6Mk...",
  "didDocument": {
    "id": "did:key:z6Mk...",
    "verificationMethod": [{
      "id": "did:key:z6Mk...#key-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:key:z6Mk...",
      "publicKeyBase64": "..."
    }],
    "authentication": ["did:key:z6Mk...#key-1"]
  }
}
```

---

### Resolve DID

Retrieve the DID document for a specific DID.

**Endpoint**: `GET /api/did/resolve/:did`

**Parameters**:
- `did`: The DID to resolve (URL-encoded)

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "didDocument": {
    "id": "did:key:z6Mk...",
    "verificationMethod": [...],
    "authentication": [...]
  }
}
```

**Errors**:
- `404 Not Found`: DID not found

---

## Credentials Endpoints

### Create Credential

Issue a new verifiable credential.

**Endpoint**: `POST /api/credentials`

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "type": "UniversityDegree",
  "claims": {
    "name": "John Doe",
    "degree": "Bachelor of Computer Science",
    "university": "Example University"
  }
}
```

**Supported Types**:
- `UniversityDegree`
- `ProofOfEmployment`
- `DriverLicense`

**Response** (201 Created):
```json
{
  "credential": {
    "id": "uuid-v4",
    "type": "UniversityDegree",
    "issuer": "did:key:z6Mk...",
    "issuanceDate": "2024-02-07T08:00:00.000Z",
    "credentialSubject": {
      "id": "did:key:z6Mk...",
      "name": "John Doe",
      "degree": "Bachelor of Computer Science",
      "university": "Example University"
    },
    "proof": {
      "type": "Ed25519Signature2020",
      "created": "2024-02-07T08:00:00.000Z",
      "proofPurpose": "assertionMethod",
      "verificationMethod": "did:key:z6Mk...#key-1",
      "signature": "base64_signature"
    }
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid type or missing claims
- `500 Internal Server Error`: Failed to create credential

---

### List Credentials

Retrieve all credentials for the authenticated user.

**Endpoint**: `GET /api/credentials`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "credentials": [
    {
      "id": "uuid-v4",
      "type": "UniversityDegree",
      "status": "active",
      "createdAt": "2024-02-07T08:00:00.000Z",
      "claims": {
        "name": "John Doe",
        "degree": "Bachelor of Computer Science",
        "university": "Example University"
      }
    }
  ]
}
```

---

### Get Credential by ID

Retrieve a specific credential with full details.

**Endpoint**: `GET /api/credentials/:id`

**Headers**:
```
Authorization: Bearer <token>
```

**Parameters**:
- `id`: UUID of the credential

**Response** (200 OK):
```json
{
  "credential": {
    "id": "uuid-v4",
    "type": "UniversityDegree",
    "issuer": "did:key:z6Mk...",
    "issuanceDate": "2024-02-07T08:00:00.000Z",
    "status": "active",
    "credentialSubject": {...},
    "proof": {...}
  }
}
```

**Errors**:
- `404 Not Found`: Credential not found or not owned by user

---

### Update Credential Status

Update the status of a credential (revoke/activate).

**Endpoint**: `PATCH /api/credentials/:id`

**Headers**:
```
Authorization: Bearer <token>
```

**Parameters**:
- `id`: UUID of the credential

**Request Body**:
```json
{
  "status": "revoked"
}
```

**Allowed Status Values**:
- `active`
- `revoked`

**Response** (200 OK):
```json
{
  "credential": {
    "id": "uuid-v4",
    "status": "revoked",
    "revokedAt": "2024-02-07T08:30:00.000Z"
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid status value
- `404 Not Found`: Credential not found

---

### Delete Credential

Permanently delete a credential.

**Endpoint**: `DELETE /api/credentials/:id`

**Headers**:
```
Authorization: Bearer <token>
```

**Parameters**:
- `id`: UUID of the credential

**Response** (200 OK):
```json
{
  "message": "Credential deleted successfully"
}
```

**Errors**:
- `404 Not Found`: Credential not found

---

## System Endpoints

### Health Check

Check if the service is healthy.

**Endpoint**: `GET /health`

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2024-02-07T08:00:00.000Z"
}
```

---

### Metrics

Prometheus-format metrics for monitoring.

**Endpoint**: `GET /metrics`

**Response** (200 OK):
```
# HELP http_request_duration_ms HTTP request duration in milliseconds
# TYPE http_request_duration_ms histogram
...
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "message": "Description of what went wrong",
    "stack": "Stack trace (only in development mode)"
  }
}
```

### Common HTTP Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Response when exceeded**: 429 Too Many Requests
  ```json
  {
    "error": {
      "message": "Too many requests from this IP, please try again later."
    }
  }
  ```

---

## Request/Response Examples

### Complete Authentication Flow

```bash
# Step 1: Request challenge
curl -X POST http://localhost:8080/api/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{
    "publicKey": "ABC123..."
  }'

# Response: {"challenge": "xyz789..."}

# Step 2: Sign challenge with private key (done client-side)
# signature = sign(challenge, privateKey)

# Step 3: Verify signature and get token
curl -X POST http://localhost:8080/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "publicKey": "ABC123...",
    "signature": "DEF456...",
    "challenge": "xyz789..."
  }'

# Response: {"token": "eyJhbGciOi...", "expiresIn": "24h"}
```

### Create and Manage Credential

```bash
# Create DID first
curl -X POST http://localhost:8080/api/did/create \
  -H "Authorization: Bearer eyJhbGciOi..."

# Create credential
curl -X POST http://localhost:8080/api/credentials \
  -H "Authorization: Bearer eyJhbGciOi..." \
  -H "Content-Type: application/json" \
  -d '{
    "type": "UniversityDegree",
    "claims": {
      "name": "Alice Smith",
      "degree": "Master of Science",
      "university": "Tech University"
    }
  }'

# List all credentials
curl http://localhost:8080/api/credentials \
  -H "Authorization: Bearer eyJhbGciOi..."

# Revoke credential
curl -X PATCH http://localhost:8080/api/credentials/uuid-here \
  -H "Authorization: Bearer eyJhbGciOi..." \
  -H "Content-Type: application/json" \
  -d '{"status": "revoked"}'
```

---

## Security Considerations

1. **Always use HTTPS** in production
2. **Store JWT tokens securely** (httpOnly cookies recommended for production)
3. **Validate all inputs** on the client side before sending
4. **Never share private keys** or JWT tokens
5. **Implement token refresh** for long-running sessions

---

For more information, see the [README.md](../README.md) file.
