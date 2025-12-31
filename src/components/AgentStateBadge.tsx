'use client';

import React from 'react';
import { AgentState } from '@/types/agent';

interface AgentStateBadgeProps {
  state: AgentState;
}

export const AgentStateBadge: React.FC<AgentStateBadgeProps> = ({ state }) => {
  const stateConfig = {
    WAIT: {
      label: 'WAIT',
      color: '#6b7280',
      bgColor: 'rgba(107, 114, 128, 0.2)',
      glow: 'rgba(107, 114, 128, 0.3)',
    },
    WATCH: {
      label: 'WATCH',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.2)',
      glow: 'rgba(245, 158, 11, 0.3)',
    },
    SELL: {
      label: 'SELL',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.2)',
      glow: 'rgba(16, 185, 129, 0.5)',
    },
  };

  const config = stateConfig[state];

  return (
    <div className="state-badge">
      <div className="state-indicator" />
      <span className="state-label">{config.label}</span>

      <style jsx>{`
        .state-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: ${config.bgColor};
          border: 1px solid ${config.color};
          border-radius: 8px;
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: 0.1em;
          color: ${config.color};
          box-shadow: 0 0 20px ${config.glow};
        }

        .state-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${config.color};
          box-shadow: 0 0 10px ${config.color};
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};


