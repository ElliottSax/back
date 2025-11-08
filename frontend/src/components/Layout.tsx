import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, Layers, Play, Database, Settings } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/strategy-builder', label: 'Strategy Builder', icon: Layers },
    { path: '/backtest', label: 'Backtest', icon: Play },
    { path: '/data-explorer', label: 'Data Explorer', icon: Database },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            <span>Backtest Pro</span>
          </h1>
        </div>

        <nav className="mt-6">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 text-slate-400 text-sm">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout
