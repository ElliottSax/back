export enum AssetClass {
  STOCK = 'stock',
  CRYPTO = 'crypto',
  FOREX = 'forex',
  OPTION = 'option',
}

export enum IndicatorType {
  SMA = 'sma',
  EMA = 'ema',
  RSI = 'rsi',
  MACD = 'macd',
  BBANDS = 'bbands',
  ATR = 'atr',
  STOCHASTIC = 'stochastic',
}

export enum ConditionType {
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CROSSES_ABOVE = 'crosses_above',
  CROSSES_BELOW = 'crosses_below',
  EQUALS = 'equals',
}

export interface StrategyRule {
  indicator: IndicatorType
  params: Record<string, any>
  condition: ConditionType
  compare_to: any
}

export interface StrategyDefinition {
  name: string
  description?: string
  entry_rules: StrategyRule[]
  exit_rules: StrategyRule[]
  position_size: number
  stop_loss?: number
  take_profit?: number
  max_positions: number
}

export interface Strategy {
  id: string
  name: string
  description?: string
  definition: StrategyDefinition
  created_at: string
  updated_at: string
  is_public: boolean
  author?: string
}

export interface BacktestRequest {
  symbol: string
  asset_class: AssetClass
  strategy_id?: string
  strategy_definition?: StrategyDefinition
  start_date: string
  end_date: string
  initial_capital: number
  commission: number
  timeframe: string
}

export interface Trade {
  entry_time: string
  exit_time: string
  entry_price: number
  exit_price: number
  size: number
  pnl: number
  return_pct: number
}

export interface EquityPoint {
  date: string
  equity: number
}

export interface BacktestResult {
  symbol: string
  asset_class: AssetClass
  start_date: string
  end_date: string
  initial_capital: number
  final_value: number
  total_return: number
  total_return_pct: number
  sharpe_ratio?: number
  max_drawdown: number
  max_drawdown_pct: number
  win_rate: number
  total_trades: number
  winning_trades: number
  losing_trades: number
  avg_win: number
  avg_loss: number
  profit_factor?: number
  equity_curve: EquityPoint[]
  trades: Trade[]
}

export interface MarketData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface DataRequest {
  symbol: string
  asset_class: AssetClass
  start_date: string
  end_date: string
  timeframe: string
}

export interface DataResponse {
  symbol: string
  asset_class: AssetClass
  timeframe: string
  data_points: number
  data: MarketData[]
}
