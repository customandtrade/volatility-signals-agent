import { MarketData, OptionsData, StrikeData } from '@/types/agent';

/**
 * Mock data generator for development/testing (extracted from ETrade service)
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
  static generateOptionsData(symbol: string, currentPrice: number) : OptionsData {
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
