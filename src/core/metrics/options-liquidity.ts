import { MetricResult } from '@/types/agent';
import { OptionsData } from '@/types/agent';

/**
 * Options Liquidity Metric
 * Measures volume, open interest, and spread quality
 * 
 * Good liquidity = tight spreads, high volume/OI
 * Threshold: Score >= 65 indicates sufficient liquidity
 */
export class OptionsLiquidityMetric {
  private static readonly THRESHOLD = 65;

  /**
   * Calculate liquidity score from options data
   */
  static calculate(optionsData: OptionsData): MetricResult {
    // Calculate spread percentage
    const midPrice = (optionsData.bid + optionsData.ask) / 2;
    const spreadPercent = midPrice > 0 
      ? ((optionsData.ask - optionsData.bid) / midPrice) * 100
      : 100;

    // Spread quality (lower is better, inverted)
    const spreadScore = Math.max(0, 100 - (spreadPercent * 10));

    // Volume score (normalized, higher is better)
    const volumeScore = Math.min(100, (optionsData.volume / 1000) * 10);

    // Open interest score
    const oiScore = Math.min(100, (optionsData.openInterest / 500) * 10);

    // Combined score (weighted)
    const score = (spreadScore * 0.5 + volumeScore * 0.3 + oiScore * 0.2);

    const status: 'pass' | 'fail' = score >= this.THRESHOLD ? 'pass' : 'fail';

    return {
      score: Math.round(score),
      status,
      threshold: this.THRESHOLD,
      explanation: status === 'pass'
        ? `Liquidity adequate: Spread ${spreadPercent.toFixed(2)}%, Volume ${optionsData.volume}, OI ${optionsData.openInterest}`
        : `Liquidity insufficient: Score ${score.toFixed(0)}% below threshold of ${this.THRESHOLD}%`,
    };
  }
}


