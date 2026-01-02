'use client';

import React, { useMemo } from 'react';
import { SymbolAnalysis, MarketData } from '@/types/agent';
import { AgentStateBadge } from './AgentStateBadge';
import { ETFCard } from './ETFCard';
import { CircularGauge } from './CircularGauge';
import { MiniGauge } from './MiniGauge';

interface DashboardProps {
  analysis: SymbolAnalysis;
  allETFs?: Array<{ symbol: string; price: number; change: number; changePercent: number }>;
  onSymbolChange?: (symbol: string) => void;
  marketData?: MarketData[];
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  analysis, 
  allETFs = [],
  onSymbolChange,
  marketData = [],
}) => {
  // Calculate overall score from metrics
  const overallScore = useMemo(() => {
    const metrics = analysis.metrics;
    const scores = [
      metrics.fear.score,
      metrics.overpricing.score,
      metrics.exhaustion.score,
      metrics.optionsLiquidity.score,
      metrics.tradableStructure.score,
    ];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [analysis.metrics]);

  // Calculate passing metrics count
  const passingMetrics = useMemo(() => {
    const metrics = analysis.metrics;
    return [
      metrics.fear,
      metrics.overpricing,
      metrics.exhaustion,
      metrics.optionsLiquidity,
      metrics.tradableStructure,
    ].filter(m => m.status === 'pass').length;
  }, [analysis.metrics]);

  // Calculate probability of SELL (based on metrics alignment)
  const sellProbability = useMemo(() => {
    const metrics = analysis.metrics;
    const criticalMetrics = [metrics.fear, metrics.overpricing, metrics.exhaustion];
    const passingCritical = criticalMetrics.filter(m => m.status === 'pass').length;
    return Math.round((passingCritical / criticalMetrics.length) * 100);
  }, [analysis.metrics]);

  const getSellProbabilityLabel = (prob: number) => {
    if (prob >= 80) return 'HIGH';
    if (prob >= 50) return 'MEDIUM';
    return 'LOW';
  };

  // Get current price and change from market data
  const { currentPrice, priceChange, priceChangePercent } = useMemo(() => {
    if (marketData.length > 0) {
      const current = marketData[marketData.length - 1].price;
      const previous = marketData.length > 1 
        ? marketData[marketData.length - 2].price 
        : current;
      const change = current - previous;
      const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

      return {
        currentPrice: current,
        priceChange: change,
        priceChangePercent: changePercent,
      };
    }

    // Fallback values if no market data
    return {
      currentPrice: 0,
      priceChange: 0,
      priceChangePercent: 0,
    };
  }, [marketData]);

  return (
    <div className="dashboard">
      {/* Top Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="brand">TRADION</h1>
          <p className="subtitle">VOLATILITY SIGNALS AGENT</p>
        </div>
        <div className="header-right">
          <div className="etf-cards">
            {allETFs.map((etf) => (
              <ETFCard
                key={etf.symbol}
                symbol={etf.symbol}
                price={etf.price}
                change={etf.change}
                changePercent={etf.changePercent}
                isSelected={etf.symbol === analysis.symbol}
                onClick={() => onSymbolChange?.(etf.symbol)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Left Panel - Symbol Analysis */}
        <div className="panel-left">
          <div className="panel-header">
            <div className="symbol-info">
              <span className="symbol-name">{analysis.symbol}</span>
              <span className={`price-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
                {priceChange >= 0 ? '↑' : '↓'} {priceChange.toFixed(2)} ({priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="gauge-container">
            <div className="gauge-note">Score must be above 65%</div>
            <CircularGauge
              value={overallScore}
              size={200}
              sublabel={`+${(overallScore - 60).toFixed(2)}%`}
            />
          </div>

          <div className="metrics-list">
            <div className={`metric-item ${analysis.metrics.fear.status === 'pass' ? 'metric-pass' : 'metric-fail'}`}>
              <span className="metric-name">FEAR</span>
              <span className="metric-value">{analysis.metrics.fear.score.toFixed(0)}%</span>
            </div>
            <div className={`metric-item ${analysis.metrics.overpricing.status === 'pass' ? 'metric-pass' : 'metric-fail'}`}>
              <span className="metric-name">IV</span>
              <span className="metric-value">{analysis.metrics.overpricing.score.toFixed(0)}%</span>
            </div>
            <div className={`metric-item ${analysis.metrics.exhaustion.status === 'pass' ? 'metric-pass' : 'metric-fail'}`}>
              <span className="metric-name">EXHAUSTION</span>
              <span className="metric-value">{analysis.metrics.exhaustion.score.toFixed(0)}%</span>
            </div>
            <div className={`metric-item ${analysis.metrics.optionsLiquidity.status === 'pass' ? 'metric-pass' : 'metric-fail'}`}>
              <span className="metric-name">LIQUIDITY</span>
              <span className="metric-value">{analysis.metrics.optionsLiquidity.score.toFixed(0)}%</span>
            </div>
            <div className={`metric-item ${analysis.metrics.tradableStructure.status === 'pass' ? 'metric-pass' : 'metric-structure'}`}>
              <span className="metric-name">STRUCTURE</span>
              <span className="metric-value">{analysis.metrics.tradableStructure.score.toFixed(0)}%</span>
            </div>
          </div>

          <div className="spread-info">
            <span>Spread 10.15 - 20.139</span>
            <span className="spread-change positive">↑ 30%</span>
          </div>
        </div>

        {/* Center Panel */}
        <div className="panel-center">
          <div className="context-score-panel">
            <h3 className="panel-title">CONTEXT SCORE</h3>
            <div className="score-display">
              <div className="score-value">{overallScore}</div>
              <div className="score-gauge">
                <div className="score-label">WAIT</div>
                <div className="score-percent">6.86%</div>
              </div>
            </div>
          </div>

          <div className="agent-reasoning-panel">
            <h3 className="panel-title">AGENT REASONING</h3>
            <ul className="reasoning-list">
              {analysis.explanation.split('. ').filter(Boolean).map((point, idx) => (
                <li key={idx}>{point}.</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Panel */}
        <div className="panel-right">
          <div className="sell-probability-panel">
            <h3 className="panel-title">Probability of reaching SELL In the next 90 min</h3>
            <div className="probability-display">
              <CircularGauge
                value={sellProbability}
                size={150}
                label={getSellProbabilityLabel(sellProbability)}
              />
              <div className="probability-info">
                <div className="prob-value">{sellProbability}%</div>
                <div className="prob-label">Best Doit</div>
                <div className="prob-symbol">GE SPOT</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="dashboard-bottom">
        <div className="watch-mode-panel">
          <div className="watch-header">
            <span className="watch-icon">⚠</span>
            <span className="watch-title">WATCH MODE</span>
          </div>
          <div className="watch-content">
            <p>Monitoring {5 - passingMetrics}/5 metrics not yet aligned</p>
            <span className="watch-value">• {overallScore}%</span>
          </div>
        </div>

        <div className="mini-gauges-panel">
          <MiniGauge
            value={analysis.metrics.fear.score}
            label="FEAR"
            color={analysis.metrics.fear.status === 'pass' ? '#10b981' : '#ef4444'}
          />
          <MiniGauge
            value={analysis.metrics.overpricing.score}
            label="OVERPRICING"
            color={analysis.metrics.overpricing.status === 'pass' ? '#10b981' : '#ef4444'}
          />
          <MiniGauge
            value={analysis.metrics.exhaustion.score}
            label="EXHAUSTION"
            color={analysis.metrics.exhaustion.status === 'pass' ? '#10b981' : '#ef4444'}
          />
          <MiniGauge
            value={analysis.metrics.optionsLiquidity.score}
            label="LIQUIDITY"
            color={analysis.metrics.optionsLiquidity.status === 'pass' ? '#10b981' : '#ef4444'}
          />
          <MiniGauge
            value={analysis.metrics.tradableStructure.score}
            label="STRUCTURE"
            color={analysis.metrics.tradableStructure.status === 'pass' ? '#10b981' : '#6b7280'}
          />
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          width: 100%;
          max-width: 100%;
          padding: 1rem;
          background: #0a0a0a;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-left {
          flex: 1;
        }

        .brand {
          font-size: 2.5rem;
          font-weight: 800;
          margin: 0 0 0.25rem 0;
          color: #ffffff;
          letter-spacing: 0.05em;
        }

        .symbol {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.25rem 0;
          color: #ffffff;
          letter-spacing: 0.05em;
        }

        .subtitle {
          font-size: 0.75rem;
          color: #9ca3af;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .gauge-note {
          font-size: 0.9rem;
          color: #9ca3af;
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .header-right {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: flex-end;
        }

        .etf-cards {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .panel-left,
        .panel-center,
        .panel-right {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .symbol-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .symbol-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
        }

        .price-change {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .price-change.positive {
          color: #10b981;
        }

        .price-change.negative {
          color: #ef4444;
        }

        .price-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
          font-size: 0.9rem;
          color: #9ca3af;
        }

        .gauge-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 2rem 0;
        }

        .metrics-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .metric-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 6px;
          border-left: 3px solid transparent;
        }

        .metric-item.metric-pass {
          background: rgba(16, 185, 129, 0.1);
          border-left-color: #10b981;
        }

        .metric-item.metric-fail {
          background: rgba(239, 68, 68, 0.1);
          border-left-color: #ef4444;
        }

        .metric-item.metric-structure {
          background: rgba(107, 114, 128, 0.1);
          border-left-color: #6b7280;
        }

        .metric-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
        }

        .metric-value {
          font-size: 0.9rem;
          font-weight: 600;
          color: #ffffff;
        }

        .spread-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 6px;
          font-size: 0.85rem;
          color: #10b981;
        }

        .spread-change {
          font-weight: 600;
        }

        .panel-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0 0 1rem 0;
        }

        .context-score-panel {
          margin-bottom: 2rem;
        }

        .score-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .score-value {
          font-size: 4rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1;
        }

        .score-gauge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .score-label {
          font-size: 0.75rem;
          color: #9ca3af;
          text-transform: uppercase;
        }

        .score-percent {
          font-size: 0.9rem;
          font-weight: 600;
          color: #ffffff;
        }

        .reasoning-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .reasoning-list li {
          font-size: 0.9rem;
          color: #e5e7eb;
          line-height: 1.6;
          padding-left: 1rem;
          position: relative;
        }

        .reasoning-list li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #3b82f6;
        }

        .sell-probability-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .probability-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
        }

        .probability-info {
          text-align: center;
        }

        .prob-value {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
        }

        .prob-label {
          font-size: 0.85rem;
          color: #9ca3af;
          margin-top: 0.25rem;
        }

        .prob-symbol {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
          text-transform: uppercase;
        }

        .dashboard-bottom {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .watch-mode-panel {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .watch-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .watch-icon {
          font-size: 1.5rem;
          color: #f59e0b;
        }

        .watch-title {
          font-size: 1rem;
          font-weight: 700;
          color: #f59e0b;
          text-transform: uppercase;
        }

        .watch-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .watch-content p {
          margin: 0;
          font-size: 0.9rem;
          color: #e5e7eb;
        }

        .watch-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f59e0b;
        }

        .mini-gauges-panel {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          justify-content: space-around;
          align-items: center;
        }

        @media (max-width: 1400px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-bottom {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
