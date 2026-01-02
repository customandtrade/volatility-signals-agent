'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface OptionContract {
  ticker: string;
  underlying_ticker: string;
  strike_price: number;
  expiration_date: string;
  contract_type: string;
  [key: string]: any;
}

export default function AAPLPage() {
  const router = useRouter();
  const symbol = 'AAPL';
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [contracts, setContracts] = useState<OptionContract[]>([]);
  const [dataSource, setDataSource] = useState<'reference' | 'snapshot' | 'mock'>('reference');
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated with Supabase
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUserAuthenticated(true);
        } else {
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUserAuthenticated(true);
      } else {
        setUserAuthenticated(false);
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const fetchOptionsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const useMassive = process.env.NEXT_PUBLIC_USE_MASSIVE === 'true';

      if (useMassive) {
        // Try reference endpoint first
        console.log('📊 Fetching options from reference endpoint...');
        const referenceResp = await fetch(`/api/massive/reference/options?symbol=${symbol}`);
        
        if (referenceResp.ok) {
          const referenceJson = await referenceResp.json();
          const rawData = referenceJson?.data || referenceJson;
          
          if (rawData?.results && Array.isArray(rawData.results)) {
            setContracts(rawData.results);
            setDataSource('reference');
            console.log('✅ Got', rawData.results.length, 'contracts from reference endpoint');
            return;
          }
        }

        // Fallback to snapshot
        console.log('📊 Trying snapshot endpoint...');
        const snapshotResp = await fetch(`/api/massive/options?symbol=${symbol}`);
        
        if (snapshotResp.ok) {
          const snapshotJson = await snapshotResp.json();
          const rawData = snapshotJson?.data || snapshotJson;
          
          if (rawData?.results && Array.isArray(rawData.results)) {
            setContracts(rawData.results);
            setDataSource('snapshot');
            console.log('✅ Got', rawData.results.length, 'contracts from snapshot endpoint');
            return;
          }
        }

        setError('No contracts found in response');
      } else {
        setError('Massive API is disabled. Set NEXT_PUBLIC_USE_MASSIVE=true');
      }
    } catch (err: any) {
      console.error('Error fetching options:', err);
      setError(err.message || 'Failed to fetch options data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userAuthenticated) {
      fetchOptionsData();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchOptionsData, 30000);
      return () => clearInterval(interval);
    }
  }, [userAuthenticated]);

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Checking authentication...</p>
        <style jsx>{`
          .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            gap: 1rem;
            background: #0a0a0a;
          }

          .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          p {
            color: #9ca3af;
          }
        `}</style>
      </div>
    );
  }

  if (!userAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Loading {symbol} options...</p>
        <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
          Data source: {dataSource}
        </p>
        <style jsx>{`
          .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            gap: 1rem;
            background: #0a0a0a;
          }

          .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          p {
            color: #9ca3af;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <h1 className="brand">TRADION</h1>
          <p className="subtitle">AAPL OPTIONS DATA</p>
        </div>
        <div className="header-actions">
          <div className="data-source-badge">
            Data: {dataSource.toUpperCase()}
          </div>
          <a href="/" className="back-button">
            ← Back to Main
          </a>
        </div>
      </div>

      {/* Symbol Header */}
      <div className="symbol-header">
        <div className="symbol-name">{symbol}</div>
        <div className="contracts-count">
          {contracts.length} contracts found
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Contracts List */}
      <div className="contracts-container">
        {contracts.length > 0 ? (
          <div className="contracts-list">
            {contracts.map((contract, index) => (
              <div key={contract.ticker || index} className="contract-card">
                <div className="contract-header">
                  <span className="contract-ticker">{contract.ticker}</span>
                  <span className={`contract-type ${contract.contract_type?.toLowerCase()}`}>
                    {contract.contract_type || 'N/A'}
                  </span>
                </div>
                <div className="contract-details">
                  <div className="detail-item">
                    <span className="detail-label">Underlying:</span>
                    <span className="detail-value">{contract.underlying_ticker || contract.underlying_asset?.ticker || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Strike:</span>
                    <span className="detail-value">${contract.strike_price || contract.details?.strike_price || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Expiration:</span>
                    <span className="detail-value">{contract.expiration_date || contract.details?.expiration_date || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            <p>No contracts found</p>
            <button onClick={fetchOptionsData} className="retry-button">
              Retry
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .app {
          min-height: 100vh;
          background: #0a0a0a;
          padding: 2rem;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-content {
          flex: 1;
        }

        .brand {
          font-size: 2.5rem;
          font-weight: 800;
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

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .data-source-badge {
          background: rgba(255, 255, 255, 0.1);
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.75rem;
          color: ${dataSource === 'reference' ? '#10b981' : dataSource === 'snapshot' ? '#3b82f6' : '#9ca3af'};
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .back-button {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-size: 0.85rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .symbol-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .symbol-name {
          font-size: 4rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.5rem;
          letter-spacing: 0.05em;
        }

        .contracts-count {
          font-size: 1rem;
          color: #9ca3af;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .contracts-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .contracts-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1rem;
        }

        .contract-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .contract-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .contract-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .contract-ticker {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          font-family: monospace;
        }

        .contract-type {
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .contract-type.call {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .contract-type.put {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .contract-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .detail-label {
          font-size: 0.85rem;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .detail-value {
          font-size: 0.9rem;
          font-weight: 600;
          color: #ffffff;
        }

        .no-data {
          text-align: center;
          padding: 4rem 2rem;
          color: #9ca3af;
        }

        .retry-button {
          margin-top: 1rem;
          padding: 12px 24px;
          background: #3b82f6;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .retry-button:hover {
          background: #2563eb;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .contracts-list {
            grid-template-columns: 1fr;
          }

          .symbol-name {
            font-size: 3rem;
          }

          .header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
