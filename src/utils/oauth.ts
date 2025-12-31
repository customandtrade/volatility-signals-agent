import crypto from 'crypto';

/**
 * OAuth 1.0a Helper for E*TRADE
 * Manual implementation of OAuth 1.0a signing
 */
export class OAuthHelper {
  private consumerKey: string;
  private consumerSecret: string;
  private baseUrl: string;

  constructor(consumerKey: string, consumerSecret: string, sandbox: boolean = true) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.baseUrl = sandbox 
      ? 'https://apisb.etrade.com'
      : 'https://api.etrade.com';
  }

  /**
   * Generate OAuth signature for request
   */
  getAuthorizationHeader(
    url: string,
    method: string,
    token?: { key: string; secret: string }
  ): string {
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: this.consumerKey,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_version: '1.0',
    };

    if (token) {
      oauthParams.oauth_token = token.key;
    }

    // Create parameter string
    const params = new URLSearchParams(oauthParams);
    const paramString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    // Create signature base string
    const baseString = [
      method.toUpperCase(),
      encodeURIComponent(url.split('?')[0]),
      encodeURIComponent(paramString),
    ].join('&');

    // Create signing key
    const signingKey = `${encodeURIComponent(this.consumerSecret)}&${token ? encodeURIComponent(token.secret) : ''}`;

    // Generate signature
    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(baseString)
      .digest('base64');

    // Add signature to params
    oauthParams.oauth_signature = signature;

    // Build authorization header
    const authParams = Object.entries(oauthParams)
      .map(([key, value]) => `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`)
      .join(', ');

    return `OAuth ${authParams}`;
  }

  /**
   * Parse OAuth response
   */
  static parseOAuthResponse(response: string): Record<string, string> {
    const params: Record<string, string> = {};
    const pairs = response.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
    
    return params;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

