import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/database';
import { getUserByToken } from '@/lib/db/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = getUserByToken(token);
    
    if (!user) {
      // If user not in local DB, try to get from API and create
      // For now, return empty stats
      return NextResponse.json({
        credentialsIssued: 0,
        activeConnections: 0,
        pendingOffers: 0,
      });
    }

    const userId = user.id;
    const db = getDatabase();

    // Get real stats
    const credentialsCount = db
      .prepare('SELECT COUNT(*) as count FROM credentials WHERE user_id = ?')
      .get(userId) as { count: number };

    const connectionsCount = db
      .prepare('SELECT COUNT(*) as count FROM connections WHERE user_id = ? AND state = ?')
      .get(userId, 'active') as { count: number };

    const offersCount = db
      .prepare('SELECT COUNT(*) as count FROM credential_offers WHERE user_id = ? AND state = ?')
      .get(userId, 'offer_sent') as { count: number };

    return NextResponse.json({
      credentialsIssued: credentialsCount.count,
      activeConnections: connectionsCount.count,
      pendingOffers: offersCount.count,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

