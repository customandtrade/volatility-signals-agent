'use client';

import React, { useState, useEffect } from 'react';

interface ETradeAuthProps {
  onAuthenticated: (accessToken: string, accessTokenSecret: string) => void;
  onUseMock: () => void;
}

export const ETradeAuth: React.FC<ETradeAuthProps> = ({ onAuthenticated, onUseMock }) => {
  const [step, setStep] = useState<'init' | 'auth' | 'verifying'>('init');
  const [authUrl, setAuthUrl] = useState<string>('');
  const [verifier, setVerifier] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [requestToken, setRequestToken] = useState<string>('');
  const [requestTokenSecret, setRequestTokenSecret] = useState<string>('');

  const handleStartAuth = async () => {
    try {
      setError('');
      setStep('auth');
      
      const response = await fetch('/api/etrade/auth');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get request token');
      }
      
      setAuthUrl(data.authUrl);
      setRequestToken(data.requestToken);
      setRequestTokenSecret(data.requestTokenSecret);
      
      // Store in sessionStorage for persistence
      sessionStorage.setItem('etrade_request_token', data.requestToken);
      sessionStorage.setItem('etrade_request_token_secret', data.requestTokenSecret);
      
      // Open auth URL in new window
      window.open(data.authUrl, 'etrade-auth', 'width=600,height=700');
    } catch (err: any) {
      setError(err.message);
      setStep('init');
    }
  };

  const handleVerify = async () => {
    try {
      setError('');
      setStep('verifying');
      
      // Get request token from state or sessionStorage
      const token = requestToken || sessionStorage.getItem('etrade_request_token') || '';
      const secret = requestTokenSecret || sessionStorage.getItem('etrade_request_token_secret') || '';
      
      if (!token || !secret) {
        throw new Error('Request token not found. Please start authentication again.');
      }
      
      const verifyResponse = await fetch('/api/etrade/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verifier,
          requestToken: token,
          requestTokenSecret: secret,
        }),
      });
      
      const accessData = await verifyResponse.json();
      
      if (!verifyResponse.ok) {
        throw new Error(accessData.error || 'Failed to get access token');
      }
      
      // Clear session storage
      sessionStorage.removeItem('etrade_request_token');
      sessionStorage.removeItem('etrade_request_token_secret');
      
      onAuthenticated(accessData.accessToken, accessData.accessTokenSecret);
    } catch (err: any) {
      setError(err.message);
      setStep('auth');
    }
  };

  // Check for existing request tokens on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('etrade_request_token');
    const storedSecret = sessionStorage.getItem('etrade_request_token_secret');
    if (storedToken && storedSecret) {
      setRequestToken(storedToken);
      setRequestTokenSecret(storedSecret);
      setStep('auth');
    }
  }, []);

  return (
    <div className="etrade-auth">
      <div className="auth-card">
        <h3>E*TRADE Authentication</h3>
        
        {step === 'init' && (
          <div className="auth-content">
            <p>Connect to E*TRADE API to use real market data, or continue with mock data for testing.</p>
            <div className="auth-buttons">
              <button onClick={handleStartAuth} className="btn-primary">
                Connect to E*TRADE
              </button>
              <button onClick={onUseMock} className="btn-secondary">
                Use Mock Data
              </button>
            </div>
          </div>
        )}
        
        {step === 'auth' && (
          <div className="auth-content">
            <p>1. Authorize the application in the popup window</p>
            <p>2. Copy the verification code from E*TRADE</p>
            <p>3. Paste it below and click Verify</p>
            
            <div className="verifier-input">
              <input
                type="text"
                value={verifier}
                onChange={(e) => setVerifier(e.target.value)}
                placeholder="Enter verification code"
              />
              <button onClick={handleVerify} disabled={!verifier || step === 'verifying'}>
                {step === 'verifying' ? 'Verifying...' : 'Verify'}
              </button>
            </div>
            
            <button onClick={() => setStep('init')} className="btn-link">
              Cancel
            </button>
          </div>
        )}
        
        {step === 'verifying' && (
          <div className="auth-content">
            <p>Verifying authentication...</p>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>

      <style jsx>{`
        .etrade-auth {
          max-width: 500px;
          margin: 2rem auto;
          padding: 0 2rem;
        }

        .auth-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 2rem;
        }

        h3 {
          margin: 0 0 1.5rem 0;
          color: #ffffff;
          font-size: 1.3rem;
        }

        .auth-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .auth-content p {
          color: #9ca3af;
          margin: 0;
          line-height: 1.6;
        }

        .auth-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: #3b82f6;
          color: #ffffff;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .verifier-input {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .verifier-input input {
          flex: 1;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #ffffff;
        }

        .verifier-input input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .verifier-input button {
          padding: 0.75rem 1.5rem;
          background: #3b82f6;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .verifier-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-link {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          text-decoration: underline;
          margin-top: 1rem;
        }

        .error-message {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          color: #ef4444;
        }
      `}</style>
    </div>
  );
};

