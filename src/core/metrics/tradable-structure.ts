import { MetricResult } from '@/types/agent';
import { OptionsData, StrikeData } from '@/types/agent';

/**
 * Tradable Structure Metric
 * Determines if a defined-risk short premium structure is viable
 * 
 * Checks:
 * - Available strikes for credit spread
 * - Reasonable credit potential
 * - Defined risk structure possible
 * Threshold: Score >= 60 indicates viable structure
 */
export class TradableStructureMetric {
  private static readonly THRESHOLD = 60;

  /**
   * Calculate tradable structure score
   */
  static calculate(
    optionsData: OptionsData,
    currentPrice: number
  ): MetricResult {
    if (!optionsData.strikes || optionsData.strikes.length < 2) {
      return {
        score: 0,
        status: 'fail',
        threshold: this.THRESHOLD,
        explanation: 'Insufficient strike data for structure evaluation',
      };
    }

    // Find viable credit spread opportunities
    // Look for OTM calls with good liquidity
    const viableStrikes = optionsData.strikes.filter(strike => {
      const isOTM = strike.strike > currentPrice;
      const hasLiquidity = strike.callVolume > 10 || strike.callOpenInterest > 50;
      const hasTightSpread = strike.callAsk > 0 && strike.callBid > 0 
        ? ((strike.callAsk - strike.callBid) / ((strike.callAsk + strike.callBid) / 2)) < 0.2
        : false;
      
      return isOTM && hasLiquidity && hasTightSpread;
    });

    // Calculate potential credit (simplified)
    const creditScore = viableStrikes.length > 0 ? 70 : 0;

    // Strike spacing quality
    const strikeSpacing = viableStrikes.length >= 2 ? 80 : 40;

    // Risk/reward ratio (simplified check)
    const riskRewardScore = viableStrikes.length >= 2 ? 60 : 0;

    const score = (creditScore * 0.4 + strikeSpacing * 0.3 + riskRewardScore * 0.3);

    const status: 'pass' | 'fail' = score >= this.THRESHOLD ? 'pass' : 'fail';

    return {
      score: Math.round(score),
      status,
      threshold: this.THRESHOLD,
      explanation: status === 'pass'
        ? `Viable structure: ${viableStrikes.length} tradable strikes identified`
        : `Structure not viable: ${viableStrikes.length} strikes available, insufficient for defined-risk spread`,
    };
  }
}


