'use client';

import React from 'react';

interface ETFCardProps {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export const ETFCard: React.FC<ETFCardProps> = ({
  symbol,
  price,
  change,
  changePercent,
  isSelected = false,
  onClick,
}) => {
  const isPositive = change >= 0;

  return (
    <div 
      className={`etf-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="etf-symbol">{symbol}</div>
      <div className="etf-price">{price.toFixed(2)}</div>
      <div className={`etf-change ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
      </div>

      <style jsx>{`
        .etf-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          min-width: 100px;
          transition: all 0.2s;
          cursor: pointer;
        }

        .etf-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .etf-card.selected {
          background: rgba(59, 130, 246, 0.15);
          border-color: #3b82f6;
        }

        .etf-symbol {
          font-size: 0.85rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
        }

        .etf-price {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .etf-change {
          font-size: 0.75rem;
          font-weight: 600;
        }

        .etf-change.positive {
          color: #10b981;
        }

        .etf-change.negative {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
};

