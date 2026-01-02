import { NextRequest, NextResponse } from 'next/server';
import massive from '@/services/massive';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 });
    }

    console.log('📈 Fetching market data for:', symbol);
    const result = await massive.getMarketQuotes(symbol);
    
    console.log('✅ Market data received:', {
      hasResults: !!result?.results,
      resultsCount: Array.isArray(result?.results) ? result.results.length : 0,
    });
    
    return NextResponse.json({ status: 'OK', data: result });
  } catch (err: any) {
    console.error('⚠️ Massive market error (will use fallback):', err.message);
    // Return a graceful error that allows fallback to mock data
    return NextResponse.json({ 
      error: err.message || 'Failed to fetch market data',
      fallback: true,
      message: 'Market data endpoint not available. Using underlying price from options or mock data.'
    }, { status: 200 }); // Return 200 so the client can handle fallback gracefully
  }
}
