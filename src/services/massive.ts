const BASE_URL = 'https://api.massive.com/v3';

interface CacheEntry {
  expires: number;
  data: any;
}

const cache = new Map<string, CacheEntry>();

export const MassiveConfig = {
  baseUrl: BASE_URL,
  defaults: {
    callTtlSeconds: 15,
    marketTtlSeconds: 8,
    optionsTtlSeconds: 30,
    ivTtlSeconds: 60,
    retries: 2,
    baseDelayMs: 100, // for exponential backoff
  },
  candidates: {
    market: ['/v1/quotes', '/v2/quotes', '/quotes', '/stocks/quotes', '/market/quotes', '/v1/market/quotes'],
    // Use the correct endpoint for Option Chain Snapshot: /v3/snapshot/options/{underlyingAsset}
    options: ['/snapshot/options'], // Will be used as /v3/snapshot/options/{symbol}
    iv: ['/v1/options/iv', '/options/iv', '/v1/volatility/iv', '/volatility/iv'],
  },
};

function getApiKey() {
  return process.env.MASSIVE_API_KEY || '';
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(`${MassiveConfig.baseUrl}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callRest(path: string, params?: Record<string, string | number | undefined>, ttlSeconds = MassiveConfig.defaults.callTtlSeconds, retries = MassiveConfig.defaults.retries, baseDelayMs = MassiveConfig.defaults.baseDelayMs) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('MASSIVE_API_KEY not configured on the server');
  }

  const url = buildUrl(path, params);
  const cacheKey = `${url}`;
  const now = Date.now();

  const cached = cache.get(cacheKey);
  if (cached && cached.expires > now) {
    return cached.data;
  }

  let attempt = 0;
  let lastError: any = null;
  const start = Date.now();

  while (attempt <= retries) {
    try {
      console.error('Massive request URL:', url, 'attempt:', attempt + 1);
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      });

      const duration = Date.now() - start;
      console.error('Massive request duration (ms):', duration);

      if (!res.ok) {
        const text = await res.text();
        console.error('Massive response status:', res.status, 'body:', text);
        throw new Error(`Massive API error ${res.status} ${res.statusText} at ${url}: ${text}`);
      }

      const json = await res.json();
      cache.set(cacheKey, { data: json, expires: now + ttlSeconds * 1000 });
      return json;
    } catch (err: any) {
      console.error('Massive call error on attempt', attempt + 1, err?.message || err);
      lastError = err;
      if (attempt === retries) break;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await sleep(delay);
      attempt++;
    }
  }

  throw lastError;
}

export async function tryCandidates(paths: string[], params?: Record<string, string | number | undefined>, ttlSeconds = MassiveConfig.defaults.callTtlSeconds) {
  const startAll = Date.now();
  let lastError: any = null;
  for (const p of paths) {
    try {
      console.error('Trying Massive path:', p, 'with params:', params);
      const res = await callRest(p, params, ttlSeconds);
      console.error('Successful Massive path:', p);
      const duration = Date.now() - startAll;
      console.error('Total tryCandidates duration (ms):', duration);
      return res;
    } catch (err: any) {
      console.error('Candidate failed:', p, err?.message || err);
      lastError = err;
    }
  }
  throw new Error(`No Massive endpoints succeeded; last error: ${lastError?.message || lastError}`);
}

/**
 * Get market quotes for a symbol
 * Since the trial plan only has options access, we'll try unified snapshot first,
 * then fall back to extracting underlying asset price from options data
 */
export async function getMarketQuotes(symbol: string) {
  // First, try unified snapshot endpoint (might work for stocks)
  try {
    const snapshotPath = `/snapshot?ticker=${symbol}&type=stocks`;
    console.log('🔍 Trying unified snapshot for market data:', snapshotPath);
    const result = await callRest(snapshotPath, undefined, MassiveConfig.defaults.marketTtlSeconds);
    
    // Check if we got valid stock data
    if (result?.results && Array.isArray(result.results) && result.results.length > 0) {
      const stockData = result.results.find((r: any) => r.type === 'stocks' || !r.type);
      if (stockData) {
        console.log('✅ Got market data from unified snapshot');
        return result;
      }
    }
  } catch (err: any) {
    console.log('⚠️ Unified snapshot failed, will extract from options:', err.message);
  }

  // Fallback: Get underlying asset price from options chain
  // The options endpoint includes underlying_asset data
  try {
    console.log('🔍 Extracting underlying price from options chain...');
    const optionsPath = `/snapshot/options/${symbol}`;
    const optionsResult = await callRest(optionsPath, undefined, MassiveConfig.defaults.marketTtlSeconds);
    
    // Extract underlying asset data from first contract
    if (optionsResult?.results && Array.isArray(optionsResult.results) && optionsResult.results.length > 0) {
      const firstContract = optionsResult.results[0];
      const underlying = firstContract?.underlying_asset;
      
      if (underlying) {
        console.log('✅ Extracted underlying price from options:', underlying.last_trade?.price);
        // Return in a format similar to market quotes
        return {
          results: [{
            ticker: symbol,
            type: 'stocks',
            last_trade: underlying.last_trade,
            session: underlying.session,
            // Create a market-like response
            price: underlying.last_trade?.price || underlying.session?.close || 0,
            volume: underlying.session?.volume || 0,
            timestamp: Date.now(),
          }],
          status: 'ok',
        };
      }
    }
  } catch (err: any) {
    console.error('❌ Failed to extract underlying from options:', err.message);
  }

  // If all else fails, throw an error (will be caught and fallback to mock)
  throw new Error('No market data endpoints available. Your plan may only include options access.');
}

export async function getOptionsContracts(symbol: string) {
  // Use the correct endpoint: /v3/snapshot/options/{underlyingAsset}
  // This endpoint works for AAPL in trial plan
  const path = `/snapshot/options/${symbol}`;
  console.log('🔍 Fetching options chain from Massive snapshot:', path);
  console.log('📋 This endpoint is available for AAPL in trial plan');
  const result = await callRest(path, undefined, MassiveConfig.defaults.optionsTtlSeconds);
  console.log('✅ Massive options snapshot response received');
  console.log('   Status:', result?.status);
  console.log('   Contracts:', Array.isArray(result?.results) ? result.results.length : 'N/A');
  return result;
}

/**
 * Get historical IV - NOT AVAILABLE in Massive API
 * Instead, we extract IV from options contracts
 * This function is kept for compatibility but will always return empty array
 */
export async function getHistoricalIV(symbol: string, days = 252) {
  console.warn('⚠️ Historical IV endpoint not available in Massive API. IV will be extracted from options contracts.');
  // Historical IV endpoint doesn't exist in Massive API
  // IV is available in each options contract's implied_volatility field
  return [];
}

export function _clearMassiveCache() {
  cache.clear();
}

/**
 * Get ticker reference data
 * Uses /v3/reference/tickers/{ticker}
 */
export async function getTickerReference(symbol: string) {
  const path = `/reference/tickers/${symbol}`;
  console.log('🔍 Fetching ticker reference:', path);
  const result = await callRest(path, undefined, 60);
  return result;
}

/**
 * Get options contracts from reference endpoint
 * Uses /v3/reference/options/contracts?underlying_ticker={symbol}
 */
export async function getOptionsContractsReference(symbol: string) {
  const path = `/reference/options/contracts`;
  const params = { underlying_ticker: symbol };
  console.log('🔍 Fetching options contracts from reference:', path, params);
  const result = await callRest(path, params, 60);
  return result;
}

export default {
  callRest,
  getMarketQuotes,
  getOptionsContracts,
  getHistoricalIV,
  getTickerReference,
  getOptionsContractsReference,
  MassiveConfig,
  _clearMassiveCache,
};
