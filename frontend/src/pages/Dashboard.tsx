import { Link } from 'react-router-dom'
import { TrendingUp, Layers, Play, ArrowRight } from 'lucide-react'

const Dashboard = () => {
  const quickStats = [
    { label: 'Total Backtests', value: '0', change: '+0%' },
    { label: 'Strategies Created', value: '0', change: '+0%' },
    { label: 'Avg Win Rate', value: '-', change: '-' },
    { label: 'Best Strategy', value: '-', change: '-' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">
          Welcome to your financial backtesting platform
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className="text-sm text-success">{stat.change}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create Strategy */}
          <Link
            to="/strategy-builder"
            className="card hover:shadow-lg transition-shadow group cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Layers className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Create Strategy</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Build a new trading strategy using our visual builder
                </p>
                <div className="flex items-center text-primary-600 text-sm font-medium group-hover:gap-2 transition-all">
                  <span>Get started</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          </Link>

          {/* Run Backtest */}
          <Link
            to="/backtest"
            className="card hover:shadow-lg transition-shadow group cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-success-light rounded-lg">
                <Play className="w-6 h-6 text-success-dark" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Run Backtest</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Test your strategy against historical market data
                </p>
                <div className="flex items-center text-success-dark text-sm font-medium group-hover:gap-2 transition-all">
                  <span>Start testing</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          </Link>

          {/* Explore Data */}
          <Link
            to="/data-explorer"
            className="card hover:shadow-lg transition-shadow group cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Explore Data</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Browse and analyze available market data
                </p>
                <div className="flex items-center text-amber-600 text-sm font-medium group-hover:gap-2 transition-all">
                  <span>View data</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Getting Started */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200">
        <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
        <p className="text-slate-700 mb-4">
          New to backtesting? Follow these steps to run your first strategy:
        </p>
        <ol className="space-y-2 text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <span className="font-semibold text-primary-600">1.</span>
            <span>Choose or create a strategy from templates or build your own</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-primary-600">2.</span>
            <span>Select an asset (stock, crypto, forex, or option) to test against</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-primary-600">3.</span>
            <span>Configure your backtest parameters (date range, capital, etc.)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-primary-600">4.</span>
            <span>Run the backtest and analyze your results</span>
          </li>
        </ol>
      </div>
    </div>
  )
}

export default Dashboard
