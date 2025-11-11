import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Save, Play, ArrowRight } from 'lucide-react'
import { IndicatorType, ConditionType, StrategyDefinition } from '@/types'

interface Rule {
  id: string
  indicator: IndicatorType | ''
  params: Record<string, number>
  condition: ConditionType | ''
  compare_to: {
    indicator?: IndicatorType
    params?: Record<string, number>
  } | number
}

const StrategyBuilder = () => {
  const navigate = useNavigate()
  const [strategyName, setStrategyName] = useState('')
  const [description, setDescription] = useState('')
  const [entryRules, setEntryRules] = useState<Rule[]>([])
  const [exitRules, setExitRules] = useState<Rule[]>([])
  const [positionSize, setPositionSize] = useState(1.0)

  const createNewRule = (): Rule => ({
    id: Math.random().toString(36).substr(2, 9),
    indicator: '',
    params: {},
    condition: '',
    compare_to: 0,
  })

  const addEntryRule = () => {
    setEntryRules([...entryRules, createNewRule()])
  }

  const addExitRule = () => {
    setExitRules([...exitRules, createNewRule()])
  }

  const removeEntryRule = (id: string) => {
    setEntryRules(entryRules.filter((rule) => rule.id !== id))
  }

  const removeExitRule = (id: string) => {
    setExitRules(exitRules.filter((rule) => rule.id !== id))
  }

  const updateEntryRule = (id: string, updates: Partial<Rule>) => {
    setEntryRules(
      entryRules.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule))
    )
  }

  const updateExitRule = (id: string, updates: Partial<Rule>) => {
    setExitRules(
      exitRules.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule))
    )
  }

  const getIndicatorParams = (indicator: IndicatorType | '') => {
    switch (indicator) {
      case IndicatorType.SMA:
      case IndicatorType.EMA:
        return ['period']
      case IndicatorType.RSI:
        return ['period']
      case IndicatorType.MACD:
        return ['fast', 'slow', 'signal']
      default:
        return []
    }
  }

  const saveStrategy = () => {
    if (!strategyName) {
      alert('Please enter a strategy name')
      return
    }

    const strategy: StrategyDefinition = {
      name: strategyName,
      description,
      entry_rules: entryRules.map((rule) => ({
        indicator: rule.indicator as IndicatorType,
        params: rule.params,
        condition: rule.condition as ConditionType,
        compare_to: rule.compare_to,
      })),
      exit_rules: exitRules.map((rule) => ({
        indicator: rule.indicator as IndicatorType,
        params: rule.params,
        condition: rule.condition as ConditionType,
        compare_to: rule.compare_to,
      })),
      position_size: positionSize,
      max_positions: 1,
    }

    // Save to localStorage
    const savedStrategies = JSON.parse(
      localStorage.getItem('strategies') || '[]'
    )
    savedStrategies.push({ ...strategy, id: Date.now().toString() })
    localStorage.setItem('strategies', JSON.stringify(savedStrategies))

    alert(`Strategy "${strategyName}" saved successfully!`)
  }

  const testStrategy = () => {
    if (!strategyName || entryRules.length === 0) {
      alert('Please add a strategy name and at least one entry rule')
      return
    }

    const strategy: StrategyDefinition = {
      name: strategyName,
      description,
      entry_rules: entryRules.map((rule) => ({
        indicator: rule.indicator as IndicatorType,
        params: rule.params,
        condition: rule.condition as ConditionType,
        compare_to: rule.compare_to,
      })),
      exit_rules: exitRules.map((rule) => ({
        indicator: rule.indicator as IndicatorType,
        params: rule.params,
        condition: rule.condition as ConditionType,
        compare_to: rule.compare_to,
      })),
      position_size: positionSize,
      max_positions: 1,
    }

    // Save to sessionStorage for the backtest page to use
    sessionStorage.setItem('pendingStrategy', JSON.stringify(strategy))
    navigate('/backtest')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Strategy Builder</h1>
        <p className="text-slate-600 mt-2">
          Create custom trading strategies with technical indicators
        </p>
      </div>

      {/* Basic Information */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Strategy Name</label>
            <input
              type="text"
              className="input"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              placeholder="e.g., My SMA Crossover Strategy"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your strategy..."
            />
          </div>
          <div>
            <label className="label">Position Size (fraction of capital)</label>
            <input
              type="number"
              className="input"
              value={positionSize}
              onChange={(e) => setPositionSize(Number(e.target.value))}
              min="0.1"
              max="1"
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* Entry Rules */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Entry Rules (Buy Conditions)</h2>
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={addEntryRule}
          >
            <Plus className="w-4 h-4" />
            Add Entry Rule
          </button>
        </div>

        {entryRules.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No entry rules yet. Click "Add Entry Rule" to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {entryRules.map((rule, index) => (
              <RuleEditor
                key={rule.id}
                rule={rule}
                index={index}
                onUpdate={(updates) => updateEntryRule(rule.id, updates)}
                onRemove={() => removeEntryRule(rule.id)}
                getIndicatorParams={getIndicatorParams}
              />
            ))}
          </div>
        )}
      </div>

      {/* Exit Rules */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Exit Rules (Sell Conditions)</h2>
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={addExitRule}
          >
            <Plus className="w-4 h-4" />
            Add Exit Rule
          </button>
        </div>

        {exitRules.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No exit rules yet. Click "Add Exit Rule" to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {exitRules.map((rule, index) => (
              <RuleEditor
                key={rule.id}
                rule={rule}
                index={index}
                onUpdate={(updates) => updateExitRule(rule.id, updates)}
                onRemove={() => removeExitRule(rule.id)}
                getIndicatorParams={getIndicatorParams}
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={saveStrategy}
        >
          <Save className="w-4 h-4" />
          Save Strategy
        </button>
        <button
          className="btn bg-success text-white hover:bg-success-dark flex items-center gap-2"
          onClick={testStrategy}
        >
          <Play className="w-4 h-4" />
          Test Strategy
        </button>
      </div>
    </div>
  )
}

interface RuleEditorProps {
  rule: Rule
  index: number
  onUpdate: (updates: Partial<Rule>) => void
  onRemove: () => void
  getIndicatorParams: (indicator: IndicatorType | '') => string[]
}

const RuleEditor = ({ rule, index, onUpdate, onRemove, getIndicatorParams }: RuleEditorProps) => {
  const [compareType, setCompareType] = useState<'value' | 'indicator'>('value')

  const handleIndicatorChange = (indicator: IndicatorType | '') => {
    const params: Record<string, number> = {}

    // Set default params based on indicator
    if (indicator === IndicatorType.SMA || indicator === IndicatorType.EMA) {
      params.period = 20
    } else if (indicator === IndicatorType.RSI) {
      params.period = 14
    } else if (indicator === IndicatorType.MACD) {
      params.fast = 12
      params.slow = 26
      params.signal = 9
    }

    onUpdate({ indicator, params })
  }

  const handleParamChange = (paramName: string, value: number) => {
    onUpdate({
      params: { ...rule.params, [paramName]: value },
    })
  }

  const handleCompareToChange = (value: string, type: 'value' | 'indicator') => {
    if (type === 'value') {
      onUpdate({ compare_to: Number(value) })
    } else {
      // For indicator comparison, we'll use the same structure as entry rules
      onUpdate({
        compare_to: {
          indicator: value as IndicatorType,
          params: {},
        },
      })
    }
  }

  const handleCompareIndicatorParamChange = (paramName: string, value: number) => {
    if (typeof rule.compare_to === 'object' && 'indicator' in rule.compare_to) {
      onUpdate({
        compare_to: {
          ...rule.compare_to,
          params: { ...rule.compare_to.params, [paramName]: value },
        },
      })
    }
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-medium text-slate-900">Rule {index + 1}</h3>
        <button
          onClick={onRemove}
          className="text-error hover:text-error-dark"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Indicator Selection */}
        <div>
          <label className="label">Indicator</label>
          <select
            className="input"
            value={rule.indicator}
            onChange={(e) => handleIndicatorChange(e.target.value as IndicatorType)}
          >
            <option value="">Select indicator...</option>
            <option value={IndicatorType.SMA}>SMA (Simple Moving Average)</option>
            <option value={IndicatorType.EMA}>EMA (Exponential Moving Average)</option>
            <option value={IndicatorType.RSI}>RSI (Relative Strength Index)</option>
            <option value={IndicatorType.MACD}>MACD</option>
          </select>
        </div>

        {/* Indicator Parameters */}
        {rule.indicator && getIndicatorParams(rule.indicator).map((paramName) => (
          <div key={paramName}>
            <label className="label capitalize">{paramName}</label>
            <input
              type="number"
              className="input"
              value={rule.params[paramName] || ''}
              onChange={(e) => handleParamChange(paramName, Number(e.target.value))}
              min="1"
            />
          </div>
        ))}

        {/* Condition */}
        <div>
          <label className="label">Condition</label>
          <select
            className="input"
            value={rule.condition}
            onChange={(e) => onUpdate({ condition: e.target.value as ConditionType })}
          >
            <option value="">Select condition...</option>
            <option value={ConditionType.GREATER_THAN}>Greater Than</option>
            <option value={ConditionType.LESS_THAN}>Less Than</option>
            <option value={ConditionType.CROSSES_ABOVE}>Crosses Above</option>
            <option value={ConditionType.CROSSES_BELOW}>Crosses Below</option>
          </select>
        </div>

        {/* Compare To Type */}
        <div>
          <label className="label">Compare To</label>
          <select
            className="input"
            value={compareType}
            onChange={(e) => setCompareType(e.target.value as 'value' | 'indicator')}
          >
            <option value="value">Fixed Value</option>
            <option value="indicator">Another Indicator</option>
          </select>
        </div>

        {/* Compare To Value/Indicator */}
        {compareType === 'value' ? (
          <div>
            <label className="label">Value</label>
            <input
              type="number"
              className="input"
              value={typeof rule.compare_to === 'number' ? rule.compare_to : 0}
              onChange={(e) => handleCompareToChange(e.target.value, 'value')}
              step="0.01"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="label">Indicator</label>
              <select
                className="input"
                value={
                  typeof rule.compare_to === 'object' && 'indicator' in rule.compare_to
                    ? rule.compare_to.indicator
                    : ''
                }
                onChange={(e) => {
                  const indicator = e.target.value as IndicatorType
                  const params: Record<string, number> = {}

                  if (indicator === IndicatorType.SMA || indicator === IndicatorType.EMA) {
                    params.period = 50
                  } else if (indicator === IndicatorType.RSI) {
                    params.period = 14
                  } else if (indicator === IndicatorType.MACD) {
                    params.fast = 12
                    params.slow = 26
                    params.signal = 9
                  }

                  onUpdate({ compare_to: { indicator, params } })
                }}
              >
                <option value="">Select indicator...</option>
                <option value={IndicatorType.SMA}>SMA</option>
                <option value={IndicatorType.EMA}>EMA</option>
                <option value={IndicatorType.RSI}>RSI</option>
                <option value={IndicatorType.MACD}>MACD</option>
              </select>
            </div>

            {/* Compare Indicator Parameters */}
            {typeof rule.compare_to === 'object' &&
              'indicator' in rule.compare_to &&
              rule.compare_to.indicator &&
              getIndicatorParams(rule.compare_to.indicator).map((paramName) => (
                <div key={`compare-${paramName}`}>
                  <label className="label capitalize">{paramName}</label>
                  <input
                    type="number"
                    className="input"
                    value={rule.compare_to && typeof rule.compare_to === 'object' && 'params' in rule.compare_to ? rule.compare_to.params?.[paramName] || '' : ''}
                    onChange={(e) =>
                      handleCompareIndicatorParamChange(paramName, Number(e.target.value))
                    }
                    min="1"
                  />
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  )
}

export default StrategyBuilder
