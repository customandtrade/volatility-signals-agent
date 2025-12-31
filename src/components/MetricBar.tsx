'use client';

import React, { useEffect, useState } from 'react';
import { MetricResult } from '@/types/agent';

interface MetricBarProps {
  name: string;
  metric: MetricResult;
  color?: string;
}

export const MetricBar: React.FC<MetricBarProps> = ({ 
  name, 
  metric, 
  color = '#3b82f6' 
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Animate bar fill
    const duration = 1000;
    const steps = 60;
    const increment = metric.score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= metric.score) {
        setAnimatedScore(metric.score);
        clearInterval(timer);
      } else {
        setAnimatedScore(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [metric.score]);

  const thresholdPosition = (metric.threshold / 100) * 100;
  const isPassing = metric.status === 'pass';

  return (
    <div className="metric-bar-container">
      <div className="metric-header">
        <span className="metric-name">{name}</span>
        <span className={`metric-status ${isPassing ? 'pass' : 'fail'}`}>
          {isPassing ? '✓' : '○'} {metric.score}%
        </span>
      </div>
      
      <div className="metric-bar-wrapper">
        <div className="metric-bar-background">
          {/* Threshold indicator */}
          <div 
            className="metric-threshold"
            style={{ left: `${thresholdPosition}%` }}
          />
          
          {/* Animated fill bar */}
          <div
            className={`metric-bar-fill ${isPassing ? 'pass' : 'fail'}`}
            style={{
              width: `${animatedScore}%`,
              backgroundColor: isPassing ? '#10b981' : '#ef4444',
            }}
          />
        </div>
      </div>
      
      <div className="metric-explanation">
        {metric.explanation}
      </div>

      <style jsx>{`
        .metric-bar-container {
          margin-bottom: 2rem;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .metric-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: #e5e7eb;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metric-status {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .metric-status.pass {
          color: #10b981;
        }

        .metric-status.fail {
          color: #6b7280;
        }

        .metric-bar-wrapper {
          position: relative;
          margin-bottom: 0.5rem;
        }

        .metric-bar-background {
          position: relative;
          height: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          overflow: hidden;
        }

        .metric-threshold {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: rgba(255, 255, 255, 0.3);
          z-index: 2;
        }

        .metric-bar-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          border-radius: 6px;
          transition: width 0.1s ease-out;
          z-index: 1;
        }

        .metric-bar-fill.pass {
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }

        .metric-explanation {
          font-size: 0.85rem;
          color: #9ca3af;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};


