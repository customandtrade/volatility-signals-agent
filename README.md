# Volatility Signals Agent

A professional web application that acts as a volatility selling signals agent. The app identifies high-probability volatility selling contexts and generates defined-risk Call Credit Spread ideas.

## Features

- **Deterministic State Machine**: Each symbol is in one of three states (WAIT, WATCH, SELL)
- **Five Core Metrics**: Fear, Overpricing, Exhaustion, Options Liquidity, Tradable Structure
- **Professional Dashboard**: Modern, clean UI with animated metric bars
- **E*TRADE Integration**: Structure ready for E*TRADE API integration
- **Context-First Approach**: Shows reasoning, not just signals

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Architecture

### Core Components

- **Agent State Machine** (`src/core/agent-state.ts`): Determines state transitions
- **Metrics** (`src/core/metrics/`): Five independent metric calculators
- **Agent** (`src/core/agent.ts`): Main orchestrator
- **Market Data (Massive)** (`src/services/massive.ts`): API integration structure (using server-side proxy endpoints under `app/api/massive/*`)

### Signal Rule

A SELL signal is emitted **only** if all five metrics meet their criteria. If any metric fails, the state must be WAIT or WATCH, and no signal is allowed.

## E*TRADE API Setup

The application now supports real E*TRADE API integration with OAuth 1.0a authentication.

### Credentials Setup

1. Place your E*TRADE credentials in `src/services/etrade.env`:
   ```
   ETRADE_CONSUMER_KEY=your_consumer_key
   ETRADE_CONSUMER_SECRET=your_consumer_secret
   ```

2. The app will automatically load these credentials when making API calls.

### Authentication Flow

1. **Start the app**: Run `npm run dev`
2. **Connect to E*TRADE**: Click "Connect to E*TRADE" on the authentication screen
3. **Authorize**: A popup will open with E*TRADE's authorization page
4. **Get verification code**: After authorizing, E*TRADE will provide a verification code
5. **Enter code**: Paste the verification code in the app and click "Verify"
6. **Start using real data**: Once authenticated, the app will use live market data

### Using Mock Data

You can continue using mock data for testing by clicking "Use Mock Data" on the authentication screen. The app will show a "Mock Data" badge when using simulated data.

### API Endpoints

The app creates the following API routes:
- `/api/etrade/auth` - OAuth authentication
- `/api/etrade/market` - Market data retrieval
- `/api/etrade/options` - Options chain data
- `/api/etrade/iv` - Historical IV data

## Project Structure

```
volatility-signals-agent/
├── app/                 # Next.js app directory
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Main dashboard page
│   └── globals.css     # Global styles
├── src/
│   ├── components/     # React components
│   ├── core/          # Agent logic
│   ├── services/      # External API clients
│   └── types/         # TypeScript types
└── package.json
```

## Philosophy

- **Context over indicators**: Show why, not just what
- **Confirmation over prediction**: Wait for full alignment
- **Quality over frequency**: Better signals, not more signals
- **Professional UX**: Calm, clear, no gambling visuals

