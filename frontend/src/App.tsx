import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import StrategyBuilder from './pages/StrategyBuilder'
import Backtest from './pages/Backtest'
import Results from './pages/Results'
import DataExplorer from './pages/DataExplorer'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/strategy-builder" element={<StrategyBuilder />} />
          <Route path="/backtest" element={<Backtest />} />
          <Route path="/results/:id" element={<Results />} />
          <Route path="/data-explorer" element={<DataExplorer />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
