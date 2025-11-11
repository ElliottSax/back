import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Layers, Play, ArrowRight, Trash2 } from 'lucide-react'
import { StrategyDefinition } from '@/types'

const Dashboard = () => {
  const [savedStrategies, setSavedStrategies] = useState<(StrategyDefinition & { id: string })[]>([])

  useEffect(() => {
    // Load saved strategies from localStorage
    const saved = JSON.parse(localStorage.getItem('strategies') || '[]')
    setSavedStrategies(saved)
  }, [])

  const deleteStrategy = (id: string) => {
    if (!confirm('Are you sure you want to delete this strategy?')) {
      return
    }

    const updated = savedStrategies.filter((s) => s.id !== id)
    setSavedStrategies(updated)
    localStorage.setItem('strategies', JSON.stringify(updated))
  }

  const quickStats = [
    { label: 'Total Strategies', value: savedStrategies.length.toString(), change: '+0%' },
    { label: 'Templates Available', value: '2', change: '+0%' },
    { label: 'Backtests Run', value: '-', change: '-' },
    { label: 'Best Win Rate', value: '-', change: '-' },
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

      {/* My Strategies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Strategies</h2>
          <Link
            to="/strategy-builder"
            className="text-primary-600 text-sm font-medium hover:text-primary-700"
          >
            Create New Strategy →
          </Link>
        </div>

        {savedStrategies.length === 0 ? (
          <div className="card bg-slate-50">
            <div className="text-center py-8">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 mb-2">No strategies yet</h3>
              <p className="text-sm text-slate-600 mb-4">
                Create your first custom trading strategy to get started
              </p>
              <Link
                to="/strategy-builder"
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                Create Strategy
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedStrategies.map((strategy) => (
              <div key={strategy.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">{strategy.name}</h3>
                  <button
                    onClick={() => deleteStrategy(strategy.id)}
                    className="text-error hover:text-error-dark"
                    title="Delete strategy"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {strategy.description || 'No description'}
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <span className="text-slate-500">Entry Rules:</span>
                    <span className="ml-1 font-medium">{strategy.entry_rules.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Exit Rules:</span>
                    <span className="ml-1 font-medium">{strategy.exit_rules.length}</span>
                  </div>
                </div>
                <Link
                  to="/backtest"
                  onClick={() => {
                    // Save to sessionStorage so Backtest page can use it
                    sessionStorage.setItem('pendingStrategy', JSON.stringify(strategy))
                  }}
                  className="btn btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Test Strategy
                </Link>
              </div>
            ))}
          </div>
        )}
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
            <span>Create a strategy using the Strategy Builder or choose from templates</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-primary-600">2.</span>
            <span>Select an asset (stock, crypto, or forex) to test against</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-primary-600">3.</span>
            <span>Configure your backtest parameters (date range, capital, commission)</span>
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
