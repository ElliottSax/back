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

    # Class-level cache shared across all instances
    _cache = {}

    def __init__(self):
        # Use class-level cache
        self.cache = DataService._cache

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
        # Create cache key with version suffix to invalidate old cached data
        # v2 = Yahoo Finance with split-adjusted data (auto_adjust=True)
        cache_key = f"{symbol}_{asset_class}_{start_date.date()}_{end_date.date()}_{timeframe}_v2"

        # Check cache
        if cache_key in self.cache:
            print(f"✅ CACHE HIT for {cache_key}")
            print(f"   Returning {len(self.cache[cache_key])} cached rows")
            print(f"   Date range: {self.cache[cache_key].index.min()} to {self.cache[cache_key].index.max()}")
            print(f"   Sample prices: Open={self.cache[cache_key]['open'].iloc[0]:.2f}, Close={self.cache[cache_key]['close'].iloc[0]:.2f}")
            return self.cache[cache_key].copy()

        print(f"❌ CACHE MISS for {cache_key}")

        # Fetch data based on asset class
        if asset_class == AssetClass.STOCK:
            # Try Yahoo Finance first (free split-adjusted data), fallback to Alpha Vantage
            try:
                print(f"Fetching {symbol} from Yahoo Finance...")
                df = await self._fetch_yfinance_data(symbol, start_date, end_date, timeframe)
                print(f"Yahoo Finance returned {len(df)} rows")
            except Exception as e:
                import traceback
                print(f"Yahoo Finance failed for {symbol}: {str(e)}")
                print(f"Traceback: {traceback.format_exc()}")
                print(f"Trying Alpha Vantage fallback...")
                try:
                    df = await self._fetch_alpha_vantage_data(symbol, start_date, end_date, timeframe)
                    print(f"Alpha Vantage returned {len(df)} rows")
                except Exception as av_error:
                    print(f"Alpha Vantage also failed: {str(av_error)}")
                    print(f"AV Traceback: {traceback.format_exc()}")
                    raise
        elif asset_class == AssetClass.CRYPTO:
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
        print(f"💾 Cached {len(df)} rows for key: {cache_key}")
        print(f"   Date range: {df.index.min()} to {df.index.max()}")
        print(f"   Sample prices: Open={df['open'].iloc[0]:.2f}, Close={df['close'].iloc[0]:.2f}")

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
            import asyncio
            from functools import partial

            # Run yfinance in thread pool since it's synchronous
            loop = asyncio.get_event_loop()
            fetch_func = partial(
                self._fetch_yfinance_sync,
                symbol,
                start_date,
                end_date,
                timeframe
            )
            df = await loop.run_in_executor(None, fetch_func)

            if df.empty:
                raise ValueError(f"No data returned for {symbol}")

            return df

        except Exception as e:
            raise Exception(f"Error fetching data from Yahoo Finance: {str(e)}")

    def _fetch_yfinance_sync(
        self,
        symbol: str,
        start_date: datetime,
        end_date: datetime,
        timeframe: str
    ) -> pd.DataFrame:
        """Synchronous yfinance fetch with retry logic."""
        import time

        max_retries = 3
        retry_delay = 2  # seconds

        for attempt in range(max_retries):
            try:
                print(f"Yahoo Finance attempt {attempt + 1}/{max_retries} for {symbol}")

                ticker = yf.Ticker(symbol)

                # Fetch with split-adjusted data
                df = ticker.history(
                    start=start_date,
                    end=end_date,
                    interval=timeframe,
                    auto_adjust=True,  # Split and dividend adjusted
                    actions=False  # Don't need dividend/split columns
                )

                # Validate data
                if df is None or df.empty:
                    raise ValueError(f"Empty DataFrame returned for {symbol}")

                if len(df) < 10:
                    print(f"⚠️  Warning: Only {len(df)} rows returned for {symbol}, expected more")

                # Log first row for debugging
                if len(df) > 0:
                    first_row = df.iloc[0]
                    print(f"✅ Yahoo Finance success! First row: Date={df.index[0]}, Open={first_row['Open']:.2f}, Close={first_row['Close']:.2f}")

                return df

            except Exception as e:
                print(f"❌ Yahoo Finance attempt {attempt + 1} failed: {str(e)}")

                if attempt < max_retries - 1:
                    print(f"⏳ Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    print(f"💥 All Yahoo Finance attempts failed for {symbol}")
                    raise

        raise Exception(f"Failed to fetch {symbol} from Yahoo Finance after {max_retries} attempts")

    async def _fetch_alpha_vantage_data(
        self,
        symbol: str,
        start_date: datetime,
        end_date: datetime,
        timeframe: str
    ) -> pd.DataFrame:
        """Fetch stock data using Alpha Vantage."""
        from alpha_vantage.timeseries import TimeSeries
        from app.config import settings
        import asyncio
        from functools import partial

        if not settings.ALPHA_VANTAGE_API_KEY:
            raise ValueError("Alpha Vantage API key not configured")

        # Run Alpha Vantage in thread pool since it's synchronous
        loop = asyncio.get_event_loop()
        fetch_func = partial(
            self._fetch_alpha_vantage_sync,
            symbol,
            start_date,
            end_date
        )
        df = await loop.run_in_executor(None, fetch_func)

        return df

    def _fetch_alpha_vantage_sync(
        self,
        symbol: str,
        start_date: datetime,
        end_date: datetime
    ) -> pd.DataFrame:
        """Synchronous Alpha Vantage fetch (free tier - not split-adjusted)."""
        from alpha_vantage.timeseries import TimeSeries
        from app.config import settings

        ts = TimeSeries(key=settings.ALPHA_VANTAGE_API_KEY, output_format='pandas')
        # Use get_daily (free tier) - note: not split-adjusted
        df, meta = ts.get_daily(symbol=symbol, outputsize='full')

        print(f"Alpha Vantage raw response: {len(df)} rows")
        print(f"Date range: {df.index.min()} to {df.index.max()}")

        # Rename columns
        df = df.rename(columns={
            '1. open': 'Open',
            '2. high': 'High',
            '3. low': 'Low',
            '4. close': 'Close',
            '5. volume': 'Volume'
        })

        # Convert index to datetime and sort
        df.index = pd.to_datetime(df.index)
        df = df.sort_index()  # Sort in ascending order

        print(f"Requested date range: {start_date} to {end_date}")

        # Filter by date range
        df = df[(df.index >= start_date) & (df.index <= end_date)]

        print(f"After filtering: {len(df)} rows")

        return df

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
        cache_size = len(self.cache)
        self.cache.clear()
        DataService._cache.clear()
        print(f"🗑️  Cache cleared! Removed {cache_size} entries")
        return {"message": f"Cache cleared! Removed {cache_size} entries", "cleared_count": cache_size}

    @classmethod
    def get_cache_stats(cls):
        """Get cache statistics."""
        return {
            "size": len(cls._cache),
            "keys": list(cls._cache.keys())
        }
