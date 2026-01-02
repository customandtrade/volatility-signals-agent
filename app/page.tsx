'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dashboard } from '@/components/Dashboard';
import { SymbolAnalysis, MarketData, OptionsData } from '@/types/agent';
import { VolatilitySignalsAgent } from '@/core/agent';
import { MockETradeClient } from '@/services/mockEtrade';
import { supabase } from '@/lib/supabase';
import {
  mapMassiveMarketToMarketData,
  mapMassiveOptionsToOptionsData,
  mapMassiveIVToHistoricalIV,
} from '@/services/massive-mapper';

export const dynamic = 'force-dynamic';

const AVAILABLE_ETFS = ['TQQQ', 'SQQQ', 'SPY', 'QQQ', 'IWM', 'DIA'];

export default function Home() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<SymbolAnalysis | null>(null);
  const [symbol, setSymbol] = useState('SPY');
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  // We always use mock data in this project iteration
  const [currentMarketData, setCurrentMarketData] = useState<MarketData[]>([]);

  // Check if user is authenticated with Supabase
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUserAuthenticated(true);
        } else {
          // Redirect to login if not authenticated
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

    // Listen for auth changes
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

  const analyzeSymbol = async () => {
    setLoading(true);
    
    try {
      let marketData: MarketData[];
      let optionsData: OptionsData;
      let historicalIV: number[];

      // If environment enables Massive, try fetching from our server-side proxy
      const useMassive = process.env.NEXT_PUBLIC_USE_MASSIVE === 'true';

      if (useMassive) {
        try {
          let currentPrice = 0;
          marketData = []; // Initialize to avoid linting errors
          
          // First, try to get market data from Massive API
          const marketResp = await fetch(`/api/massive/market?symbol=${symbol}`);
          const marketJson = await marketResp.json();
          
          // Check if we got valid market data
          if (marketResp.ok && !marketJson.fallback) {
            const results = marketJson?.data?.results || [];
            if (results.length > 0) {
              const r = results[0];
              const price = (r?.last_trade?.price ?? r?.last_trade_price ?? r?.price ?? r?.last ?? r?.close ?? r?.lastPrice) || 0;
              const volume = r?.volume ?? r?.last_trade?.size ?? r?.session?.volume ?? 0;
              currentPrice = price;
              marketData = [{ symbol, price, volume, timestamp: Date.now() }];
              console.log('✅ Got market data from Massive:', { price, volume });
            }
          }

          // Fetch options data from Massive API (this should work with your plan)
          let rawOptionsData: any = null;
          const optionsResp = await fetch(`/api/massive/options?symbol=${symbol}`);
          if (optionsResp.ok) {
            const optionsJson = await optionsResp.json();
            rawOptionsData = optionsJson?.data || optionsJson;
            
            // Extract underlying price from options if we don't have market data
            if (currentPrice === 0 && rawOptionsData?.results && Array.isArray(rawOptionsData.results) && rawOptionsData.results.length > 0) {
              const firstContract = rawOptionsData.results[0];
              const underlying = firstContract?.underlying_asset;
              if (underlying?.last_trade?.price) {
                currentPrice = underlying.last_trade.price;
                const volume = underlying.session?.volume || 0;
                marketData = [{ symbol, price: currentPrice, volume, timestamp: Date.now() }];
                console.log('✅ Extracted underlying price from options:', currentPrice);
              }
            }
            
            // If still no price, use a default based on symbol
            if (currentPrice === 0) {
              const defaultPrices: { [key: string]: number } = {
                SPY: 500, QQQ: 400, AAPL: 180, MSFT: 400, TSLA: 250,
              };
              currentPrice = defaultPrices[symbol] || 100;
              marketData = [{ symbol, price: currentPrice, volume: 0, timestamp: Date.now() }];
              console.warn('⚠️ Using default price for', symbol, ':', currentPrice);
            }

            // Map options data
            optionsData = mapMassiveOptionsToOptionsData(
              rawOptionsData,
              symbol,
              currentPrice
            );

            // Extract IV from options contracts (Massive doesn't have historical IV endpoint)
            const { extractIVFromOptionsContracts } = await import('@/services/massive-mapper');
            const extractedIVs = extractIVFromOptionsContracts(rawOptionsData);
            if (extractedIVs.length > 0) {
              // Use extracted IVs, pad with average if needed for 252 days
              const avgIV = extractedIVs.reduce((a, b) => a + b, 0) / extractedIVs.length;
              historicalIV = extractedIVs;
              // Pad to 252 days with average IV for historical context
              while (historicalIV.length < 252) {
                historicalIV.push(avgIV);
              }
              console.log('✅ Extracted', extractedIVs.length, 'IV values from options contracts');
            } else {
              console.warn('No IV found in options contracts, using mock');
              historicalIV = MockETradeClient.generateHistoricalIV(252);
            }
          } else {
            console.warn('Massive options API failed, using mock data');
            marketData = MockETradeClient.generateMarketData(symbol, 50);
            currentPrice = marketData[marketData.length - 1].price;
            optionsData = MockETradeClient.generateOptionsData(symbol, currentPrice);
            historicalIV = MockETradeClient.generateHistoricalIV(252);
          }
        } catch (massiveError: any) {
          console.error('Error fetching from Massive API:', massiveError);
          // Fallback to mock data on any error
          marketData = MockETradeClient.generateMarketData(symbol, 50);
          const currentPrice = marketData[marketData.length - 1].price;
          optionsData = MockETradeClient.generateOptionsData(symbol, currentPrice);
          historicalIV = MockETradeClient.generateHistoricalIV(252);
        }
      } else {
        // fallback to mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        marketData = MockETradeClient.generateMarketData(symbol, 50);
        const currentPrice = marketData[marketData.length - 1].price;
        optionsData = MockETradeClient.generateOptionsData(symbol, currentPrice);
        historicalIV = MockETradeClient.generateHistoricalIV(252);
      }

      // Run agent analysis
      const result = VolatilitySignalsAgent.analyze(
        symbol,
        marketData,
        optionsData,
        historicalIV
      );

      setAnalysis(result);
      setCurrentMarketData(marketData);
    } catch (error: any) {
      console.error('Analysis error:', error);
      // Fallback to mock data on error
      const marketData = MockETradeClient.generateMarketData(symbol, 50);
      const currentPrice = marketData[marketData.length - 1].price;
      const optionsData = MockETradeClient.generateOptionsData(symbol, currentPrice);
      const historicalIV = MockETradeClient.generateHistoricalIV(252);
      
      const result = VolatilitySignalsAgent.analyze(
        symbol,
        marketData,
        optionsData,
        historicalIV
      );
      
      setAnalysis(result);
      setCurrentMarketData(marketData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeSymbol();

    // Auto-refresh every 30 seconds
    const interval = setInterval(analyzeSymbol, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  const handleSymbolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSymbol(e.target.value);
  };

  // Generate mock data for all ETFs
  const allETFData = useMemo(() => {
    const basePrices: { [key: string]: number } = {
      SPY: 500,
      QQQ: 400,
      TQQQ: 50,
      SQQQ: 8,
      IWM: 200,
      DIA: 350,
    };

    return AVAILABLE_ETFS.map((etf) => {
      // If this is the current symbol, use real market data
      if (etf === symbol && currentMarketData.length > 0) {
        const currentPrice = currentMarketData[currentMarketData.length - 1].price;
        const previousPrice = currentMarketData.length > 1 
          ? currentMarketData[currentMarketData.length - 2].price 
          : currentPrice;
        const change = currentPrice - previousPrice;
        const changePercent = (change / previousPrice) * 100;

        return {
          symbol: etf,
          price: currentPrice,
          change: change,
          changePercent: changePercent,
        };
      }

      // For other ETFs, generate mock data
      const basePrice = basePrices[etf] || 100;
      // Generate random change between -10% and +10%
      const changePercent = (Math.random() * 20 - 10);
      const change = basePrice * (changePercent / 100);
      const price = basePrice + change;

      return {
        symbol: etf,
        price: price,
        change: change,
        changePercent: changePercent,
      };
    });
  }, [symbol, currentMarketData]);

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
            to {
              transform: rotate(360deg);
            }
          }

          p {
            color: #9ca3af;
          }
        `}</style>
      </div>
    );
  }

  // Redirect to login if not authenticated (this should not be reached due to useEffect, but just in case)
  if (!userAuthenticated) {
    return null; // useEffect will handle redirect
  }



  if (loading || !analysis) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Analyzing {symbol}...</p>
        <style jsx>{`
          .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            gap: 1rem;
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
            to {
              transform: rotate(360deg);
            }
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
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
      }}>
        <a
          href="/aapl"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '0.9rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
          }}
        >
          📊 Test AAPL (Massive API)
        </a>
      </div>
      <Dashboard 
        analysis={analysis} 
        allETFs={allETFData}
        onSymbolChange={(sym) => setSymbol(sym)}
        marketData={currentMarketData}
      />
      <style jsx>{`
        .app {
          min-height: 100vh;
          background: #0a0a0a;
        }
      `}</style>
    </div>
  );
}

