import { NextRequest, NextResponse } from 'next/server';
import massive from '@/services/massive';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const days = parseInt(searchParams.get('days') || '252');

    if (!symbol) {
      return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 });
    }

    // Historical IV endpoint doesn't exist in Massive API
    // IV is extracted from options contracts instead
    console.log('⚠️ Historical IV endpoint not available. IV should be extracted from options contracts.');
    return NextResponse.json({ 
      status: 'OK', 
      data: [],
      message: 'Historical IV endpoint not available in Massive API. Extract IV from options contracts instead.',
    });
  } catch (err: any) {
    console.error('Massive iv error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch IV data' }, { status: 500 });
  }
}
