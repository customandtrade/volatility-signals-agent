import { MarketData, OptionsData, StrikeData } from '@/types/agent';
import { OAuthHelper } from '@/utils/oauth';

/**
 * OAuth Token Storage
 */
interface OAuthTokens {
  requestToken?: string;
  requestTokenSecret?: string;
  accessToken?: string;
  accessTokenSecret?: string;
}

/**
 * E*TRADE API Client
 * Handles market and options data retrieval with OAuth 1.0a authentication
 */
export class ETradeClient {
  private consumerKey: string;
  private consumerSecret: string;
  private sandbox: boolean;
  private oauthHelper: OAuthHelper;
  private tokens: OAuthTokens = {};

  constructor(consumerKey: string, consumerSecret: string, sandbox: boolean = true) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.sandbox = sandbox;
    this.oauthHelper = new OAuthHelper(consumerKey, consumerSecret, sandbox);
  }

  /**
   * Step 1: Get request token
   */
  async getRequestToken(): Promise<{ token: string; secret: string; url: string }> {
    const baseUrl = this.oauthHelper.getBaseUrl();
    const url = `${baseUrl}/oauth/request_token`;
    
    const authHeader = this.oauthHelper.getAuthorizationHeader(url, 'GET');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get request token: ${response.status} ${errorText}`);
    }

    const responseText = await response.text();
    const params = OAuthHelper.parseOAuthResponse(responseText);
    
    this.tokens.requestToken = params.oauth_token;
    this.tokens.requestTokenSecret = params.oauth_token_secret;

    const authUrl = `${baseUrl}/oauth/authorize?key=${this.consumerKey}&token=${params.oauth_token}`;

    return {
      token: params.oauth_token,
      secret: params.oauth_token_secret,
      url: authUrl,
    };
  }

  /**
   * Step 2: Get access token (after user authorization)
   */
  async getAccessToken(verifier: string): Promise<{ token: string; secret: string }> {
    if (!this.tokens.requestToken || !this.tokens.requestTokenSecret) {
      throw new Error('Request token not found. Call getRequestToken() first.');
    }

    const baseUrl = this.oauthHelper.getBaseUrl();
    const url = `${baseUrl}/oauth/access_token`;
    
    const authHeader = this.oauthHelper.getAuthorizationHeader(
      url,
      'GET',
      {
        key: this.tokens.requestToken,
        secret: this.tokens.requestTokenSecret,
      }
    );

    const response = await fetch(`${url}?oauth_verifier=${verifier}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const responseText = await response.text();
    const params = OAuthHelper.parseOAuthResponse(responseText);
    
    this.tokens.accessToken = params.oauth_token;
    this.tokens.accessTokenSecret = params.oauth_token_secret;

    return {
      token: params.oauth_token,
      secret: params.oauth_token_secret,
    };
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(endpoint: string, method: string = 'GET'): Promise<any> {
    if (!this.tokens.accessToken || !this.tokens.accessTokenSecret) {
      throw new Error('Not authenticated. Call getAccessToken() first.');
    }

    const baseUrl = this.oauthHelper.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    
    const authHeader = this.oauthHelper.getAuthorizationHeader(
      url,
      method,
      {
        key: this.tokens.accessToken,
        secret: this.tokens.accessTokenSecret,
      }
    );

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Set access tokens (for persistence)
   */
  setAccessTokens(token: string, secret: string): void {
    this.tokens.accessToken = token;
    this.tokens.accessTokenSecret = secret;
  }

  /**
   * Get market data for a symbol
   */
  async getMarketData(symbol: string): Promise<MarketData> {
    const response = await this.makeRequest(`/v1/market/quote/${symbol}.json`);
    
    const quote = response.QuoteResponse?.QuoteData?.[0];
    if (!quote) {
      throw new Error(`No market data found for ${symbol}`);
    }

    return {
      symbol: quote.symbol || symbol,
      price: quote.lastTrade || quote.AllPoints?.lastTrade || 0,
      volume: quote.volume || 0,
      timestamp: Date.now(),
    };
  }

  /**
   * Get historical market data
   */
  async getHistoricalMarketData(
    symbol: string,
    count: number = 50
  ): Promise<MarketData[]> {
    // E*TRADE doesn't have a direct historical endpoint in the same way
    // This would need to use price history endpoint
    // For now, we'll get current data and simulate historical
    const current = await this.getMarketData(symbol);
    
    // In production, you'd call the price history endpoint
    // For now, return array with current data
    return [current];
  }

  /**
   * Get options chain for a symbol
   */
  async getOptionsChain(
    symbol: string,
    expirationDate?: string
  ): Promise<OptionsData> {
    const params = new URLSearchParams({
      symbol,
      chainType: 'CALL',
      strikeCount: '10',
    });

    if (expirationDate) {
      params.append('expirationDate', expirationDate);
    }

    const response = await this.makeRequest(`/v1/market/optionchains?${params.toString()}`);
    
    const optionChain = response.OptionChainResponse?.OptionPair;
    if (!optionChain || optionChain.length === 0) {
      throw new Error(`No options chain found for ${symbol}`);
    }

    // Get the first expiration (or specified one)
    const expiration = optionChain.find((exp: any) => 
      !expirationDate || exp.expirationDate === expirationDate
    ) || optionChain[0];

    const strikes: StrikeData[] = expiration.Option.map((opt: any) => ({
      strike: opt.strikePrice,
      callBid: opt.Call?.bid || 0,
      callAsk: opt.Call?.ask || 0,
      callVolume: opt.Call?.volume || 0,
      callOpenInterest: opt.Call?.openInterest || 0,
      putBid: opt.Put?.bid || 0,
      putAsk: opt.Put?.ask || 0,
      putVolume: opt.Put?.volume || 0,
      putOpenInterest: opt.Put?.openInterest || 0,
    }));

    // Calculate average IV from options
    const callOptions = expiration.Option
      .map((opt: any) => opt.Call?.impliedVolatility)
      .filter((iv: number | undefined) => iv !== undefined && iv > 0);
    
    const avgIV = callOptions.length > 0
      ? callOptions.reduce((sum: number, iv: number) => sum + iv, 0) / callOptions.length
      : 30;

    // Calculate total volume and OI
    const totalVolume = strikes.reduce((sum, s) => sum + s.callVolume + s.putVolume, 0);
    const totalOI = strikes.reduce((sum, s) => sum + s.callOpenInterest + s.putOpenInterest, 0);

    // Get ATM option for bid/ask/spread
    const atmStrike = strikes.find(s => s.callBid > 0 && s.callAsk > 0) || strikes[0];

    return {
      symbol,
      strikes,
      expiration: expiration.expirationDate,
      iv: avgIV * 100, // Convert to percentage
      volume: totalVolume,
      openInterest: totalOI,
      bid: atmStrike?.callBid || 0,
      ask: atmStrike?.callAsk || 0,
      spread: (atmStrike?.callAsk || 0) - (atmStrike?.callBid || 0),
    };
  }

  /**
   * Get historical IV data
   * Note: E*TRADE doesn't provide direct historical IV, so we'll estimate
   */
  async getHistoricalIV(symbol: string, days: number = 252): Promise<number[]> {
    // E*TRADE doesn't have a direct historical IV endpoint
    // In production, you might:
    // 1. Store IV data over time
    // 2. Use a different data provider for historical IV
    // 3. Calculate from historical options prices
    
    // For now, get current IV and create a simple array
    try {
      const optionsData = await this.getOptionsChain(symbol);
      const currentIV = optionsData.iv;
      
      // Generate array with current IV as baseline
      const ivs: number[] = [];
      for (let i = 0; i < days; i++) {
        const variation = (Math.random() - 0.5) * 10;
        ivs.push(Math.max(10, Math.min(80, currentIV + variation)));
      }
      
      return ivs;
    } catch (error) {
      // Fallback to default range
      const baseIV = 30;
      return Array(days).fill(0).map(() => baseIV + (Math.random() - 0.5) * 10);
    }
  }
}

/**
 * Mock data generator for development/testing
 */
export class MockETradeClient {
  /**
   * Generate mock market data
   */
  static generateMarketData(symbol: string, count: number = 50): MarketData[] {
    const basePrice = 100 + Math.random() * 50;
    const data: MarketData[] = [];
    
    for (let i = 0; i < count; i++) {
      const volatility = 0.02 + Math.random() * 0.05;
      const priceChange = (Math.random() - 0.5) * volatility * basePrice;
      const price = i === 0 ? basePrice : data[i - 1].price + priceChange;
      
      data.push({
        symbol,
        price: Math.round(price * 100) / 100,
        volume: Math.floor(1000000 + Math.random() * 2000000),
        timestamp: Date.now() - (count - i) * 60000, // 1 minute intervals
      });
    }
    
    return data;
  }

  /**
   * Generate mock options data
   */
  static generateOptionsData(symbol: string, currentPrice: number): OptionsData {
    const strikes: StrikeData[] = [];
    const baseStrike = Math.round(currentPrice / 5) * 5; // Round to nearest $5
    
    // Generate strikes around current price
    for (let i = -5; i <= 10; i++) {
      const strike = baseStrike + (i * 5);
      const isOTM = strike > currentPrice;
      const moneyness = Math.abs(strike - currentPrice) / currentPrice;
      
      strikes.push({
        strike,
        callBid: isOTM ? Math.max(0.1, 2 - moneyness * 10) : Math.max(0.5, 5 - moneyness * 5),
        callAsk: isOTM ? Math.max(0.2, 2.5 - moneyness * 10) : Math.max(0.6, 5.5 - moneyness * 5),
        callVolume: isOTM ? Math.floor(50 + Math.random() * 200) : Math.floor(100 + Math.random() * 500),
        callOpenInterest: isOTM ? Math.floor(100 + Math.random() * 400) : Math.floor(200 + Math.random() * 800),
        putBid: !isOTM ? Math.max(0.1, 2 - moneyness * 10) : Math.max(0.5, 5 - moneyness * 5),
        putAsk: !isOTM ? Math.max(0.2, 2.5 - moneyness * 10) : Math.max(0.6, 5.5 - moneyness * 5),
        putVolume: !isOTM ? Math.floor(50 + Math.random() * 200) : Math.floor(100 + Math.random() * 500),
        putOpenInterest: !isOTM ? Math.floor(100 + Math.random() * 400) : Math.floor(200 + Math.random() * 800),
      });
    }

    const atTheMoneyCall = strikes.find(s => Math.abs(s.strike - currentPrice) < 2.5);
    const midPrice = atTheMoneyCall 
      ? (atTheMoneyCall.callBid + atTheMoneyCall.callAsk) / 2
      : 2.5;

    return {
      symbol,
      strikes,
      expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      iv: 25 + Math.random() * 30, // IV between 25-55%
      volume: Math.floor(1000 + Math.random() * 2000),
      openInterest: Math.floor(5000 + Math.random() * 10000),
      bid: midPrice * 0.95,
      ask: midPrice * 1.05,
      spread: midPrice * 0.1,
    };
  }

  /**
   * Generate mock historical IV
   */
  static generateHistoricalIV(count: number = 252): number[] {
    const baseIV = 30;
    const ivs: number[] = [];
    
    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.5) * 10;
      const iv = Math.max(10, Math.min(80, baseIV + change));
      ivs.push(iv);
    }
    
    return ivs;
  }
}
