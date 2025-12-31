import { MetricResult } from '@/types/agent';
import { OptionsData } from '@/types/agent';

/**
 * Overpricing Metric
 * Measures relative implied volatility (IV percentile)
 * 
 * High overpricing = IV is elevated relative to historical range
 * Threshold: IV percentile >= 70 indicates overpricing
 */
export class OverpricingMetric {
  private static readonly THRESHOLD = 70;

  /**
   * Calculate overpricing score from options data
   * 
   * Uses IV percentile: where current IV sits in historical range
   */
  static calculate(
    currentIV: number,
    historicalIV: number[]
  ): MetricResult {
    if (historicalIV.length < 20) {
      return {
        score: 0,
        status: 'fail',
        threshold: this.THRESHOLD,
        explanation: 'Insufficient IV history for percentile calculation',
      };
    }

    // Calculate IV percentile
    const sortedIV = [...historicalIV].sort((a, b) => a - b);
    const percentile = (sortedIV.filter(iv => iv <= currentIV).length / sortedIV.length) * 100;

    const status: 'pass' | 'fail' = percentile >= this.THRESHOLD ? 'pass' : 'fail';

    return {
      score: Math.round(percentile),
      status,
      threshold: this.THRESHOLD,
      explanation: status === 'pass'
        ? `IV percentile ${percentile.toFixed(0)}% - options are overpriced`
        : `IV percentile ${percentile.toFixed(0)}% - below threshold of ${this.THRESHOLD}%`,
    };
  }
}


