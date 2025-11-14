import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';

const dbPath = join(process.cwd(), 'data', 'cryptlocker.db');
const dbDir = dirname(dbPath);

// Ensure data directory exists
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      role TEXT DEFAULT 'holder',
      did TEXT,
      wallet_id TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      credential_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      schema_id TEXT NOT NULL,
      cred_def_id TEXT,
      state TEXT DEFAULT 'issued',
      connection_id TEXT,
      attrs TEXT, -- JSON string
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      their_label TEXT,
      their_did TEXT,
      my_did TEXT,
      state TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS proof_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      presentation_exchange_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      connection_id TEXT NOT NULL,
      state TEXT DEFAULT 'request_sent',
      requested_attributes TEXT, -- JSON string
      requested_predicates TEXT, -- JSON string
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS credential_offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      credential_exchange_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      connection_id TEXT,
      schema_id TEXT,
      state TEXT DEFAULT 'offer_sent',
      attributes TEXT, -- JSON string
      issuer TEXT,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS uploaded_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      credential_id TEXT,
      file_name TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      file_content TEXT, -- Base64 or text content
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS token_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_token TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON credentials(user_id);
    CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
    CREATE INDEX IF NOT EXISTS idx_proof_requests_user_id ON proof_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_credential_offers_user_id ON credential_offers(user_id);
    CREATE INDEX IF NOT EXISTS idx_token_mappings_token ON token_mappings(api_token);
    CREATE INDEX IF NOT EXISTS idx_token_mappings_username ON token_mappings(username);
  `);

  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

