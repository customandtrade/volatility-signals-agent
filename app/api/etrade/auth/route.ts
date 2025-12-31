import { NextRequest, NextResponse } from 'next/server';
import { ETradeClient } from '@/services/etrade';
import fs from 'fs';
import path from 'path';

/**
 * Load E*TRADE credentials from etrade.env file
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
 * GET /api/etrade/auth - Get request token and authorization URL
 */
export async function GET(request: NextRequest) {
  try {
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
      true // sandbox mode
    );

    const requestToken = await client.getRequestToken();
    
    return NextResponse.json({
      requestToken: requestToken.token,
      requestTokenSecret: requestToken.secret,
      authUrl: requestToken.url,
    });
  } catch (error: any) {
    console.error('E*TRADE auth error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/etrade/auth - Exchange verifier for access token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { verifier, requestToken, requestTokenSecret } = body;

    if (!verifier || !requestToken || !requestTokenSecret) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
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

    // Set request tokens
    (client as any).tokens = {
      requestToken,
      requestTokenSecret,
    };

    const accessToken = await client.getAccessToken(verifier);
    
    return NextResponse.json({
      accessToken: accessToken.token,
      accessTokenSecret: accessToken.secret,
    });
  } catch (error: any) {
    console.error('E*TRADE token exchange error:', error);
    return NextResponse.json(
      { error: error.message || 'Token exchange failed' },
      { status: 500 }
    );
  }
}


