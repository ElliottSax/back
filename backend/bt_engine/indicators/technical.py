"""
Technical indicators for the backtesting platform.

Provides common technical analysis indicators used in trading strategies.
"""
import numpy as np
import pandas as pd
from typing import Union


def sma(data: Union[pd.Series, np.ndarray], period: int) -> pd.Series:
    """
    Simple Moving Average.

    Args:
        data: Price data
        period: Number of periods for the moving average

    Returns:
        SMA values as a pandas Series
    """
    if isinstance(data, np.ndarray):
        data = pd.Series(data)
    return data.rolling(window=period).mean()


def ema(data: Union[pd.Series, np.ndarray], period: int) -> pd.Series:
    """
    Exponential Moving Average.

    Args:
        data: Price data
        period: Number of periods for the moving average

    Returns:
        EMA values as a pandas Series
    """
    if isinstance(data, np.ndarray):
        data = pd.Series(data)
    return data.ewm(span=period, adjust=False).mean()


def rsi(data: Union[pd.Series, np.ndarray], period: int = 14) -> pd.Series:
    """
    Relative Strength Index.

    Args:
        data: Price data
        period: Number of periods (default: 14)

    Returns:
        RSI values as a pandas Series
    """
    if isinstance(data, np.ndarray):
        data = pd.Series(data)

    delta = data.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

    rs = gain / loss
    rsi_values = 100 - (100 / (1 + rs))

    return rsi_values


def macd(
    data: Union[pd.Series, np.ndarray],
    fast: int = 12,
    slow: int = 26,
    signal: int = 9
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """
    Moving Average Convergence Divergence.

    Args:
        data: Price data
        fast: Fast EMA period (default: 12)
        slow: Slow EMA period (default: 26)
        signal: Signal line period (default: 9)

    Returns:
        Tuple of (MACD line, Signal line, Histogram)
    """
    if isinstance(data, np.ndarray):
        data = pd.Series(data)

    ema_fast = ema(data, fast)
    ema_slow = ema(data, slow)

    macd_line = ema_fast - ema_slow
    signal_line = ema(macd_line, signal)
    histogram = macd_line - signal_line

    return macd_line, signal_line, histogram


def bollinger_bands(
    data: Union[pd.Series, np.ndarray],
    period: int = 20,
    std_dev: float = 2.0
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """
    Bollinger Bands.

    Args:
        data: Price data
        period: Number of periods (default: 20)
        std_dev: Number of standard deviations (default: 2.0)

    Returns:
        Tuple of (Upper band, Middle band, Lower band)
    """
    if isinstance(data, np.ndarray):
        data = pd.Series(data)

    middle_band = sma(data, period)
    std = data.rolling(window=period).std()

    upper_band = middle_band + (std * std_dev)
    lower_band = middle_band - (std * std_dev)

    return upper_band, middle_band, lower_band


def atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    """
    Average True Range.

    Args:
        high: High prices
        low: Low prices
        close: Close prices
        period: Number of periods (default: 14)

    Returns:
        ATR values as a pandas Series
    """
    tr1 = high - low
    tr2 = abs(high - close.shift())
    tr3 = abs(low - close.shift())

    true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr_values = true_range.rolling(window=period).mean()

    return atr_values


def stochastic(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    period: int = 14,
    smooth_k: int = 3,
    smooth_d: int = 3
) -> tuple[pd.Series, pd.Series]:
    """
    Stochastic Oscillator.

    Args:
        high: High prices
        low: Low prices
        close: Close prices
        period: Look-back period (default: 14)
        smooth_k: %K smoothing (default: 3)
        smooth_d: %D smoothing (default: 3)

    Returns:
        Tuple of (%K line, %D line)
    """
    lowest_low = low.rolling(window=period).min()
    highest_high = high.rolling(window=period).max()

    k_raw = 100 * ((close - lowest_low) / (highest_high - lowest_low))
    k_line = k_raw.rolling(window=smooth_k).mean()
    d_line = k_line.rolling(window=smooth_d).mean()

    return k_line, d_line
