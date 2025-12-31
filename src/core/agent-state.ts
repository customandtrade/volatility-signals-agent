import { AgentState, AgentMetrics } from '@/types/agent';

/**
 * Agent State Machine
 * Deterministic state transitions based on metric criteria
 */
export class AgentStateMachine {
  /**
   * Determine agent state from metrics
   * 
   * Rules:
   * - SELL: All metrics must pass
   * - WATCH: Some metrics pass, but not all
   * - WAIT: No metrics pass or insufficient data
   */
  static determineState(metrics: AgentMetrics): AgentState {
    const metricResults = [
      metrics.fear,
      metrics.overpricing,
      metrics.exhaustion,
      metrics.optionsLiquidity,
      metrics.tradableStructure,
    ];

    const passedMetrics = metricResults.filter(m => m.status === 'pass').length;
    const totalMetrics = metricResults.length;

    // All metrics must pass for SELL
    if (passedMetrics === totalMetrics) {
      return 'SELL';
    }

    // Some metrics pass but not all = WATCH
    if (passedMetrics > 0) {
      return 'WATCH';
    }

    // No metrics pass = WAIT
    return 'WAIT';
  }

  /**
   * Generate explanation for current state
   */
  static explainState(state: AgentState, metrics: AgentMetrics): string {
    const metricResults = [
      { name: 'Fear', result: metrics.fear },
      { name: 'Overpricing', result: metrics.overpricing },
      { name: 'Exhaustion', result: metrics.exhaustion },
      { name: 'Options Liquidity', result: metrics.optionsLiquidity },
      { name: 'Tradable Structure', result: metrics.tradableStructure },
    ];

    const passed = metricResults.filter(m => m.result.status === 'pass');
    const failed = metricResults.filter(m => m.result.status === 'fail');

    switch (state) {
      case 'SELL':
        return `All metrics aligned. ${passed.length} metrics passing. Context supports volatility selling.`;
      
      case 'WATCH':
        return `${passed.length} metrics passing, ${failed.length} metrics not yet aligned. Monitoring for full context.`;
      
      case 'WAIT':
        return `Insufficient context. ${failed.length} metrics not aligned. Waiting for market conditions to develop.`;
      
      default:
        return 'State evaluation in progress.';
    }
  }
}


