import { MetricResult } from '@/types/agent';
import { MarketData } from '@/types/agent';

/**
 * Exhaustion (Stall) Metric
 * Detects loss of momentum after expansion
 * 
 * High exhaustion = price expansion has slowed/stalled
 * Threshold: Score >= 60 indicates exhaustion/stall
 */
export class ExhaustionMetric {
  private static readonly THRESHOLD = 60;

  /**
   * Calculate exhaustion score
   * 
   * Looks for:
   * - Decreasing momentum after expansion
   * - Price consolidation
   * - Volume decline after spike
   */
  static calculate(
    currentData: MarketData,
    historicalData: MarketData[]
  ): MetricResult {
    if (historicalData.length < 10) {
      return {
        score: 0,
        status: 'fail',
        threshold: this.THRESHOLD,
        explanation: 'Insufficient data for exhaustion detection',
      };
    }

    const recent = historicalData.slice(-10);
    const earlier = historicalData.slice(-20, -10);

    // Calculate momentum change
    const recentMomentum = recent
      .slice(1)
      .map((d, i) => Math.abs(d.price - recent[i].price))
      .reduce((a, b) => a + b, 0) / (recent.length - 1);

    const earlierMomentum = earlier.length > 1
      ? earlier
          .slice(1)
          .map((d, i) => Math.abs(d.price - earlier[i].price))
          .reduce((a, b) => a + b, 0) / (earlier.length - 1)
      : recentMomentum;

    // Momentum decline indicates exhaustion
    const momentumDecline = earlierMomentum > 0 
      ? Math.max(0, (earlierMomentum - recentMomentum) / earlierMomentum * 100)
      : 0;

    // Volume decline
    const recentAvgVolume = recent.reduce((sum, d) => sum + d.volume, 0) / recent.length;
    const earlierAvgVolume = earlier.length > 0
      ? earlier.reduce((sum, d) => sum + d.volume, 0) / earlier.length
      : recentAvgVolume;

    const volumeDecline = earlierAvgVolume > 0
      ? Math.max(0, (earlierAvgVolume - recentAvgVolume) / earlierAvgVolume * 100)
      : 0;

    // Combine factors
    const score = Math.min(100, (momentumDecline * 0.6 + volumeDecline * 0.4));

    const status: 'pass' | 'fail' = score >= this.THRESHOLD ? 'pass' : 'fail';

    return {
      score: Math.round(score),
      status,
      threshold: this.THRESHOLD,
      explanation: status === 'pass'
        ? `Exhaustion detected: Momentum decline ${score.toFixed(0)}%`
        : `Exhaustion level ${score.toFixed(0)}% - below threshold of ${this.THRESHOLD}%`,
    };
  }
}


