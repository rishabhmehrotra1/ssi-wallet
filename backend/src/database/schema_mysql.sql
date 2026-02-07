-- Database schema for SSI Personal Data Wallet (MySQL)

-- DIDs table
CREATE TABLE IF NOT EXISTS dids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_public_key TEXT NOT NULL,
  did VARCHAR(255) NOT NULL UNIQUE,
  encrypted_did_document BLOB NOT NULL,
  iv BLOB NOT NULL,
  tag BLOB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_public_key (user_public_key(255)),
  INDEX idx_did (did)
);

-- Credentials table
CREATE TABLE IF NOT EXISTS credentials (
  id CHAR(36) PRIMARY KEY,
  user_public_key TEXT NOT NULL,
  type VARCHAR(255) NOT NULL,
  encrypted_data BLOB NOT NULL,
  iv BLOB NOT NULL,
  tag BLOB NOT NULL,
  status ENUM('active', 'revoked', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_user_public_key (user_public_key(255)),
  INDEX idx_status (status),
  INDEX idx_type (type)
);
