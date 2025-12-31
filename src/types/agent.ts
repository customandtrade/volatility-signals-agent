/**
 * Agent State Types
 * Each symbol is always in one deterministic state
 */
export type AgentState = 'WAIT' | 'WATCH' | 'SELL';

/**
 * Metric Score
 * Normalized score from 0 to 100
 */
export type MetricScore = number;

/**
 * Metric Status
 * Whether a metric meets its threshold criteria
 */
export type MetricStatus = 'pass' | 'fail';

/**
 * Core Metrics
 */
export interface MetricResult {
  score: MetricScore;
  status: MetricStatus;
  threshold: number;
  explanation: string;
}

export interface AgentMetrics {
  fear: MetricResult;
  overpricing: MetricResult;
  exhaustion: MetricResult;
  optionsLiquidity: MetricResult;
  tradableStructure: MetricResult;
}

/**
 * Symbol Analysis
 * Complete analysis for a single symbol
 */
export interface SymbolAnalysis {
  symbol: string;
  state: AgentState;
  metrics: AgentMetrics;
  timestamp: number;
  explanation: string;
}

/**
 * Market Data (from E*TRADE)
 */
export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
}

export interface OptionsData {
  symbol: string;
  strikes: StrikeData[];
  expiration: string;
  iv: number;
  volume: number;
  openInterest: number;
  bid: number;
  ask: number;
  spread: number;
}

export interface StrikeData {
  strike: number;
  callBid: number;
  callAsk: number;
  callVolume: number;
  callOpenInterest: number;
  putBid: number;
  putAsk: number;
  putVolume: number;
  putOpenInterest: number;
}

/**
 * Signal Output
 */
export interface Signal {
  symbol: string;
  state: AgentState;
  metrics: AgentMetrics;
  callCreditSpread?: CallCreditSpread;
  timestamp: number;
  explanation: string;
}

export interface CallCreditSpread {
  sellStrike: number;
  buyStrike: number;
  expiration: string;
  credit: number;
  maxRisk: number;
  maxReward: number;
  probability: number;
}


