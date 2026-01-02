import { NextRequest, NextResponse } from 'next/server';
import massive from '@/services/massive';
import { mapMassiveOptionsToOptionsData } from '@/services/massive-mapper';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint to fetch and display Massive options data
 * Usage: GET /api/test/massive-options?symbol=AAPL
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // Default to AAPL since trial plan only has access to AAPL options
    const symbol = searchParams.get('symbol') || 'AAPL';
    
    // Warn if trying to access a symbol that might not be available
    if (symbol !== 'AAPL') {
      console.warn('⚠️ WARNING: Trial plan may only have access to AAPL. Trying', symbol, 'anyway...');
    }

    console.log('\n');
    console.log('🧪 ==========================================');
    console.log('🧪 MASSIVE OPTIONS API TEST');
    console.log('🧪 ==========================================');
    console.log('Symbol:', symbol);
    console.log('Timestamp:', new Date().toISOString());
    console.log('🧪 ==========================================\n');

    // Check if API key is configured
    const apiKey = process.env.MASSIVE_API_KEY;
    if (!apiKey) {
      console.error('❌ MASSIVE_API_KEY not configured in environment variables');
      return NextResponse.json({ 
        error: 'MASSIVE_API_KEY not configured',
        hint: 'Add MASSIVE_API_KEY to your .env.local file'
      }, { status: 500 });
    }
    console.log('✅ API Key configured (length:', apiKey.length, 'chars)');

    // Fetch options data from Massive
    console.log('\n📡 Fetching options chain from Massive API...');
    const startTime = Date.now();
    
    const massiveResponse = await massive.getOptionsContracts(symbol);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Received response in ${duration}ms`);

    // Display raw response summary
    console.log('\n📊 ==========================================');
    console.log('📊 RAW MASSIVE RESPONSE SUMMARY');
    console.log('📊 ==========================================');
    console.log('Status:', massiveResponse?.status);
    console.log('Request ID:', massiveResponse?.request_id);
    console.log('Results count:', Array.isArray(massiveResponse?.results) ? massiveResponse.results.length : 'N/A');
    
    if (Array.isArray(massiveResponse?.results)) {
      console.log('\n📋 Sample contracts (first 5):');
      massiveResponse.results.slice(0, 5).forEach((contract: any, index: number) => {
        console.log(`\n  Contract ${index + 1}:`);
        console.log('    Ticker:', contract?.ticker || 'N/A');
        console.log('    Strike:', contract?.details?.strike_price || 'N/A');
        console.log('    Expiration:', contract?.details?.expiration_date || 'N/A');
        console.log('    Type:', contract?.details?.contract_type || 'N/A');
        console.log('    IV:', contract?.implied_volatility ? `${contract.implied_volatility.toFixed(2)}%` : 'N/A');
        console.log('    Open Interest:', contract?.open_interest || 'N/A');
        console.log('    Last Quote Bid:', contract?.last_quote?.bid || 'N/A');
        console.log('    Last Quote Ask:', contract?.last_quote?.ask || 'N/A');
        console.log('    Last Trade Price:', contract?.last_trade?.price || 'N/A');
        console.log('    Last Trade Size:', contract?.last_trade?.size || 'N/A');
      });

      // Group by expiration
      const expirationMap = new Map<string, number>();
      massiveResponse.results.forEach((contract: any) => {
        const exp = contract?.details?.expiration_date;
        if (exp) {
          expirationMap.set(exp, (expirationMap.get(exp) || 0) + 1);
        }
      });

      console.log('\n📅 Contracts by expiration:');
      Array.from(expirationMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([exp, count]) => {
          console.log(`  ${exp}: ${count} contracts`);
        });
    }

    // Test mapping
    console.log('\n🔄 ==========================================');
    console.log('🔄 TESTING DATA MAPPING');
    console.log('🔄 ==========================================');
    
    // Get current price from underlying asset if available
    const underlyingPrice = massiveResponse?.results?.[0]?.underlying_asset?.last_trade?.price || 150;
    console.log('Using underlying price:', underlyingPrice);

    const mappedData = mapMassiveOptionsToOptionsData(massiveResponse, symbol, underlyingPrice);
    
    console.log('\n✅ Mapped Options Data:');
    console.log('  Symbol:', mappedData.symbol);
    console.log('  Expiration:', mappedData.expiration);
    console.log('  Average IV:', mappedData.iv.toFixed(2) + '%');
    console.log('  Total Volume:', mappedData.volume);
    console.log('  Total Open Interest:', mappedData.openInterest);
    console.log('  Strikes count:', mappedData.strikes.length);
    
    if (mappedData.strikes.length > 0) {
      console.log('\n  Sample strikes (first 5):');
      mappedData.strikes.slice(0, 5).forEach((strike, index) => {
        console.log(`\n    Strike ${index + 1} ($${strike.strike}):`);
        console.log('      Call: Bid=$' + strike.callBid.toFixed(2), 'Ask=$' + strike.callAsk.toFixed(2), 
                    'Vol=' + strike.callVolume, 'OI=' + strike.callOpenInterest);
        console.log('      Put:  Bid=$' + strike.putBid.toFixed(2), 'Ask=$' + strike.putAsk.toFixed(2), 
                    'Vol=' + strike.putVolume, 'OI=' + strike.putOpenInterest);
      });
    }

    console.log('\n✅ ==========================================');
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('✅ ==========================================\n');

    return NextResponse.json({
      success: true,
      symbol,
      rawResponse: {
        status: massiveResponse?.status,
        requestId: massiveResponse?.request_id,
        contractsCount: Array.isArray(massiveResponse?.results) ? massiveResponse.results.length : 0,
      },
      mappedData: {
        symbol: mappedData.symbol,
        expiration: mappedData.expiration,
        iv: mappedData.iv,
        volume: mappedData.volume,
        openInterest: mappedData.openInterest,
        strikesCount: mappedData.strikes.length,
      },
      sampleContracts: Array.isArray(massiveResponse?.results) 
        ? massiveResponse.results.slice(0, 3).map((c: any) => ({
            ticker: c?.ticker,
            strike: c?.details?.strike_price,
            expiration: c?.details?.expiration_date,
            contractType: c?.details?.contract_type,
            iv: c?.implied_volatility,
            openInterest: c?.open_interest,
          }))
        : [],
      message: 'Check server console for detailed logs',
    });

  } catch (err: any) {
    console.error('\n❌ ==========================================');
    console.error('❌ TEST FAILED');
    console.error('❌ ==========================================');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('❌ ==========================================\n');

    return NextResponse.json({ 
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    }, { status: 500 });
  }
}

