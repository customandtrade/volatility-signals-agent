'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dashboard } from '@/components/Dashboard';
import { ETradeAuth } from '@/components/ETradeAuth';
import { SymbolAnalysis, MarketData, OptionsData } from '@/types/agent';
import { VolatilitySignalsAgent } from '@/core/agent';
import { MockETradeClient } from '@/services/etrade';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const AVAILABLE_ETFS = ['TQQQ', 'SQQQ', 'SPY', 'QQQ', 'IWM', 'DIA'];

export default function Home() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<SymbolAnalysis | null>(null);
  const [symbol, setSymbol] = useState('SPY');
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [accessTokenSecret, setAccessTokenSecret] = useState<string>('');
  const [useMock, setUseMock] = useState(true);
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

      if (useMock || !authenticated) {
        // Use mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        marketData = MockETradeClient.generateMarketData(symbol, 50);
        const currentPrice = marketData[marketData.length - 1].price;
        optionsData = MockETradeClient.generateOptionsData(symbol, currentPrice);
        historicalIV = MockETradeClient.generateHistoricalIV(252);
      } else {
        // Use real E*TRADE data
        const marketResponse = await fetch(
          `/api/etrade/market?symbol=${symbol}&accessToken=${accessToken}&accessTokenSecret=${accessTokenSecret}`
        );
        const marketResult = await marketResponse.json();
        
        if (!marketResponse.ok) {
          throw new Error(marketResult.error || 'Failed to fetch market data');
        }

        marketData = marketResult.historical || [marketResult.current];
        
        const optionsResponse = await fetch(
          `/api/etrade/options?symbol=${symbol}&accessToken=${accessToken}&accessTokenSecret=${accessTokenSecret}`
        );
        const optionsResult = await optionsResponse.json();
        
        if (!optionsResponse.ok) {
          throw new Error(optionsResult.error || 'Failed to fetch options data');
        }

        optionsData = optionsResult;

        const ivResponse = await fetch(
          `/api/etrade/iv?symbol=${symbol}&days=252&accessToken=${accessToken}&accessTokenSecret=${accessTokenSecret}`
        );
        const ivResult = await ivResponse.json();
        
        if (!ivResponse.ok) {
          throw new Error(ivResult.error || 'Failed to fetch IV data');
        }

        historicalIV = ivResult.iv;
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
    if (!authenticated && !useMock) {
      return; // Wait for authentication
    }

    analyzeSymbol();

    // Auto-refresh every 30 seconds
    const interval = setInterval(analyzeSymbol, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, authenticated, useMock, accessToken, accessTokenSecret]);

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

  const handleAuthenticated = (token: string, secret: string) => {
    setAccessToken(token);
    setAccessTokenSecret(secret);
    setAuthenticated(true);
    setUseMock(false);
  };

  const handleUseMock = () => {
    setUseMock(true);
    setAuthenticated(false);
  };

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

  // Show E*TRADE auth screen if not authenticated with E*TRADE and not using mock
  if (!authenticated && !useMock) {
    return (
      <div className="app">
        <ETradeAuth onAuthenticated={handleAuthenticated} onUseMock={handleUseMock} />
      </div>
    );
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

