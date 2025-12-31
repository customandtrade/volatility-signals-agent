import { NextRequest, NextResponse } from 'next/server';
import { ETradeClient } from '@/services/etrade';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

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
 * GET /api/etrade/options - Get options chain
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const expirationDate = searchParams.get('expirationDate') || undefined;
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

    const optionsData = await client.getOptionsChain(symbol, expirationDate);
    
    return NextResponse.json(optionsData);
  } catch (error: any) {
    console.error('E*TRADE options error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch options data' },
      { status: 500 }
    );
  }
}


