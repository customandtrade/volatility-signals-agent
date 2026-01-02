import { MarketData, OptionsData, StrikeData } from '@/types/agent';

/**
 * Mapper functions to transform Massive API responses to our internal data structures
 */

/**
 * Map Massive market quote response to MarketData[]
 */
export function mapMassiveMarketToMarketData(
  massiveResponse: any,
  symbol: string
): MarketData[] {
  try {
    // Handle different possible response structures
    const results = massiveResponse?.results || massiveResponse?.data?.results || massiveResponse?.data || [];
    
    if (Array.isArray(results) && results.length > 0) {
      return results.map((item: any) => {
        const price = 
          item?.last_trade ?? 
          item?.last_trade_price ?? 
          item?.price ?? 
          item?.last ?? 
          item?.close ?? 
          item?.lastPrice ?? 
          item?.quote?.lastPrice ??
          0;
        
        const volume = 
          item?.volume ?? 
          item?.v ?? 
          item?.quote?.volume ??
          0;
        
        const timestamp = 
          item?.timestamp ?? 
          item?.time ?? 
          item?.quote?.timestamp ??
          Date.now();
        
        return {
          symbol,
          price: typeof price === 'number' ? price : parseFloat(price) || 0,
          volume: typeof volume === 'number' ? volume : parseInt(volume) || 0,
          timestamp: typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime() || Date.now(),
        };
      });
    }
    
    // If single object instead of array
    if (massiveResponse && !Array.isArray(massiveResponse)) {
      const price = 
        massiveResponse?.last_trade ?? 
        massiveResponse?.last_trade_price ?? 
        massiveResponse?.price ?? 
        massiveResponse?.last ?? 
        massiveResponse?.close ?? 
        massiveResponse?.lastPrice ??
        0;
      
      const volume = 
        massiveResponse?.volume ?? 
        massiveResponse?.v ??
        0;
      
      return [{
        symbol,
        price: typeof price === 'number' ? price : parseFloat(price) || 0,
        volume: typeof volume === 'number' ? volume : parseInt(volume) || 0,
        timestamp: Date.now(),
      }];
    }
    
    return [];
  } catch (error) {
    console.error('Error mapping Massive market data:', error);
    return [];
  }
}

/**
 * Map Massive options chain response to OptionsData
 * Based on Massive API: /v3/snapshot/options/{underlyingAsset}
 * Response structure: { results: [{ details, last_quote, last_trade, implied_volatility, open_interest, ... }] }
 */
export function mapMassiveOptionsToOptionsData(
  massiveResponse: any,
  symbol: string,
  currentPrice: number
): OptionsData {
  try {
    console.log('📊 Mapping Massive options data...');
    console.log('📦 Raw response structure:', {
      hasResults: !!massiveResponse?.results,
      resultsCount: Array.isArray(massiveResponse?.results) ? massiveResponse.results.length : 0,
      responseKeys: Object.keys(massiveResponse || {}),
    });

    // Massive API returns: { results: [...], status: 'ok', request_id: '...' }
    const contracts = massiveResponse?.results || [];
    
    if (!Array.isArray(contracts) || contracts.length === 0) {
      console.warn('⚠️ No contracts found in Massive response');
      return generateDefaultOptionsData(symbol, currentPrice);
    }

    console.log(`✅ Found ${contracts.length} option contracts from Massive`);

    // Group contracts by strike and expiration, separating calls and puts
    const strikeMap = new Map<string, { call?: any; put?: any }>();

    contracts.forEach((contract: any) => {
      // Handle both snapshot format (with details) and reference format (flat structure)
      const details = contract?.details || contract || {};
      const strike = details?.strike_price || contract?.strike_price;
      const contractType = (details?.contract_type || contract?.contract_type || '').toLowerCase(); // 'call' or 'put'
      const expiration = details?.expiration_date || contract?.expiration_date;

      if (!strike || !contractType || !expiration) {
        // Try to infer contract type from ticker if available
        const ticker = contract?.ticker || '';
        const inferredType = ticker.includes('C') ? 'call' : ticker.includes('P') ? 'put' : null;
        
        if (!strike || !expiration) {
          console.warn('⚠️ Contract missing required fields:', { strike, contractType, expiration, ticker });
          return;
        }
        
        // Use inferred type if available
        if (inferredType) {
          const strikeKey = `${strike}_${expiration}`;
          if (!strikeMap.has(strikeKey)) {
            strikeMap.set(strikeKey, {});
          }
          const strikeData = strikeMap.get(strikeKey)!;
          if (inferredType === 'call') {
            strikeData.call = contract;
          } else {
            strikeData.put = contract;
          }
          return;
        }
        
        return;
      }

      const strikeKey = `${strike}_${expiration}`;
      
      if (!strikeMap.has(strikeKey)) {
        strikeMap.set(strikeKey, {});
      }

      const strikeData = strikeMap.get(strikeKey)!;
      
      if (contractType === 'call') {
        strikeData.call = contract;
      } else if (contractType === 'put') {
        strikeData.put = contract;
      }
    });

    console.log(`📈 Grouped into ${strikeMap.size} unique strikes`);

    const strikes: StrikeData[] = [];
    let totalVolume = 0;
    let totalOpenInterest = 0;
    let avgIV = 0;
    let ivCount = 0;
    let firstExpiration = '';

    strikeMap.forEach((strikeData, strikeKey) => {
      const [strikeStr, expiration] = strikeKey.split('_');
      const strike = parseFloat(strikeStr);

      if (!firstExpiration) {
        firstExpiration = expiration;
      }

      // Extract call data
      const call = strikeData.call || {};
      const callQuote = call?.last_quote || {};
      const callTrade = call?.last_trade || {};
      const callBid = callQuote?.bid ?? callTrade?.price ?? 0;
      const callAsk = callQuote?.ask ?? callTrade?.price ?? 0;
      const callVolume = callTrade?.size ?? call?.day?.volume ?? 0;
      const callOpenInterest = call?.open_interest ?? 0;
      const callIV = call?.implied_volatility ?? 0;

      // Extract put data
      const put = strikeData.put || {};
      const putQuote = put?.last_quote || {};
      const putTrade = put?.last_trade || {};
      const putBid = putQuote?.bid ?? putTrade?.price ?? 0;
      const putAsk = putQuote?.ask ?? putTrade?.price ?? 0;
      const putVolume = putTrade?.size ?? put?.day?.volume ?? 0;
      const putOpenInterest = put?.open_interest ?? 0;
      const putIV = put?.implied_volatility ?? 0;

      // Accumulate IV for average
      if (callIV > 0) {
        avgIV += callIV;
        ivCount++;
      }
      if (putIV > 0) {
        avgIV += putIV;
        ivCount++;
      }

      totalVolume += (callVolume || 0) + (putVolume || 0);
      totalOpenInterest += (callOpenInterest || 0) + (putOpenInterest || 0);

      strikes.push({
        strike,
        callBid: typeof callBid === 'number' ? callBid : parseFloat(callBid) || 0,
        callAsk: typeof callAsk === 'number' ? callAsk : parseFloat(callAsk) || 0,
        callVolume: typeof callVolume === 'number' ? callVolume : parseInt(callVolume) || 0,
        callOpenInterest: typeof callOpenInterest === 'number' ? callOpenInterest : parseInt(callOpenInterest) || 0,
        putBid: typeof putBid === 'number' ? putBid : parseFloat(putBid) || 0,
        putAsk: typeof putAsk === 'number' ? putAsk : parseFloat(putAsk) || 0,
        putVolume: typeof putVolume === 'number' ? putVolume : parseInt(putVolume) || 0,
        putOpenInterest: typeof putOpenInterest === 'number' ? putOpenInterest : parseInt(putOpenInterest) || 0,
      });
    });

    // Calculate average IV
    const avgImpliedVolatility = ivCount > 0 ? avgIV / ivCount : 30;

    // Find ATM option for bid/ask/spread
    const atmStrike = strikes.find(s => Math.abs(s.strike - currentPrice) < 2.5) || strikes[0];
    const midPrice = atmStrike ? (atmStrike.callBid + atmStrike.callAsk) / 2 : 2.5;

    const result: OptionsData = {
      symbol,
      strikes: strikes.length > 0 ? strikes : generateDefaultStrikes(symbol, currentPrice),
      expiration: firstExpiration || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      iv: avgImpliedVolatility,
      volume: totalVolume,
      openInterest: totalOpenInterest,
      bid: midPrice * 0.95,
      ask: midPrice * 1.05,
      spread: midPrice * 0.1,
    };

    console.log('✅ Mapped options data:', {
      symbol,
      strikesCount: result.strikes.length,
      expiration: result.expiration,
      avgIV: result.iv.toFixed(2) + '%',
      totalVolume,
      totalOpenInterest,
    });

    return result;
  } catch (error) {
    console.error('❌ Error mapping Massive options data:', error);
    // Return default structure on error
    return generateDefaultOptionsData(symbol, currentPrice);
  }
}

/**
 * Extract historical IV from options contracts
 * Since Massive doesn't have a historical IV endpoint, we extract IV values
 * from the options chain data
 */
export function extractIVFromOptionsContracts(optionsData: any): number[] {
  try {
    const contracts = optionsData?.results || optionsData?.data?.results || [];
    const ivs: number[] = [];
    
    if (Array.isArray(contracts)) {
      contracts.forEach((contract: any) => {
        const iv = contract?.implied_volatility;
        if (typeof iv === 'number' && iv > 0 && !isNaN(iv)) {
          ivs.push(iv);
        }
      });
    }
    
    // If we have IVs, return them; otherwise return empty array
    // The agent can use the average IV from options data
    return ivs.length > 0 ? ivs : [];
  } catch (error) {
    console.error('Error extracting IV from options contracts:', error);
    return [];
  }
}

/**
 * Map Massive IV response to number[] (legacy - kept for compatibility)
 * Historical IV endpoint doesn't exist, so this always returns empty
 */
export function mapMassiveIVToHistoricalIV(massiveResponse: any): number[] {
  // Historical IV endpoint doesn't exist in Massive API
  // Use extractIVFromOptionsContracts instead
  return [];
}

/**
 * Generate default strikes if Massive doesn't return any
 */
function generateDefaultStrikes(symbol: string, currentPrice: number): StrikeData[] {
  const strikes: StrikeData[] = [];
  const baseStrike = Math.round(currentPrice / 5) * 5;
  
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
  
  return strikes;
}

/**
 * Generate default options data structure
 */
function generateDefaultOptionsData(symbol: string, currentPrice: number): OptionsData {
  return {
    symbol,
    strikes: generateDefaultStrikes(symbol, currentPrice),
    expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    iv: 30,
    volume: 0,
    openInterest: 0,
    bid: 2.5,
    ask: 2.75,
    spread: 0.25,
  };
}

