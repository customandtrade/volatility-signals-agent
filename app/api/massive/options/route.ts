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

    console.log('🚀 ==========================================');
    console.log('🚀 TESTING MASSIVE OPTIONS API');
    console.log('🚀 Symbol:', symbol);
    console.log('🚀 ==========================================');

    // For AAPL, use snapshot endpoint which is available
    // For other symbols, warn but try anyway
    if (symbol !== 'AAPL') {
      console.warn(`⚠️ Trial plan may only have access to AAPL. Trying ${symbol} anyway...`);
    } else {
      console.log('✅ Using snapshot endpoint for AAPL (available in trial plan)');
    }

    const result = await massive.getOptionsContracts(symbol);
    
    console.log('📊 ==========================================');
    console.log('📊 MASSIVE OPTIONS RESPONSE');
    console.log('📊 ==========================================');
    console.log('Status:', result?.status);
    console.log('Request ID:', result?.request_id);
    console.log('Results count:', Array.isArray(result?.results) ? result.results.length : 0);
    
    if (Array.isArray(result?.results) && result.results.length > 0) {
      console.log('\n📋 First 3 contracts:');
      result.results.slice(0, 3).forEach((contract: any, index: number) => {
        console.log(`\n--- Contract ${index + 1} ---`);
        console.log('Ticker:', contract?.ticker);
        console.log('Details:', {
          strike: contract?.details?.strike_price,
          expiration: contract?.details?.expiration_date,
          contractType: contract?.details?.contract_type,
        });
        console.log('Implied Volatility:', contract?.implied_volatility);
        console.log('Open Interest:', contract?.open_interest);
        console.log('Last Quote:', contract?.last_quote);
        console.log('Last Trade:', contract?.last_trade);
        console.log('Greeks:', contract?.greeks);
      });
    }
    
    console.log('\n📊 ==========================================');
    console.log('📊 Full response (first 5000 chars):');
    console.log('📊 ==========================================');
    const responseStr = JSON.stringify(result, null, 2);
    console.log(responseStr.substring(0, 5000));
    if (responseStr.length > 5000) {
      console.log(`\n... (truncated, total length: ${responseStr.length} chars)`);
    }
    console.log('\n✅ ==========================================');

    return NextResponse.json({ status: 'OK', data: result });
  } catch (err: any) {
    console.error('❌ ==========================================');
    console.error('❌ MASSIVE OPTIONS ERROR');
    console.error('❌ ==========================================');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('❌ ==========================================');
    
    // Check if it's a 403 authorization error
    const symbolParam = request.nextUrl.searchParams.get('symbol') || 'unknown';
    if (err.message?.includes('403') || err.message?.includes('NOT_AUTHORIZED')) {
      return NextResponse.json({ 
        error: 'Not authorized for this symbol',
        message: `Your plan may not have access to ${symbolParam} options. Try AAPL instead.`,
        hint: 'Trial plans typically only have access to AAPL options',
      }, { status: 403 });
    }
    
    return NextResponse.json({ error: err.message || 'Failed to fetch options data' }, { status: 500 });
  }
}
