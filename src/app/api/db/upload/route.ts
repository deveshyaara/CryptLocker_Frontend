import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/database';
import { getUserByToken } from '@/lib/db/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const credentialId = formData.get('credentialId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const user = getUserByToken(token);
    
    if (!user) {
      // Create a temporary user entry if not exists (for testing)
      // In production, user should exist from registration
      return NextResponse.json({ 
        error: 'User not found. Please register first.',
        hint: 'Registration creates user in database'
      }, { status: 404 });
    }

    const userId = user.id;
    const db = getDatabase();

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileContent = buffer.toString('base64');

    // Save to database
    const result = db
      .prepare(
        'INSERT INTO uploaded_documents (user_id, credential_id, file_name, file_type, file_size, file_content) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(
        userId,
        credentialId || null,
        file.name,
        file.type,
        file.size,
        fileContent
      );

    return NextResponse.json({
      success: true,
      documentId: result.lastInsertRowid,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get('credentialId');

    const user = getUserByToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;
    const db = getDatabase();

    // Get documents
    let documents;
    if (credentialId) {
      documents = db
        .prepare('SELECT * FROM uploaded_documents WHERE user_id = ? AND credential_id = ?')
        .all(userId, credentialId);
    } else {
      documents = db
        .prepare('SELECT * FROM uploaded_documents WHERE user_id = ? ORDER BY created_at DESC')
        .all(userId);
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

