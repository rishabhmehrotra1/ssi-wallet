-- Database schema for SSI Personal Data Wallet

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- DIDs table
CREATE TABLE IF NOT EXISTS dids (
  id SERIAL PRIMARY KEY,
  user_public_key TEXT NOT NULL UNIQUE,
  did TEXT NOT NULL UNIQUE,
  encrypted_did_document BYTEA NOT NULL,
  iv BYTEA NOT NULL,
  tag BYTEA NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dids_user_public_key ON dids(user_public_key);
CREATE INDEX IF NOT EXISTS idx_dids_did ON dids(did);

-- Credentials table
CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_public_key TEXT NOT NULL,
  type TEXT NOT NULL,
  encrypted_data BYTEA NOT NULL,
  iv BYTEA NOT NULL,
  tag BYTEA NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'suspended', 'deleted')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credentials_user_public_key ON credentials(user_public_key);
CREATE INDEX IF NOT EXISTS idx_credentials_status ON credentials(status);
CREATE INDEX IF NOT EXISTS idx_credentials_type ON credentials(type);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON credentials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
