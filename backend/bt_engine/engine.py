import pandas as pd
import numpy as np
from backtesting import Backtest, Strategy
from backtesting.lib import crossover
from backtesting.test import SMA
from typing import Dict, Any, Optional, Type
import pandas_ta as ta


class BacktestEngine:
    """
    Core backtesting engine that executes strategies and generates results.

    Uses the backtesting.py library as the foundation.
    """

    def __init__(self, data: pd.DataFrame, initial_capital: float = 10000.0, commission: float = 0.001):
        """
        Initialize the backtesting engine.

        Args:
            data: Historical OHLCV DataFrame
            initial_capital: Starting capital for the backtest
            commission: Commission per trade (as decimal, e.g., 0.001 = 0.1%)
        """
        self.data = self._prepare_data(data)
        self.initial_capital = initial_capital
        self.commission = commission

    def _prepare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare data for backtesting.py library.

        Ensures correct format and column names.
        """
        # backtesting.py expects specific column names (capitalized)
        df = df.copy()
        df = df.rename(columns={
            'open': 'Open',
            'high': 'High',
            'low': 'Low',
            'close': 'Close',
            'volume': 'Volume'
        })

        # Ensure required columns exist
        required = ['Open', 'High', 'Low', 'Close', 'Volume']
        for col in required:
            if col not in df.columns:
                raise ValueError(f"Missing required column: {col}")

        # Remove any NaN values
        df = df.dropna()

        return df

    def create_strategy_from_definition(self, definition: Dict[str, Any]) -> Type[Strategy]:
        """
        Dynamically create a Strategy class from a strategy definition.

        This converts the JSON strategy definition into executable backtesting.py code.
        """
        entry_rules = definition.get('entry_rules', [])
        exit_rules = definition.get('exit_rules', [])
        position_size = definition.get('position_size', 1.0)

        class DynamicStrategy(Strategy):
            """Dynamically generated strategy."""

            def init(self):
                """Initialize indicators."""
                # Collect all indicators needed (from both main indicator and compare_to)
                indicators_to_create = set()

                for rule in entry_rules + exit_rules:
                    # Add main indicator
                    indicator_type = rule.get('indicator')
                    params = rule.get('params', {})
                    indicators_to_create.add((indicator_type, tuple(sorted(params.items()))))

                    # Add compare_to indicator if it exists and is a dict
                    compare_to = rule.get('compare_to')
                    if isinstance(compare_to, dict):
                        compare_indicator = compare_to.get('indicator')
                        compare_params = compare_to.get('params', {})
                        if compare_indicator:
                            indicators_to_create.add((compare_indicator, tuple(sorted(compare_params.items()))))

                # Create all unique indicators
                for indicator_type, params_tuple in indicators_to_create:
                    params = dict(params_tuple)

                    if indicator_type == 'sma':
                        period = params.get('period', 20)
                        attr_name = f'sma_{period}'
                        if not hasattr(self, attr_name):
                            setattr(self, attr_name, self.I(SMA, self.data.Close, period))

                    elif indicator_type == 'ema':
                        period = params.get('period', 20)
                        attr_name = f'ema_{period}'
                        if not hasattr(self, attr_name):
                            setattr(self, attr_name, self.I(
                                lambda x, p: pd.Series(x).ewm(span=p).mean(),
                                self.data.Close, period
                            ))

                    elif indicator_type == 'rsi':
                        period = params.get('period', 14)
                        attr_name = f'rsi_{period}'
                        if not hasattr(self, attr_name):
                            setattr(self, attr_name, self.I(
                                lambda x, p: ta.rsi(pd.Series(x), length=p),
                                self.data.Close, period
                            ))

                    elif indicator_type == 'macd':
                        fast = params.get('fast', 12)
                        slow = params.get('slow', 26)
                        signal = params.get('signal', 9)
                        # MACD implementation
                        if not hasattr(self, 'macd'):
                            setattr(self, 'macd', self.I(
                                lambda x: ta.macd(pd.Series(x), fast=fast, slow=slow, signal=signal)['MACD_12_26_9'],
                                self.data.Close
                            ))
                        if not hasattr(self, 'macd_signal'):
                            setattr(self, 'macd_signal', self.I(
                                lambda x: ta.macd(pd.Series(x), fast=fast, slow=slow, signal=signal)['MACDs_12_26_9'],
                                self.data.Close
                            ))

            def next(self):
                """Execute strategy logic on each bar."""
                # Check entry conditions
                should_enter = self._check_conditions(entry_rules)

                # Check exit conditions
                should_exit = self._check_conditions(exit_rules)

                if should_enter and not self.position:
                    # Use all available capital if position_size is 1.0, otherwise use specified fraction
                    if position_size >= 1.0:
                        self.buy()  # Use all available capital
                    else:
                        self.buy(size=position_size)
                elif should_exit and self.position:
                    self.position.close()

            def _check_conditions(self, rules):
                """Check if all conditions in the rule set are met."""
                if not rules:
                    return False

                for rule in rules:
                    indicator_type = rule.get('indicator')
                    params = rule.get('params', {})
                    condition = rule.get('condition')
                    compare_to = rule.get('compare_to')

                    # Get the indicator value
                    try:
                        if indicator_type == 'sma':
                            period = params.get('period', 20)
                            indicator_value = getattr(self, f'sma_{period}')
                        elif indicator_type == 'ema':
                            period = params.get('period', 20)
                            indicator_value = getattr(self, f'ema_{period}')
                        elif indicator_type == 'rsi':
                            period = params.get('period', 14)
                            indicator_value = getattr(self, f'rsi_{period}')
                        elif indicator_type == 'macd':
                            indicator_value = getattr(self, 'macd')
                            if compare_to == 'signal':
                                compare_to = getattr(self, 'macd_signal')
                        else:
                            continue
                    except AttributeError:
                        # Indicator not initialized, skip this rule
                        return False

                    # Safety check: ensure indicator has values
                    if indicator_value is None or len(indicator_value) == 0:
                        return False

                    # Check for NaN in current value (indicator not ready yet)
                    if pd.isna(indicator_value[-1]):
                        return False

                    # Get compare_value (can be scalar or another indicator)
                    compare_value = None
                    if isinstance(compare_to, dict):
                        # compare_to is another indicator
                        other_indicator = compare_to.get('indicator')
                        other_params = compare_to.get('params', {})
                        try:
                            if other_indicator == 'sma':
                                period = other_params.get('period', 200)
                                compare_value = getattr(self, f'sma_{period}')
                            elif other_indicator == 'ema':
                                period = other_params.get('period', 200)
                                compare_value = getattr(self, f'ema_{period}')
                            elif other_indicator == 'rsi':
                                period = other_params.get('period', 14)
                                compare_value = getattr(self, f'rsi_{period}')
                        except AttributeError:
                            return False

                        # Safety check for comparison indicator
                        if compare_value is None or len(compare_value) == 0:
                            return False
                        if pd.isna(compare_value[-1]):
                            return False
                    else:
                        # compare_to is a scalar value
                        compare_value = compare_to

                    # Evaluate condition
                    if condition == 'greater_than':
                        if isinstance(compare_value, (int, float)):
                            # Compare to scalar
                            if not (indicator_value[-1] > compare_value):
                                return False
                        else:
                            # Compare to another indicator series
                            if not (indicator_value[-1] > compare_value[-1]):
                                return False

                    elif condition == 'less_than':
                        if isinstance(compare_value, (int, float)):
                            # Compare to scalar
                            if not (indicator_value[-1] < compare_value):
                                return False
                        else:
                            # Compare to another indicator series
                            if not (indicator_value[-1] < compare_value[-1]):
                                return False

                    elif condition == 'crosses_above':
                        if isinstance(compare_value, (int, float)):
                            # Crossover with scalar: check if crossed above the threshold
                            if len(indicator_value) < 2:
                                return False
                            # Check for NaN in previous value
                            if pd.isna(indicator_value[-2]):
                                return False
                            if not (indicator_value[-2] <= compare_value and indicator_value[-1] > compare_value):
                                return False
                        else:
                            # Crossover with another indicator series
                            if len(compare_value) < 2:
                                return False
                            if pd.isna(compare_value[-2]):
                                return False
                            if not crossover(indicator_value, compare_value):
                                return False

                    elif condition == 'crosses_below':
                        if isinstance(compare_value, (int, float)):
                            # Crossover with scalar: check if crossed below the threshold
                            if len(indicator_value) < 2:
                                return False
                            # Check for NaN in previous value
                            if pd.isna(indicator_value[-2]):
                                return False
                            if not (indicator_value[-2] >= compare_value and indicator_value[-1] < compare_value):
                                return False
                        else:
                            # Crossover with another indicator series
                            if len(compare_value) < 2:
                                return False
                            if pd.isna(compare_value[-2]):
                                return False
                            if not crossover(compare_value, indicator_value):
                                return False

                return True

        return DynamicStrategy

    async def run(self, strategy_class: Type[Strategy]) -> Dict[str, Any]:
        """
        Run the backtest with the given strategy.

        Args:
            strategy_class: The Strategy class to execute

        Returns:
            Dictionary containing backtest results and metrics
        """
        # Initialize backtest
        bt = Backtest(
            self.data,
            strategy_class,
            cash=self.initial_capital,
            commission=self.commission,
            exclusive_orders=True
        )

        # Run backtest
        stats = bt.run()

        # Debug: print available stat keys
        print(f"Available stat keys: {list(stats.index)}")

        # Helper function to safely get stat value
        def get_stat(key, default=0.0):
            try:
                val = stats[key]
                return float(val) if not pd.isna(val) else default
            except (KeyError, TypeError):
                print(f"Warning: Stat key '{key}' not found, using default: {default}")
                return default

        # Extract results with safe access
        results = {
            'final_value': get_stat('Equity Final [$]', self.initial_capital),
            'total_return': get_stat('Return [%]', 0) * self.initial_capital / 100,
            'total_return_pct': get_stat('Return [%]', 0),
            'sharpe_ratio': get_stat('Sharpe Ratio', None),
            'max_drawdown': abs(get_stat('Max. Drawdown [%]', 0)) * self.initial_capital / 100,
            'max_drawdown_pct': abs(get_stat('Max. Drawdown [%]', 0)),
            'win_rate': get_stat('Win Rate [%]', 0),
            'total_trades': int(get_stat('# Trades', 0)),
            'winning_trades': 0,  # Will calculate from trades
            'losing_trades': 0,  # Will calculate from trades
            'avg_win': 0.0,  # Calculate from trades
            'avg_loss': 0.0,  # Calculate from trades
            'profit_factor': None,  # Calculate from trades
            'equity_curve': [],
            'trades': []
        }

        # Get equity curve
        equity = stats._equity_curve
        if equity is not None:
            equity_data = equity.reset_index()
            results['equity_curve'] = [
                {
                    'date': pd.to_datetime(row['index'] if 'index' in row else row.name).strftime('%Y-%m-%d'),
                    'equity': float(row['Equity'])
                }
                for _, row in equity_data.iterrows()
            ]

        # Get trades
        trades = stats._trades
        if trades is not None and not trades.empty:
            results['trades'] = [
                {
                    'entry_time': pd.to_datetime(row['EntryTime']).strftime('%Y-%m-%d'),
                    'exit_time': pd.to_datetime(row['ExitTime']).strftime('%Y-%m-%d'),
                    'entry_price': float(row['EntryPrice']),
                    'exit_price': float(row['ExitPrice']),
                    'size': float(row['Size']),
                    'pnl': float(row['PnL']),
                    'return_pct': float(row['ReturnPct'])
                }
                for _, row in trades.iterrows()
            ]

            # Calculate win/loss metrics
            winning_trades = trades[trades['PnL'] > 0]
            losing_trades = trades[trades['PnL'] < 0]

            results['winning_trades'] = len(winning_trades)
            results['losing_trades'] = len(losing_trades)

            if len(winning_trades) > 0:
                results['avg_win'] = float(winning_trades['PnL'].mean())
            if len(losing_trades) > 0:
                results['avg_loss'] = float(abs(losing_trades['PnL'].mean()))

            # Calculate profit factor
            if results['avg_loss'] > 0:
                total_wins = winning_trades['PnL'].sum()
                total_losses = abs(losing_trades['PnL'].sum())
                if total_losses > 0:
                    results['profit_factor'] = float(total_wins / total_losses)

        return results

    async def load_strategy(self, strategy_id: str) -> Type[Strategy]:
        """
        Load a saved strategy by ID.

        TODO: Implement database lookup
        """
        raise NotImplementedError("Strategy loading not yet implemented")
