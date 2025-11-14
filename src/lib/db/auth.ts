import { getDatabase } from './database';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  did?: string;
  wallet_id?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export function getUserByToken(token: string): User | null {
  try {
    const db = getDatabase();
    
    // 1. Check token mappings table first
    const mapping = db
      .prepare('SELECT * FROM token_mappings WHERE api_token = ?')
      .get(token) as { username: string; user_id: number } | undefined;
    
    if (mapping) {
      const user = db
        .prepare('SELECT * FROM users WHERE username = ? AND is_active = 1')
        .get(mapping.username) as User | undefined;
      if (user) return user;
    }
    
    // 2. Try token as user ID (if numeric)
    const userId = parseInt(token);
    if (!isNaN(userId)) {
      const user = db
        .prepare('SELECT * FROM users WHERE id = ? AND is_active = 1')
        .get(userId) as User | undefined;
      if (user) return user;
    }
    
    // 3. Try to find by username (if token is username)
    const userByUsername = db
      .prepare('SELECT * FROM users WHERE username = ? AND is_active = 1')
      .get(token) as User | undefined;
    if (userByUsername) return userByUsername;
    
    return null;
  } catch (error) {
    console.error('Error getting user by token:', error);
    return null;
  }
}

export function mapTokenToUser(token: string, username: string, userId?: number): void {
  try {
    const db = getDatabase();
    db.prepare(
      'INSERT OR REPLACE INTO token_mappings (api_token, username, user_id) VALUES (?, ?, ?)'
    ).run(token, username, userId || null);
  } catch (error) {
    console.error('Error mapping token to user:', error);
  }
}

export function createUser(data: {
  username: string;
  email: string;
  password_hash: string;
  full_name?: string;
  role?: string;
}): User {
  const db = getDatabase();
  
  const result = db
    .prepare(
      'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)'
    )
    .run(
      data.username,
      data.email,
      data.password_hash,
      data.full_name || null,
      data.role || 'holder'
    );

  const user = db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(result.lastInsertRowid) as User;

  return user;
}

export function getUserByUsername(username: string): User | null {
  try {
    const db = getDatabase();
    const user = db
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(username) as User | undefined;
    
    return user || null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
}

