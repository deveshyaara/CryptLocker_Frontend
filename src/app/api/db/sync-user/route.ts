import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByUsername, mapTokenToUser } from '@/lib/db/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const body = await request.json();
    const { username, email, full_name, role, user_id } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Check if user already exists
    let user = getUserByUsername(username);
    
    if (!user) {
      // Create user in local database (without password - it's in backend)
      const db = (await import('@/lib/db/database')).getDatabase();
      const result = db
        .prepare(
          'INSERT INTO users (username, email, full_name, role, password_hash) VALUES (?, ?, ?, ?, ?)'
        )
        .run(
          username,
          email || '',
          full_name || null,
          role || 'holder',
          'synced_from_api' // Placeholder - password is in backend
        );

      const newUser = db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(result.lastInsertRowid) as typeof user;
      
      if (!newUser) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      
      user = newUser;
    }

    // Map API token to local user
    mapTokenToUser(token, username, user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}

