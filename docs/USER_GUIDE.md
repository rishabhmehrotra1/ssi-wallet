# User Guide - SSI Personal Data Wallet

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Creating Your Wallet](#creating-your-wallet)
4. [Understanding DIDs](#understanding-dids)
5. [Managing Credentials](#managing-credentials)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Introduction

### What is SSI?

**Self-Sovereign Identity (SSI)** puts you in control of your digital identity. Instead of relying on centralized authorities (like Facebook, Google, or government databases), SSI allows you to:

- **Own your identity data** stored locally in your device
- **Control who accesses** your information
- **Prove claims** about yourself without revealing unnecessary details
- **Revoke access** to your credentials at any time

### What is a DID?

A **Decentralized Identifier (DID)** is a unique identifier that you own and control. Think of it as your digital fingerprint that:
- Is globally unique
- Can be verified cryptographically
- Is not controlled by any central authority
- Works across different systems

### What are Verifiable Credentials?

**Verifiable Credentials** are digital versions of physical documents (like diplomas, licenses, or certificates) that:
- Can be verified without contacting the issuer
- Are tamper-proof through cryptographic signatures
- Can be selectively disclosed (show only what's needed)

---

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- The SSI Wallet application running on your system or server

### Accessing the Application

1. Open your web browser
2. Navigate to: `http://localhost:3000` (or your deployment URL)
3. You'll see the wallet setup screen

---

## Creating Your Wallet

### Step-by-Step Setup

#### 1. Initial Screen

When you first access the application, you'll see:
- Application title: "🔐 SSI Personal Data Wallet"
- Description of the wallet features
- A "Create New Wallet" button

#### 2. Create Your Wallet

Click the **"Create New Wallet"** button. The system will:

1. **Generate a cryptographic key pair** in your browser
   - Public key: Shared with the server (like your username)
   - Private key: Stays in your browser (like your password)

2. **Create your DID** automatically
   - Your unique identifier based on your public key

3. **Authenticate you** with the server
   - Challenge-response authentication (no password needed!)

4. **Redirect to dashboard** once complete

#### 3. Success!

You'll see a success message and be redirected to your dashboard.

### ⚠️ Important Security Notes

- **Your private key is stored in your browser's IndexedDB**
- If you clear browser data, you'll lose access to your wallet
- If you switch browsers or devices, you cannot access the same wallet
- **This is a prototype** - don't use for real sensitive data

---

## Understanding DIDs

### Your DID Display

On your dashboard, you'll see your DID at the top:

```
did:key:z6Mkf5rGMoatrSj1f4CsvT7quEZmVuF4qHW2HJJt8JfDLj2u
```

### DID Format Explained

- `did:` - Indicates this is a DID
- `key:` - Method (using key-based DIDs)
- `z6Mk...` - Your unique identifier

### What Can You Do With Your DID?

- **Share it** with others to prove your identity
- **Use it** to sign credentials
- **Verify** others' credentials using their DIDs

### DID Document

Behind your DID is a **DID Document** containing:
- Your public key
- Verification methods
- Authentication capabilities

The application handles this automatically!

---

## Managing Credentials

### Viewing Your Credentials

The main dashboard shows:
- Total number of credentials: `Verifiable Credentials (3)`
- List of all your credentials with:
  - Credential type (e.g., "University Degree")
  - Status badge (Active / Revoked)
  - Creation date

### Adding a New Credential

#### Step 1: Click "+ Add Credential"

A modal will appear with a form.

#### Step 2: Select Credential Type

Choose from:
- **University Degree**: For educational qualifications
- **Proof of Employment**: For work history
- **Driver License**: For licensing information

#### Step 3: Fill in Details

**For University Degree:**
- Name: Your full name
- Degree: Type of degree (e.g., "Bachelor of Science")
- University: Name of the institution

**For Proof of Employment:**
- Name: Employee name
- Position: Job title
- Company: Employer name
- Start Date: When you started

**For Driver License:**
- Name: License holder name
- License Number: DL number
- State: Issuing state
- Expiry Date: When it expires

#### Step 4: Submit

Click **"Add Credential"**. The credential will be:
1. Created with a unique ID
2. Signed with your private key
3. Stored encrypted in the database
4. Displayed in your credential list

### Credential Details

Each credential shows:
- **Type**: What kind of credential
- **Status Badge**: 
  - 🟢 **Active** (green) - Valid and usable
  - 🔴 **Revoked** (red) - No longer valid
- **Creation Date**: When it was issued

### Revoking a Credential

If a credential should no longer be valid:

1. Find the credential in your list
2. Click the **"Revoke"** button
3. The status will change to "revoked"
4. The credential remains in your list but marked as invalid

**Why Revoke?**
- Diploma from a university you transferred from
- Old employment letters
- Expired licenses

### Deleting a Credential

To permanently remove a credential:

1. Find the credential in your list
2. Click the **"Delete"** button
3. Confirm the deletion in the popup
4. The credential is permanently removed

⚠️ **Deletion is permanent** - you cannot undo this action!

### Empty State

If you have no credentials, you'll see:
> "No credentials yet. Add your first credential!"

---

## Security Best Practices

### Do's ✅

1. **Use HTTPS in production** - Never run over plain HTTP in real deployments
2. **Keep your browser data secure** - Use browser lock features
3. **Verify credential sources** - Only accept credentials from trusted issuers
4. **Regular backups** - (Future feature: export wallet)
5. **Use strong device passwords** - Protect physical access to your device

### Don'ts ❌

1. **Don't share your private key** - Never export or share your secret key
2. **Don't use for real data** - This is a prototype, not production-ready
3. **Don't clear browser data** - You'll lose access to your wallet
4. **Don't trust unverified credentials** - Always verify the issuer's DID
5. **Don't access from public computers** - Use only trusted devices

### Data Storage

**Client-Side (Your Browser):**
- Private key (sensitive)
- Public key
- JWT authentication token

**Server-Side (Database):**
- Public key (encrypted)
- DIDs
- Credentials (encrypted with AES-256-GCM)
- Metadata (timestamps, status)

---

## Troubleshooting

### "Failed to create wallet"

**Problem**: Wallet creation fails

**Solutions**:
1. Check backend is running: http://localhost:8080/health
2. Check browser console for errors (F12 → Console tab)
3. Clear browser cache and try again
4. Verify `.env` file has correct values

### "Cannot load credentials"

**Problem**: Dashboard shows loading forever or errors

**Solutions**:
1. Check network connection
2. Verify JWT token is valid (check localStorage)
3. Restart the backend server
4. Clear browser data and create a new wallet

### "Authentication failed"

**Problem**: Cannot sign in after wallet creation

**Solutions**:
1. Clear browser IndexedDB and start over
2. Check backend logs for signature verification errors
3. Ensure time sync between client and server (challenges expire)

### "Credential not saving"

**Problem**: Add credential form submits but nothing happens

**Solutions**:
1. Check browser console for validation errors
2. Verify all required fields are filled
3. Check backend logs for database errors
4. Ensure database is running: `docker compose ps`

### Lost Access to Wallet

**Problem**: Cleared browser data or changed browsers

**Unfortunately**: There's currently no recovery mechanism. You must create a new wallet.

**Future improvement**: Implement wallet export/import with encryption

---

## Advanced Features

### Browser Developer Tools

#### View Your Private Key (Advanced Users Only)

1. Open browser DevTools (F12)
2. Go to **Application** tab
3. Expand **IndexedDB** → **localforage** → **keyvaluepairs**
4. Look for `wallet_keypair`

⚠️ **WARNING**: Never share these values!

#### View JWT Token

1. Open browser DevTools (F12)
2. Go to **Application** tab
3. **Local Storage** → `http://localhost:3000`
4. Look for `jwt_token`

#### Monitor API Calls

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Perform actions in the wallet
4. See all API requests/responses

---

## Keyboard Shortcuts

- `Escape`: Close modal dialogs
- `Enter`: Submit forms (when focused on input)
- `Tab`: Navigate between form fields

---

## Glossary

| Term | Definition |
|------|------------|
| **SSI** | Self-Sovereign Identity - user-controlled digital identity |
| **DID** | Decentralized Identifier - unique identifier you control |
| **Credential** | Digital proof of a claim (like a diploma or license) |
| **Public Key** | Your publicly shareable cryptographic key |
| **Private Key** | Your secret cryptographic key (never share!) |
| **JWT** | JSON Web Token - used for authentication |
| **IndexedDB** | Browser database for storing data locally |
| **Revocation** | Marking a credential as no longer valid |
| **Verification** | Checking if a credential is authentic |

---

## Getting Help

### Check Logs

**Backend logs:**
```bash
docker compose logs -f backend
```

**Browser console:**
- Press F12 → Console tab

### Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Invalid signature" | Authentication failed | Clear browser data, recreate wallet |
| "Rate limit exceeded" | Too many requests | Wait 15 minutes |
| "Credential not found" | Invalid credential ID | Refresh the page |
| "Database error" | Server issue | Check backend logs |

---

## Next Steps

1. ✅ **Create your wallet** - Follow the setup guide
2. ✅ **Add credentials** - Try each credential type
3. ✅ **Practice revoking** - Revoke and reactivate credentials
4. ✅ **Explore the API** - Check the [API Documentation](API_DOCUMENTATION.md)
5. ✅ **Review security** - Understand the security model

---

**Need more help?** Check the [README.md](../README.md) for technical details or [API Documentation](API_DOCUMENTATION.md) for developer information.
