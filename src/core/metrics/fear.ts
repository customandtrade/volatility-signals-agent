import { MetricResult } from '@/types/agent';
import { MarketData } from '@/types/agent';

/**
 * Fear Metric
 * Measures aggressive price expansion or stress
 * 
 * High fear = rapid price movement, high volatility
 * Threshold: Score >= 70 indicates sufficient fear/expansion
 */
export class FearMetric {
  private static readonly THRESHOLD = 70;

  /**
   * Calculate fear score from market data
   * 
   * Factors:
   * - Recent price volatility
   * - Price expansion rate
   * - Volume spikes
   */
  static calculate(
    currentData: MarketData,
    historicalData: MarketData[]
  ): MetricResult {
    if (historicalData.length < 2) {
      return {
        score: 0,
        status: 'fail',
        threshold: this.THRESHOLD,
        explanation: 'Insufficient historical data for fear calculation',
      };
    }

    // Calculate price volatility (simplified)
    const priceChanges = historicalData
      .slice(-20) // Last 20 data points
      .map((data, i) => {
        if (i === 0) return 0;
        return Math.abs((data.price - historicalData[i - 1].price) / historicalData[i - 1].price);
      });

    const avgVolatility = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
    const maxVolatility = Math.max(...priceChanges);

    // Calculate volume spike
    const avgVolume = historicalData
      .slice(-20)
      .reduce((sum, d) => sum + d.volume, 0) / Math.min(20, historicalData.length);
    
    const volumeSpike = currentData.volume / (avgVolume || 1);

    // Combine factors (normalized to 0-100)
    const volatilityScore = Math.min(100, (avgVolatility * 1000 + maxVolatility * 500));
    const volumeScore = Math.min(100, (volumeSpike - 1) * 50);
    
    const score = Math.min(100, (volatilityScore * 0.7 + volumeScore * 0.3));

    const status: 'pass' | 'fail' = score >= this.THRESHOLD ? 'pass' : 'fail';

    return {
      score: Math.round(score),
      status,
      threshold: this.THRESHOLD,
      explanation: status === 'pass' 
        ? `High fear detected: Volatility ${score.toFixed(0)}% above baseline`
        : `Fear level ${score.toFixed(0)}% - below threshold of ${this.THRESHOLD}%`,
    };
  }
}


