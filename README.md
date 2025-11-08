# Financial Backtesting Platform

A no-code financial backtesting platform that supports multiple asset classes (stocks, options, crypto, forex) with a visual interface.

## Features

- **Multi-Asset Support**: Backtest strategies across stocks, cryptocurrencies, forex, and options
- **Visual Strategy Builder**: Create strategies without writing code
- **Comprehensive Metrics**: Track performance with detailed analytics (Sharpe ratio, drawdown, win rate, etc.)
- **Interactive Charts**: Visualize equity curves and performance metrics
- **Template Library**: Start with pre-built strategies or create custom ones

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

### Tech Stack

**Backend:**
- Python 3.10+ with FastAPI
- Backtesting.py for strategy execution
- yfinance for market data
- PostgreSQL for data storage (optional)

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Recharts for data visualization

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- pip and npm

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

5. Run the backend server:
```bash
python -m uvicorn app.main:app --reload
```

The backend API will be available at `http://localhost:8000`

API documentation will be at `http://localhost:8000/api/v1/docs`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

### Running Your First Backtest

1. **Access the Application**: Open `http://localhost:5173` in your browser

2. **Navigate to Backtest**: Click on "Backtest" in the sidebar

3. **Configure Your Test**:
   - Symbol: Enter a stock symbol (e.g., AAPL, MSFT) or crypto (BTC-USD)
   - Asset Class: Select the type of asset
   - Date Range: Choose your backtest period
   - Initial Capital: Set your starting capital
   - Commission: Set transaction fees

4. **Run the Backtest**: Click "Run Backtest" button

5. **Analyze Results**: View performance metrics, equity curve, and trade history

### Example: SMA Crossover Strategy

The platform includes a built-in Simple Moving Average (SMA) Crossover strategy:

- **Entry Signal**: Buy when 50-day SMA crosses above 200-day SMA (Golden Cross)
- **Exit Signal**: Sell when 50-day SMA crosses below 200-day SMA (Death Cross)

Try it with these symbols:
- **Stocks**: AAPL, MSFT, GOOGL, TSLA
- **Crypto**: BTC-USD, ETH-USD
- **Date Range**: 2020-01-01 to 2024-01-01

## API Endpoints

### Backtest
- `POST /api/v1/backtest/run` - Run a backtest
- `GET /api/v1/backtest/status/{id}` - Get backtest status

### Strategies
- `GET /api/v1/strategies/` - List all strategies
- `POST /api/v1/strategies/` - Create a new strategy
- `GET /api/v1/strategies/{id}` - Get a specific strategy
- `PUT /api/v1/strategies/{id}` - Update a strategy
- `DELETE /api/v1/strategies/{id}` - Delete a strategy
- `GET /api/v1/strategies/templates/list` - Get strategy templates

### Data
- `POST /api/v1/data/fetch` - Fetch historical market data
- `GET /api/v1/data/search` - Search for symbols
- `GET /api/v1/data/available-assets` - List supported asset classes

## Project Structure

```
back/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Utilities
│   │   ├── config.py     # Configuration
│   │   └── main.py       # FastAPI application
│   ├── backtesting/
│   │   ├── engine.py     # Backtest engine
│   │   ├── strategies/   # Strategy definitions
│   │   ├── indicators/   # Technical indicators
│   │   └── data/         # Data processing
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API clients
│   │   ├── types/        # TypeScript types
│   │   └── App.tsx       # Main application
│   └── package.json
├── shared/
│   ├── schemas/          # Shared validation schemas
│   └── types/            # Shared type definitions
└── data/                 # Data storage
```

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Running Tests

Backend:
```bash
cd backend
pytest
```

Frontend:
```bash
cd frontend
npm test
```

## Building for Production

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## Supported Technical Indicators

- Simple Moving Average (SMA)
- Exponential Moving Average (EMA)
- Relative Strength Index (RSI)
- MACD (Moving Average Convergence Divergence)
- Bollinger Bands
- Average True Range (ATR)
- Stochastic Oscillator

## Roadmap

- [ ] Additional strategy templates
- [ ] Walk-forward analysis
- [ ] Monte Carlo simulations
- [ ] Portfolio-level backtesting
- [ ] Live trading integration
- [ ] Paper trading mode
- [ ] Machine learning optimization
- [ ] Social features (share strategies)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Support

For issues or questions, please open an issue on GitHub.

## Acknowledgments

- Built with [Backtesting.py](https://kernc.github.io/backtesting.py/)
- Market data from [yfinance](https://github.com/ranaroussi/yfinance)
- UI components with [TailwindCSS](https://tailwindcss.com/)
