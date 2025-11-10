import axios from 'axios'
import type {
  BacktestRequest,
  BacktestResult,
  Strategy,
  StrategyDefinition,
  DataRequest,
  DataResponse,
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

// Debug: Log the API URL being used
console.log('API_BASE_URL:', API_BASE_URL)
console.log('VITE_API_URL env:', import.meta.env.VITE_API_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Backtest API
export const backtestAPI = {
  run: async (request: BacktestRequest): Promise<BacktestResult> => {
    const response = await api.post<BacktestResult>('/backtest/run', request)
    return response.data
  },

  getStatus: async (backtestId: string) => {
    const response = await api.get(`/backtest/status/${backtestId}`)
    return response.data
  },
}

// Strategy API
export const strategyAPI = {
  list: async (params?: { limit?: number; offset?: number; search?: string }): Promise<Strategy[]> => {
    const response = await api.get<Strategy[]>('/strategies/', { params })
    return response.data
  },

  get: async (strategyId: string): Promise<Strategy> => {
    const response = await api.get<Strategy>(`/strategies/${strategyId}`)
    return response.data
  },

  create: async (definition: StrategyDefinition): Promise<Strategy> => {
    const response = await api.post<Strategy>('/strategies/', definition)
    return response.data
  },

  update: async (strategyId: string, definition: StrategyDefinition): Promise<Strategy> => {
    const response = await api.put<Strategy>(`/strategies/${strategyId}`, definition)
    return response.data
  },

  delete: async (strategyId: string): Promise<void> => {
    await api.delete(`/strategies/${strategyId}`)
  },

  getTemplates: async () => {
    const response = await api.get('/strategies/templates/list')
    return response.data
  },
}

// Data API
export const dataAPI = {
  fetch: async (request: DataRequest): Promise<DataResponse> => {
    const response = await api.post<DataResponse>('/data/fetch', request)
    return response.data
  },

  search: async (query: string, assetClass?: string, limit?: number) => {
    const response = await api.get('/data/search', {
      params: { query, asset_class: assetClass, limit },
    })
    return response.data
  },

  getAvailableAssets: async () => {
    const response = await api.get('/data/available-assets')
    return response.data
  },
}

export default api
