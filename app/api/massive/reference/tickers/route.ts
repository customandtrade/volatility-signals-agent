import { NextRequest, NextResponse } from 'next/server';
import massive from '@/services/massive';

export const dynamic = 'force-dynamic';

/**
 * Get ticker information from Massive reference endpoint
 * GET /v3/reference/tickers/{ticker}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol') || searchParams.get('ticker');

    if (!symbol) {
      return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 });
    }

    console.log('📊 Fetching ticker reference for:', symbol);
    
    // Use reference endpoint: /v3/reference/tickers/{ticker}
    const path = `/reference/tickers/${symbol}`;
    const result = await massive.callRest(path, undefined, 60); // Cache for 60 seconds
    
    console.log('✅ Ticker reference received:', {
      status: result?.status,
      hasResults: !!result?.results,
    });

    return NextResponse.json({ status: 'OK', data: result });
  } catch (err: any) {
    console.error('❌ Ticker reference error:', err.message);
    
    if (err.message?.includes('403') || err.message?.includes('NOT_AUTHORIZED')) {
      return NextResponse.json({ 
        error: 'Not authorized',
        message: 'Reference endpoint may not be available for this symbol',
      }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: err.message || 'Failed to fetch ticker reference' 
    }, { status: 500 });
  }
}

