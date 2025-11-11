#!/usr/bin/env python3
"""
Test script to verify all template strategies work correctly.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from bt_engine.engine import BacktestEngine

# Create sample data (TSLA-like volatile stock)
def create_test_data(days=756):
    """Create sample OHLCV data for testing."""
    np.random.seed(42)
    dates = pd.date_range(start='2020-01-01', periods=days, freq='D')

    # Start at $100 and create realistic price movement
    close_prices = [100]
    for _ in range(days - 1):
        # Random walk with drift
        change = np.random.normal(0.001, 0.02)  # 0.1% drift, 2% volatility
        close_prices.append(close_prices[-1] * (1 + change))

    close_prices = np.array(close_prices)

    # Generate OHLC
    data = pd.DataFrame({
        'date': dates,
        'open': close_prices * (1 + np.random.uniform(-0.01, 0.01, days)),
        'high': close_prices * (1 + np.random.uniform(0, 0.02, days)),
        'low': close_prices * (1 - np.random.uniform(0, 0.02, days)),
        'close': close_prices,
        'volume': np.random.randint(1000000, 10000000, days)
    })
    data.set_index('date', inplace=True)

    return data

# Test strategies
strategies_to_test = [
    {
        'name': 'Buy and Hold',
        'definition': {
            'name': 'Buy and Hold',
            'entry_rules': [
                {
                    'indicator': 'sma',
                    'params': {'period': 1},
                    'condition': 'greater_than',
                    'compare_to': 0
                }
            ],
            'exit_rules': [
                {
                    'indicator': 'sma',
                    'params': {'period': 1},
                    'condition': 'less_than',
                    'compare_to': 0
                }
            ],
            'position_size': 1.0,
            'max_positions': 1
        }
    },
    {
        'name': 'SMA Crossover (50/200)',
        'definition': {
            'name': 'SMA Crossover',
            'entry_rules': [
                {
                    'indicator': 'sma',
                    'params': {'period': 50},
                    'condition': 'crosses_above',
                    'compare_to': {
                        'indicator': 'sma',
                        'params': {'period': 200}
                    }
                }
            ],
            'exit_rules': [
                {
                    'indicator': 'sma',
                    'params': {'period': 50},
                    'condition': 'crosses_below',
                    'compare_to': {
                        'indicator': 'sma',
                        'params': {'period': 200}
                    }
                }
            ],
            'position_size': 1.0,
            'max_positions': 1
        }
    },
    {
        'name': 'RSI Oversold/Overbought',
        'definition': {
            'name': 'RSI Strategy',
            'entry_rules': [
                {
                    'indicator': 'rsi',
                    'params': {'period': 14},
                    'condition': 'less_than',
                    'compare_to': 30
                }
            ],
            'exit_rules': [
                {
                    'indicator': 'rsi',
                    'params': {'period': 14},
                    'condition': 'greater_than',
                    'compare_to': 70
                }
            ],
            'position_size': 1.0,
            'max_positions': 1
        }
    }
]

async def test_strategy(strategy_config, data):
    """Test a single strategy."""
    print(f"\n{'='*60}")
    print(f"Testing: {strategy_config['name']}")
    print(f"{'='*60}")

    try:
        engine = BacktestEngine(data, initial_capital=10000, commission=0.001)
        strategy_class = engine.create_strategy_from_definition(strategy_config['definition'])
        results = await engine.run(strategy_class)

        print(f"✅ Strategy executed successfully")
        print(f"  Initial Capital: ${results.get('initial_capital', 10000):.2f}")
        print(f"  Final Value: ${results.get('final_value', 0):.2f}")
        print(f"  Total Return: ${results.get('total_return', 0):.2f} ({results.get('total_return_pct', 0):.2f}%)")
        print(f"  Total Trades: {results.get('total_trades', 0)}")
        print(f"  Winning Trades: {results.get('winning_trades', 0)}")
        print(f"  Losing Trades: {results.get('losing_trades', 0)}")
        print(f"  Win Rate: {results.get('win_rate', 0):.1f}%")
        print(f"  Max Drawdown: {results.get('max_drawdown_pct', 0):.2f}%")
        print(f"  Sharpe Ratio: {results.get('sharpe_ratio', 'N/A')}")
        print(f"  Equity Curve Points: {len(results.get('equity_curve', []))}")

        # Check for potential issues
        if results.get('total_trades', 0) == 0 and strategy_config['name'] != 'Buy and Hold':
            print(f"⚠️  WARNING: No trades executed (might need longer data or different parameters)")

        if results.get('final_value', 0) == results.get('initial_capital', 10000):
            print(f"⚠️  WARNING: No change in equity (strategy might not be working)")

        return True

    except Exception as e:
        print(f"❌ Strategy failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    print("Creating test data...")
    data = create_test_data(days=756)  # ~3 years
    print(f"Data created: {len(data)} days from {data.index[0]} to {data.index[-1]}")
    print(f"Price range: ${data['close'].min():.2f} to ${data['close'].max():.2f}")
    print(f"Starting price: ${data['close'].iloc[0]:.2f}")
    print(f"Ending price: ${data['close'].iloc[-1]:.2f}")
    print(f"Buy and hold return: {((data['close'].iloc[-1] / data['close'].iloc[0]) - 1) * 100:.2f}%")

    results = []
    for strategy_config in strategies_to_test:
        success = await test_strategy(strategy_config, data.copy())
        results.append((strategy_config['name'], success))

    # Summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}")
    for name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")

    total = len(results)
    passed = sum(1 for _, success in results if success)
    print(f"\nTotal: {passed}/{total} strategies passed")

    return passed == total

if __name__ == '__main__':
    import asyncio
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
