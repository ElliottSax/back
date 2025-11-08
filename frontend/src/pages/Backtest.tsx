import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { backtestAPI } from '@/services/api'
import { AssetClass, BacktestResult, IndicatorType, ConditionType } from '@/types'
import { Play, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'
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

const Backtest = () => {
  const [symbol, setSymbol] = useState('AAPL')
  const [assetClass, setAssetClass] = useState<AssetClass>(AssetClass.STOCK)
  const [startDate, setStartDate] = useState('2023-01-01')
  const [endDate, setEndDate] = useState('2024-01-01')
  const [initialCapital, setInitialCapital] = useState(10000)
  const [commission, setCommission] = useState(0.001)

  const backtestMutation = useMutation({
    mutationFn: backtestAPI.run,
  })

  const handleRunBacktest = () => {
    // Use the SMA Crossover strategy from templates
    const smaStrategy = {
      name: 'SMA Crossover',
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
    }

    backtestMutation.mutate({
      symbol,
      asset_class: assetClass,
      strategy_definition: smaStrategy,
      start_date: startDate,
      end_date: endDate,
      initial_capital: initialCapital,
      commission,
      timeframe: '1d',
    })
  }

  const result = backtestMutation.data

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Run Backtest</h1>
        <p className="text-slate-600 mt-2">
          Test the SMA Crossover strategy against historical market data
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

        <div className="mt-6">
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={handleRunBacktest}
            disabled={backtestMutation.isPending}
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

      {/* Results */}
      {result && (
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
