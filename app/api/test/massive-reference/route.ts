import { NextRequest, NextResponse } from 'next/server';
import massive from '@/services/massive';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint for Massive reference endpoints
 * Usage: GET /api/test/massive-reference?symbol=AAPL
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol') || 'AAPL';

    console.log('\n');
    console.log('🧪 ==========================================');
    console.log('🧪 MASSIVE REFERENCE ENDPOINTS TEST');
    console.log('🧪 ==========================================');
    console.log('Symbol:', symbol);
    console.log('Timestamp:', new Date().toISOString());
    console.log('🧪 ==========================================\n');

    const results: any = {
      symbol,
      tickerReference: null,
      optionsReference: null,
    };

    // Test ticker reference endpoint
    console.log('📊 Testing /v3/reference/tickers/{ticker}...');
    try {
      const tickerResult = await massive.getTickerReference(symbol);
      results.tickerReference = {
        success: true,
        status: tickerResult?.status,
        requestId: tickerResult?.request_id,
        data: tickerResult,
      };
      console.log('✅ Ticker reference successful');
      console.log('   Status:', tickerResult?.status);
      console.log('   Results:', Array.isArray(tickerResult?.results) ? tickerResult.results.length : 'N/A');
    } catch (err: any) {
      results.tickerReference = {
        success: false,
        error: err.message,
      };
      console.error('❌ Ticker reference failed:', err.message);
    }

    // Test options reference endpoint
    console.log('\n📊 Testing /v3/reference/options/contracts?underlying_ticker={symbol}...');
    try {
      const optionsResult = await massive.getOptionsContractsReference(symbol);
      results.optionsReference = {
        success: true,
        status: optionsResult?.status,
        requestId: optionsResult?.request_id,
        resultsCount: Array.isArray(optionsResult?.results) ? optionsResult.results.length : 0,
        data: optionsResult,
      };
      console.log('✅ Options reference successful');
      console.log('   Status:', optionsResult?.status);
      console.log('   Contracts:', Array.isArray(optionsResult?.results) ? optionsResult.results.length : 0);
      
      if (Array.isArray(optionsResult?.results) && optionsResult.results.length > 0) {
        console.log('\n   Sample contracts (first 5):');
        optionsResult.results.slice(0, 5).forEach((contract: any, index: number) => {
          console.log(`\n     Contract ${index + 1}:`);
          console.log('       Ticker:', contract?.ticker);
          console.log('       Underlying:', contract?.underlying_ticker);
          console.log('       Strike:', contract?.strike_price);
          console.log('       Expiration:', contract?.expiration_date);
          console.log('       Type:', contract?.contract_type);
        });
      }
    } catch (err: any) {
      results.optionsReference = {
        success: false,
        error: err.message,
      };
      console.error('❌ Options reference failed:', err.message);
    }

    console.log('\n✅ ==========================================');
    console.log('✅ TEST COMPLETED');
    console.log('✅ ==========================================\n');

    return NextResponse.json({
      success: true,
      symbol,
      results,
      summary: {
        tickerReferenceAvailable: results.tickerReference?.success || false,
        optionsReferenceAvailable: results.optionsReference?.success || false,
      },
    });

  } catch (err: any) {
    console.error('\n❌ ==========================================');
    console.error('❌ TEST FAILED');
    console.error('❌ ==========================================');
    console.error('Error:', err.message);
    console.error('❌ ==========================================\n');

    return NextResponse.json({ 
      success: false,
      error: err.message,
    }, { status: 500 });
  }
}

