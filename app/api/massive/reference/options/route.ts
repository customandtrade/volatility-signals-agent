import { NextRequest, NextResponse } from 'next/server';
import massive from '@/services/massive';

export const dynamic = 'force-dynamic';

/**
 * Get options contracts from Massive reference endpoint
 * GET /v3/reference/options/contracts?underlying_ticker={symbol}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol') || searchParams.get('underlying_ticker');

    if (!symbol) {
      return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 });
    }

    console.log('📊 ==========================================');
    console.log('📊 FETCHING OPTIONS FROM REFERENCE ENDPOINT');
    console.log('📊 Symbol:', symbol);
    console.log('📊 ==========================================');
    
    // Use reference endpoint: /v3/reference/options/contracts?underlying_ticker={symbol}
    const path = `/reference/options/contracts`;
    const params = { underlying_ticker: symbol };
    
    const result = await massive.callRest(path, params, 60); // Cache for 60 seconds
    
    console.log('✅ Options reference received:', {
      status: result?.status,
      resultsCount: Array.isArray(result?.results) ? result.results.length : 0,
      requestId: result?.request_id,
    });

    if (Array.isArray(result?.results) && result.results.length > 0) {
      console.log('\n📋 Sample contracts (first 3):');
      result.results.slice(0, 3).forEach((contract: any, index: number) => {
        console.log(`\n  Contract ${index + 1}:`);
        console.log('    Ticker:', contract?.ticker);
        console.log('    Underlying:', contract?.underlying_ticker);
        console.log('    Strike:', contract?.strike_price);
        console.log('    Expiration:', contract?.expiration_date);
        console.log('    Contract Type:', contract?.contract_type);
      });
    }

    return NextResponse.json({ status: 'OK', data: result });
  } catch (err: any) {
    console.error('❌ ==========================================');
    console.error('❌ OPTIONS REFERENCE ERROR');
    console.error('❌ ==========================================');
    console.error('Error:', err.message);
    console.error('❌ ==========================================');
    
    if (err.message?.includes('403') || err.message?.includes('NOT_AUTHORIZED')) {
      return NextResponse.json({ 
        error: 'Not authorized',
        message: `Reference endpoint may not be available for ${symbol}`,
        hint: 'Try using snapshot endpoint instead',
      }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: err.message || 'Failed to fetch options reference' 
    }, { status: 500 });
  }
}

