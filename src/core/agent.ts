import { SymbolAnalysis, AgentMetrics, MarketData, OptionsData } from '@/types/agent';
import { AgentStateMachine } from './agent-state';
import {
  FearMetric,
  OverpricingMetric,
  ExhaustionMetric,
  OptionsLiquidityMetric,
  TradableStructureMetric,
} from './metrics';

/**
 * Volatility Signals Agent
 * Main agent orchestrator
 */
export class VolatilitySignalsAgent {
  /**
   * Analyze a symbol and determine its state
   */
  static analyze(
    symbol: string,
    marketData: MarketData[],
    optionsData: OptionsData,
    historicalIV: number[]
  ): SymbolAnalysis {
    const currentMarket = marketData[marketData.length - 1];
    const currentIV = optionsData.iv;

    // Calculate all metrics
    const metrics: AgentMetrics = {
      fear: FearMetric.calculate(currentMarket, marketData),
      overpricing: OverpricingMetric.calculate(currentIV, historicalIV),
      exhaustion: ExhaustionMetric.calculate(currentMarket, marketData),
      optionsLiquidity: OptionsLiquidityMetric.calculate(optionsData),
      tradableStructure: TradableStructureMetric.calculate(optionsData, currentMarket.price),
    };

    // Determine state
    const state = AgentStateMachine.determineState(metrics);
    const explanation = AgentStateMachine.explainState(state, metrics);

    return {
      symbol,
      state,
      metrics,
      timestamp: Date.now(),
      explanation,
    };
  }

  /**
   * Check if signal should be emitted
   * Signal only if state is SELL (all metrics pass)
   */
  static shouldEmitSignal(analysis: SymbolAnalysis): boolean {
    return analysis.state === 'SELL';
  }
}


