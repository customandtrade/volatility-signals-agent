import { NextRequest, NextResponse } from 'next/server';
import { ETradeClient } from '@/services/etrade';
import fs from 'fs';
import path from 'path';

/**
 * Load E*TRADE credentials
 */
function loadCredentials(): { key: string; secret: string } | null {
  try {
    const envPath = path.join(process.cwd(), 'src', 'services', 'etrade.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    const lines = envContent.split('\n');
    let key = '';
    let secret = '';
    
    for (const line of lines) {
      if (line.startsWith('ETRADE_CONSUMER_KEY=')) {
        key = line.split('=')[1].trim();
      } else if (line.startsWith('ETRADE_CONSUMER_SECRET=')) {
        secret = line.split('=')[1].trim();
      }
    }
    
    if (key && secret) {
      return { key, secret };
    }
  } catch (error) {
    console.error('Error loading credentials:', error);
  }
  
  return null;
}

/**
 * GET /api/etrade/market - Get market data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const accessToken = searchParams.get('accessToken');
    const accessTokenSecret = searchParams.get('accessTokenSecret');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    if (!accessToken || !accessTokenSecret) {
      return NextResponse.json(
        { error: 'Access tokens are required' },
        { status: 401 }
      );
    }

    const credentials = loadCredentials();
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'E*TRADE credentials not found' },
        { status: 500 }
      );
    }

    const client = new ETradeClient(
      credentials.key,
      credentials.secret,
      true
    );

    client.setAccessTokens(accessToken, accessTokenSecret);

    const marketData = await client.getMarketData(symbol);
    const historicalData = await client.getHistoricalMarketData(symbol, 50);
    
    return NextResponse.json({
      current: marketData,
      historical: historicalData,
    });
  } catch (error: any) {
    console.error('E*TRADE market data error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}


