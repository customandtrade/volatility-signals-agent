'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Redirect to dashboard
        router.push('/');
        router.refresh(); // Refresh to update auth state
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-panel">
        <h1 className="auth-title">Sign In</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <Link href="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="register-text">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="register-link">
              Register
            </Link>
          </p>
          <Link href="/" className="back-link">
            ← Back to home
          </Link>
        </div>
      </div>

      <div className="branding">
        <div className="brand-top">
          <h2 className="brand-name">TRADION</h2>
          <p className="brand-slogan">AI-Driven Volatility Context Signals</p>
        </div>
        <div className="brand-bottom">
          <p className="brand-credit">by Javi Gil</p>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          position: relative;
          padding: 2rem;
        }

        .auth-panel {
          width: 100%;
          max-width: 450px;
          background: #1f2937;
          border-radius: 16px;
          padding: 3rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .auth-title {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 2rem 0;
          text-align: center;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #ffffff;
        }

        .form-group input {
          padding: 0.75rem 1rem;
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          background: #0f172a;
        }

        .form-group input::placeholder {
          color: #6b7280;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #ffffff;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #10b981;
        }

        .forgot-link {
          color: #10b981;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s;
        }

        .forgot-link:hover {
          color: #059669;
        }

        .auth-button {
          padding: 0.875rem 2rem;
          background: #10b981;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.5rem;
        }

        .auth-button:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .auth-button:active {
          transform: translateY(0);
        }

        .auth-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          border-radius: 8px;
          color: #ef4444;
          font-size: 0.9rem;
          text-align: center;
        }

        .auth-footer {
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
        }

        .register-text {
          color: #ffffff;
          font-size: 0.9rem;
          margin: 0;
        }

        .register-link {
          color: #10b981;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .register-link:hover {
          color: #059669;
        }

        .back-link {
          color: #9ca3af;
          text-decoration: none;
          font-size: 0.85rem;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #ffffff;
        }

        .branding {
          position: absolute;
          bottom: 2rem;
          right: 2rem;
          text-align: right;
        }

        .brand-top {
          margin-bottom: 1rem;
        }

        .brand-name {
          font-size: 2.5rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.5rem 0;
          letter-spacing: 0.1em;
        }

        .brand-slogan {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          font-weight: 500;
        }

        .brand-bottom {
          margin-top: 1rem;
        }

        .brand-credit {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        @media (max-width: 768px) {
          .auth-container {
            flex-direction: column;
          }

          .auth-panel {
            max-width: 100%;
            margin: 1rem;
            padding: 2rem;
          }

          .branding {
            position: relative;
            bottom: auto;
            right: auto;
            text-align: center;
            margin-top: 2rem;
            padding: 0 2rem;
          }
        }
      `}</style>
    </div>
  );
}

