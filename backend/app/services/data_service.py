import pandas as pd
import yfinance as yf
from datetime import datetime
from typing import Optional
from app.api.backtest import AssetClass


class DataService:
    """
    Service for fetching historical market data from various sources.

    Supports multiple asset classes and data providers.
    """

    def __init__(self):
        self.cache = {}

    async def get_historical_data(
        self,
        symbol: str,
        asset_class: AssetClass,
        start_date: datetime,
        end_date: datetime,
        timeframe: str = "1d"
    ) -> pd.DataFrame:
        """
        Fetch historical data for a given symbol.

        Args:
            symbol: Asset symbol (e.g., 'AAPL', 'BTC-USD')
            asset_class: Type of asset
            start_date: Start date for historical data
            end_date: End date for historical data
            timeframe: Data interval (1d, 1h, 5m, etc.)

        Returns:
            DataFrame with OHLCV data
        """
        # Create cache key
        cache_key = f"{symbol}_{asset_class}_{start_date.date()}_{end_date.date()}_{timeframe}"

        # Check cache
        if cache_key in self.cache:
            return self.cache[cache_key].copy()

        # Fetch data based on asset class
        if asset_class in [AssetClass.STOCK, AssetClass.CRYPTO]:
            df = await self._fetch_yfinance_data(symbol, start_date, end_date, timeframe)
        elif asset_class == AssetClass.FOREX:
            df = await self._fetch_forex_data(symbol, start_date, end_date, timeframe)
        elif asset_class == AssetClass.OPTION:
            df = await self._fetch_option_data(symbol, start_date, end_date, timeframe)
        else:
            raise ValueError(f"Unsupported asset class: {asset_class}")

        # Normalize column names
        df = self._normalize_columns(df)

        # Cache the result
        self.cache[cache_key] = df.copy()

        return df

    async def _fetch_yfinance_data(
        self,
        symbol: str,
        start_date: datetime,
        end_date: datetime,
        timeframe: str
    ) -> pd.DataFrame:
        """Fetch data using Yahoo Finance."""
        try:
            ticker = yf.Ticker(symbol)
            df = ticker.history(
                start=start_date,
                end=end_date,
                interval=timeframe,
                auto_adjust=False  # Keep unadjusted prices
            )

            if df.empty:
                raise ValueError(f"No data returned for {symbol}")

            return df

        except Exception as e:
            raise Exception(f"Error fetching data from Yahoo Finance: {str(e)}")

    async def _fetch_forex_data(
        self,
        symbol: str,
        start_date: datetime,
        end_date: datetime,
        timeframe: str
    ) -> pd.DataFrame:
        """Fetch forex data using Alpha Vantage or other providers."""
        # TODO: Implement forex data fetching
        # For now, use Yahoo Finance as fallback
        forex_symbol = symbol.replace("/", "=X")
        return await self._fetch_yfinance_data(forex_symbol, start_date, end_date, timeframe)

    async def _fetch_option_data(
        self,
        symbol: str,
        start_date: datetime,
        end_date: datetime,
        timeframe: str
    ) -> pd.DataFrame:
        """Fetch options data."""
        # TODO: Implement options data fetching
        raise NotImplementedError("Options data not yet supported")

    def _normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Normalize column names to standard format.

        Ensures consistent column names across different data sources.
        """
        column_mapping = {
            'Open': 'open',
            'High': 'high',
            'Low': 'low',
            'Close': 'close',
            'Volume': 'volume',
            'Adj Close': 'adj_close',
            'Dividends': 'dividends',
            'Stock Splits': 'splits'
        }

        df = df.rename(columns=column_mapping)

        # Ensure required columns exist
        required_columns = ['open', 'high', 'low', 'close', 'volume']
        for col in required_columns:
            if col not in df.columns:
                raise ValueError(f"Missing required column: {col}")

        # Ensure index is datetime
        if not isinstance(df.index, pd.DatetimeIndex):
            df.index = pd.to_datetime(df.index)

        return df

    async def search_symbols(self, query: str, asset_class: Optional[AssetClass] = None):
        """
        Search for symbols matching the query.

        TODO: Implement proper symbol search
        """
        # Placeholder implementation
        return []

    def clear_cache(self):
        """Clear the data cache."""
        self.cache.clear()
