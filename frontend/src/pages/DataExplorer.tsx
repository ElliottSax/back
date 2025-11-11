import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dataAPI } from '@/services/api'
import { AssetClass } from '@/types'
import { Search, TrendingUp, Calendar, Download } from 'lucide-react'
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

const DataExplorer = () => {
  const [symbol, setSymbol] = useState('AAPL')
  const [assetClass, setAssetClass] = useState<AssetClass>(AssetClass.STOCK)
  const [startDate, setStartDate] = useState('2023-01-01')
  const [endDate, setEndDate] = useState('2024-01-01')
  const [searchInput, setSearchInput] = useState('AAPL')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['market-data', symbol, assetClass, startDate, endDate],
    queryFn: async () => {
      const response = await dataAPI.fetch({
        symbol,
        asset_class: assetClass,
        start_date: startDate,
        end_date: endDate,
        timeframe: '1d',
      })
      return response
    },
    enabled: false, // Don't fetch automatically
  })

  const handleSearch = () => {
    setSymbol(searchInput.toUpperCase())
    refetch()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const exportToCSV = () => {
    if (!data || !data.data || data.data.length === 0) {
      alert('No data to export')
      return
    }

    // Convert data to CSV
    const headers = Object.keys(data.data[0])
    const csvContent = [
      headers.join(','),
      ...data.data.map((row: any) =>
        headers.map((header) => row[header]).join(',')
      ),
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${symbol}_${startDate}_${endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Prepare chart data
  const chartData = data?.data?.map((item: any) => ({
    date: item.date,
    close: item.close,
    high: item.high,
    low: item.low,
  })) || []

  // Calculate basic statistics
  const stats = data?.data ? {
    count: data.data.length,
    avgClose: (data.data.reduce((sum: number, item: any) => sum + item.close, 0) / data.data.length).toFixed(2),
    highestClose: Math.max(...data.data.map((item: any) => item.close)).toFixed(2),
    lowestClose: Math.min(...data.data.map((item: any) => item.close)).toFixed(2),
    volatility: calculateVolatility(data.data).toFixed(2),
  } : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Data Explorer</h1>
        <p className="text-slate-600 mt-2">
          Browse and analyze market data before running backtests
        </p>
      </div>

      {/* Search and Configuration */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Search Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Symbol Search */}
          <div className="md:col-span-2 lg:col-span-1">
            <label className="label">Symbol</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input flex-1"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="e.g., AAPL, TSLA, BTC-USD"
              />
              <button
                className="btn btn-primary flex items-center gap-2"
                onClick={handleSearch}
                disabled={isLoading}
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
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
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading market data...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="card bg-error-light border-error-dark">
          <p className="text-error-dark">
            Error loading data: {(error as Error).message}
          </p>
          <p className="text-sm text-slate-600 mt-2">
            Make sure the symbol is valid and try again.
          </p>
        </div>
      )}

      {/* Data Display */}
      {data && !isLoading && !isError && (
        <>
          {/* Statistics */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Statistics</h2>
              <button
                className="btn btn-secondary flex items-center gap-2"
                onClick={exportToCSV}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard
                label="Data Points"
                value={stats?.count || 0}
                icon={Calendar}
              />
              <StatCard
                label="Average Close"
                value={`$${stats?.avgClose || 0}`}
                icon={TrendingUp}
              />
              <StatCard
                label="Highest Close"
                value={`$${stats?.highestClose || 0}`}
                icon={TrendingUp}
              />
              <StatCard
                label="Lowest Close"
                value={`$${stats?.lowestClose || 0}`}
                icon={TrendingUp}
              />
              <StatCard
                label="Volatility"
                value={`${stats?.volatility || 0}%`}
                icon={TrendingUp}
              />
            </div>
          </div>

          {/* Price Chart */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">
              {symbol} Price Chart
            </h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                    name="Close Price"
                  />
                  <Line
                    type="monotone"
                    dataKey="high"
                    stroke="#10b981"
                    strokeWidth={1}
                    dot={false}
                    name="High"
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey="low"
                    stroke="#ef4444"
                    strokeWidth={1}
                    dot={false}
                    name="Low"
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Historical Data</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold">Open</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold">High</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold">Low</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold">Close</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.slice(0, 100).map((row: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2 text-sm">
                        {new Date(row.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-right">
                        ${row.open.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-success">
                        ${row.high.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-error">
                        ${row.low.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-medium">
                        ${row.close.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-slate-500">
                        {row.volume ? row.volume.toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.data.length > 100 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  Showing first 100 of {data.data.length} rows. Export to CSV to see all data.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!data && !isLoading && !isError && (
        <div className="card">
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Search for a symbol to get started
            </h3>
            <p className="text-slate-500">
              Enter a stock symbol, cryptocurrency, or forex pair above and click Search
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
}

const StatCard = ({ label, value, icon: Icon }: StatCardProps) => (
  <div className="card">
    <div className="flex items-start justify-between mb-2">
      <p className="text-sm text-slate-600">{label}</p>
      <Icon className="w-5 h-5 text-primary-600" />
    </div>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
)

// Helper function to calculate volatility (standard deviation of returns)
function calculateVolatility(data: any[]): number {
  if (data.length < 2) return 0

  const returns = []
  for (let i = 1; i < data.length; i++) {
    const returnPct = ((data[i].close - data[i - 1].close) / data[i - 1].close) * 100
    returns.push(returnPct)
  }

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
  return Math.sqrt(variance)
}

export default DataExplorer
