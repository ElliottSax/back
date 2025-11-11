import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { backtestAPI } from '@/services/api'
import { AssetClass, IndicatorType, ConditionType, StrategyDefinition } from '@/types'
import { Play, TrendingUp, TrendingDown, DollarSign, Activity, Plus } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// Template strategies
const TEMPLATE_STRATEGIES: (StrategyDefinition & { id: string })[] = [
  {
    id: 'sma-crossover',
    name: 'SMA Crossover (50/200)',
    description: 'Buy when 50-day SMA crosses above 200-day SMA',
    entry_rules: [
      {
        indicator: IndicatorType.SMA,
        params: { period: 50 },
        condition: ConditionType.CROSSES_ABOVE,
        compare_to: {
          indicator: IndicatorType.SMA,
          params: { period: 200 },
        },
      },
    ],
    exit_rules: [
      {
        indicator: IndicatorType.SMA,
        params: { period: 50 },
        condition: ConditionType.CROSSES_BELOW,
        compare_to: {
          indicator: IndicatorType.SMA,
          params: { period: 200 },
        },
      },
    ],
    position_size: 1.0,
    max_positions: 1,
  },
  {
    id: 'rsi-oversold',
    name: 'RSI Oversold/Overbought',
    description: 'Buy when RSI < 30, sell when RSI > 70',
    entry_rules: [
      {
        indicator: IndicatorType.RSI,
        params: { period: 14 },
        condition: ConditionType.LESS_THAN,
        compare_to: 30,
      },
    ],
    exit_rules: [
      {
        indicator: IndicatorType.RSI,
        params: { period: 14 },
        condition: ConditionType.GREATER_THAN,
        compare_to: 70,
      },
    ],
    position_size: 1.0,
    max_positions: 1,
  },
]

const Backtest = () => {
  const [symbol, setSymbol] = useState('AAPL')
  const [assetClass, setAssetClass] = useState<AssetClass>(AssetClass.STOCK)
  const [startDate, setStartDate] = useState('2023-01-01')
  const [endDate, setEndDate] = useState('2024-01-01')
  const [initialCapital, setInitialCapital] = useState(10000)
  const [commission, setCommission] = useState(0.001)
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyDefinition | null>(null)
  const [savedStrategies, setSavedStrategies] = useState<(StrategyDefinition & { id: string })[]>([])

  // Load strategies on mount
  useEffect(() => {
    // Check for pending strategy from Strategy Builder
    const pendingStrategy = sessionStorage.getItem('pendingStrategy')
    if (pendingStrategy) {
      setSelectedStrategy(JSON.parse(pendingStrategy))
      sessionStorage.removeItem('pendingStrategy')
    }

    // Load saved strategies from localStorage
    const saved = JSON.parse(localStorage.getItem('strategies') || '[]')
    setSavedStrategies(saved)

    // Default to first template if no pending strategy
    if (!pendingStrategy && TEMPLATE_STRATEGIES.length > 0) {
      setSelectedStrategy(TEMPLATE_STRATEGIES[0])
    }
  }, [])

  const backtestMutation = useMutation({
    mutationFn: backtestAPI.run,
    onSuccess: (data) => {
      console.log('✅ BACKTEST SUCCESS')
      console.log('Result data:', data)
      console.log('Total trades:', data.total_trades)
      console.log('Equity curve length:', data.equity_curve?.length)
    },
    onError: (error) => {
      console.error('❌ BACKTEST ERROR:', error)
    },
  })

  const handleRunBacktest = () => {
    if (!selectedStrategy) {
      alert('Please select a strategy')
      return
    }

    console.log('🚀 STARTING BACKTEST')
    console.log('Symbol:', symbol)
    console.log('Date range:', startDate, 'to', endDate)
    console.log('Selected strategy:', selectedStrategy)

    // Strip out the id field if it exists (templates have it, but backend doesn't need it)
    const { id, ...strategyDef } = selectedStrategy as any
    const cleanStrategy: StrategyDefinition = {
      name: strategyDef.name,
      description: strategyDef.description,
      entry_rules: strategyDef.entry_rules,
      exit_rules: strategyDef.exit_rules,
      position_size: strategyDef.position_size,
      max_positions: strategyDef.max_positions,
    }

    console.log('Clean strategy (without id):', cleanStrategy)

    const payload = {
      symbol,
      asset_class: assetClass,
      strategy_definition: cleanStrategy,
      start_date: startDate,
      end_date: endDate,
      initial_capital: initialCapital,
      commission,
      timeframe: '1d',
    }

    console.log('Request payload:', payload)

    backtestMutation.mutate(payload)
  }

  const handleStrategyChange = (strategyId: string) => {
    // Check templates first
    const template = TEMPLATE_STRATEGIES.find((s) => s.id === strategyId)
    if (template) {
      setSelectedStrategy(template)
      return
    }

    // Check saved strategies
    const saved = savedStrategies.find((s) => s.id === strategyId)
    if (saved) {
      setSelectedStrategy(saved)
    }
  }

  const allStrategies = [...TEMPLATE_STRATEGIES, ...savedStrategies]
  const result = backtestMutation.data

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Run Backtest</h1>
        <p className="text-slate-600 mt-2">
          Test trading strategies against historical market data
        </p>
      </div>

      {/* Configuration Form */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Backtest Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Symbol */}
          <div>
            <label className="label">Symbol</label>
            <input
              type="text"
              className="input"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., AAPL, BTC-USD"
            />
          </div>

          {/* Asset Class */}
          <div>
            <label className="label">Asset Class</label>
            <select
              className="input"
              value={assetClass}
              onChange={(e) => setAssetClass(e.target.value as AssetClass)}
            >
              <option value={AssetClass.STOCK}>Stock</option>
              <option value={AssetClass.CRYPTO}>Cryptocurrency</option>
              <option value={AssetClass.FOREX}>Forex</option>
            </select>
          </div>

          {/* Initial Capital */}
          <div>
            <label className="label">Initial Capital ($)</label>
            <input
              type="number"
              className="input"
              value={initialCapital}
              onChange={(e) => setInitialCapital(Number(e.target.value))}
              min="100"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Commission */}
          <div>
            <label className="label">Commission (%)</label>
            <input
              type="number"
              className="input"
              value={commission * 100}
              onChange={(e) => setCommission(Number(e.target.value) / 100)}
              min="0"
              max="5"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Strategy Selection */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Strategy</h2>
          <Link
            to="/strategy-builder"
            className="btn btn-secondary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Strategy
          </Link>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Select Strategy</label>
            <select
              className="input"
              value={selectedStrategy ? (allStrategies.find(s => s.name === selectedStrategy.name)?.id || '') : ''}
              onChange={(e) => handleStrategyChange(e.target.value)}
            >
              <option value="">Choose a strategy...</option>
              <optgroup label="Templates">
                {TEMPLATE_STRATEGIES.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </option>
                ))}
              </optgroup>
              {savedStrategies.length > 0 && (
                <optgroup label="My Strategies">
                  {savedStrategies.map((strategy) => (
                    <option key={strategy.id} value={strategy.id}>
                      {strategy.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {selectedStrategy && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">{selectedStrategy.name}</h3>
              <p className="text-sm text-slate-600 mb-3">{selectedStrategy.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-slate-700">Entry Rules:</span>
                  <span className="ml-2 text-slate-600">{selectedStrategy.entry_rules.length}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Exit Rules:</span>
                  <span className="ml-2 text-slate-600">{selectedStrategy.exit_rules.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={handleRunBacktest}
            disabled={backtestMutation.isPending || !selectedStrategy}
          >
            <Play className="w-4 h-4" />
            {backtestMutation.isPending ? 'Running Backtest...' : 'Run Backtest'}
          </button>
        </div>

        {backtestMutation.isError && (
          <div className="mt-4 p-4 bg-error-light text-error-dark rounded-lg">
            Error: {(backtestMutation.error as Error).message}
          </div>
        )}
      </div>

      {/* Loading State */}
      {backtestMutation.isPending && (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Running backtest...</p>
              <p className="text-sm text-slate-500 mt-2">This may take a few moments</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !backtestMutation.isPending && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                label="Total Return"
                value={`$${result.total_return.toFixed(2)}`}
                percentage={`${result.total_return_pct.toFixed(2)}%`}
                icon={DollarSign}
                positive={result.total_return > 0}
              />
              <MetricCard
                label="Win Rate"
                value={`${result.win_rate.toFixed(1)}%`}
                subtitle={`${result.winning_trades}/${result.total_trades} trades`}
                icon={TrendingUp}
                positive={result.win_rate > 50}
              />
              <MetricCard
                label="Max Drawdown"
                value={`${result.max_drawdown_pct.toFixed(2)}%`}
                subtitle={`$${Math.abs(result.max_drawdown).toFixed(2)}`}
                icon={TrendingDown}
                positive={false}
              />
              <MetricCard
                label="Sharpe Ratio"
                value={result.sharpe_ratio?.toFixed(2) || 'N/A'}
                subtitle="Risk-adjusted return"
                icon={Activity}
                positive={(result.sharpe_ratio || 0) > 1}
              />
            </div>
          </div>

          {/* Equity Curve */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Equity Curve</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.equity_curve}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Equity']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="equity"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                    name="Portfolio Value"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trade History */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Trade History</h2>
            {result.trades.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No trades were executed during this backtest period. Try a different date range or strategy.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Entry</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Exit</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">Entry Price</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">Exit Price</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">P/L</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((trade, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2 text-sm">
                          {new Date(trade.entry_time).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {new Date(trade.exit_time).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-sm text-right">
                          ${trade.entry_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right">
                          ${trade.exit_price.toFixed(2)}
                        </td>
                        <td
                          className={`px-4 py-2 text-sm text-right font-medium ${
                            trade.pnl > 0 ? 'text-success' : 'text-error'
                          }`}
                        >
                          ${trade.pnl.toFixed(2)}
                        </td>
                        <td
                          className={`px-4 py-2 text-sm text-right ${
                            trade.return_pct > 0 ? 'text-success' : 'text-error'
                          }`}
                        >
                          {trade.return_pct.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  subtitle?: string
  percentage?: string
  icon: React.ElementType
  positive: boolean
}

const MetricCard = ({ label, value, subtitle, percentage, icon: Icon, positive }: MetricCardProps) => (
  <div className="card">
    <div className="flex items-start justify-between mb-2">
      <p className="text-sm text-slate-600">{label}</p>
      <Icon className={`w-5 h-5 ${positive ? 'text-success' : 'text-error'}`} />
    </div>
    <div className="flex items-baseline gap-2">
      <p className={`text-2xl font-bold ${positive ? 'text-success' : 'text-error'}`}>
        {value}
      </p>
      {percentage && (
        <p className={`text-sm ${positive ? 'text-success' : 'text-error'}`}>
          {percentage}
        </p>
      )}
    </div>
    {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
  </div>
)

export default Backtest
