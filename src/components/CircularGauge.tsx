'use client';

import React from 'react';

interface CircularGaugeProps {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  colors?: string[];
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  maxValue = 100,
  size = 200,
  strokeWidth = 20,
  label,
  sublabel,
  colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((value / maxValue) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  // Segment colors based on percentage
  const getColor = () => {
    if (percentage < 20) return colors[0];
    if (percentage < 40) return colors[1];
    if (percentage < 60) return colors[2];
    if (percentage < 80) return colors[3];
    return colors[4];
  };

  return (
    <div className="circular-gauge">
      <svg width={size} height={size} className="gauge-svg">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="gauge-progress"
        />
      </svg>
      <div className="gauge-content">
        <div className="gauge-value">{value.toFixed(0)}%</div>
        {sublabel && <div className="gauge-sublabel">{sublabel}</div>}
        {label && <div className="gauge-label">{label}</div>}
      </div>

      <style jsx>{`
        .circular-gauge {
          position: relative;
          display: inline-block;
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
          font-size: 2.5rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1;
        }

        .gauge-sublabel {
          font-size: 0.9rem;
          color: #9ca3af;
          margin-top: 0.25rem;
        }

        .gauge-label {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
};

