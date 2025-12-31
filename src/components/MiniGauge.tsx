'use client';

import React from 'react';

interface MiniGaugeProps {
  value: number;
  label: string;
  maxValue?: number;
  size?: number;
  color?: string;
}

export const MiniGauge: React.FC<MiniGaugeProps> = ({
  value,
  label,
  maxValue = 100,
  size = 80,
  color,
}) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((value / maxValue) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  // Determine color based on value if not provided
  const getColor = () => {
    if (color) return color;
    if (percentage >= 70) return '#10b981'; // Green
    if (percentage >= 40) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const gaugeColor = getColor();

  return (
    <div className="mini-gauge">
      <div className="gauge-wrapper">
        <svg width={size} height={size} className="gauge-svg">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gaugeColor}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="gauge-progress"
        />
      </svg>
      <div className="gauge-content">
        <div className="gauge-value">{value.toFixed(0)}%</div>
      </div>
      </div>
      <div className="gauge-label">{label}</div>

      <style jsx>{`
        .mini-gauge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .gauge-wrapper {
          position: relative;
        }

        .gauge-svg {
          transform: rotate(-90deg);
        }

        .gauge-progress {
          transition: stroke-dashoffset 1s ease-out;
        }

        .gauge-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .gauge-value {
          font-size: 0.9rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1;
        }

        .gauge-label {
          font-size: 0.7rem;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-align: center;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
};

