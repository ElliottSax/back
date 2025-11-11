# Strategy Testing & Validation Guide

## Overview
This document provides comprehensive testing guidance for all 8 template strategies.

---

## Test Environment
- **Symbol**: TSLA
- **Date Range**: 2020-01-01 to 2022-12-31 (~756 trading days)
- **Initial Capital**: $10,000
- **Commission**: 0.1%

---

## Expected Behavior by Strategy

### 1. Buy and Hold 🎯 **CRITICAL TEST**

**Logic:**
- Entry: SMA(1) > 0 (price is positive)
- Exit: SMA(1) < 0 (never, for stocks)
- Position: Uses ALL $10,000 capital

**Expected Results:**
- ✅ **Exactly 1 trade** (entry only, no exit)
- ✅ **Final Value >> $10,000** (TSLA grew significantly 2020-2022)
- ✅ **Total Return should be +50% to +100%** (depending on exact dates)
- ✅ **Equity curve smoothly follows TSLA price**
- ✅ **Win Rate: N/A or 0%** (no completed trades)
- ✅ **Trade History: 1 entry with no exit date**

**Failure Indicators:**
- ❌ Final Value ≈ $10,000 (position sizing broken)
- ❌ More than 1 trade (exit logic broken)
- ❌ 0 trades (entry logic broken)

**TSLA 2020-2022 Context:**
- Start (Jan 2020): ~$30 (pre-split adjusted)
- Peak (Nov 2021): ~$400
- End (Dec 2022): ~$120
- Buy and hold should capture this massive growth

---

### 2. SMA Crossover (50/200) - Golden Cross

**Logic:**
- Entry: SMA(50) crosses above SMA(200)
- Exit: SMA(50) crosses below SMA(200)

**Expected Results:**
- ✅ **1-3 trades** (slow-moving strategy)
- ✅ **Low trade frequency** (crossovers are rare)
- ✅ **Some trades may be incomplete** (entered but not exited by end)
- ✅ **Win Rate: ~50%** (trend following works in trends, fails in chop)

**Technical Requirements:**
- Needs 200+ bars of data before signals (met with 756 bars)
- First possible signal around bar 200

---

### 3. EMA Crossover (12/26) - Fast Trend

**Logic:**
- Entry: EMA(12) crosses above EMA(26)
- Exit: EMA(12) crosses below EMA(26)

**Expected Results:**
- ✅ **3-10 trades** (faster than SMA crossover)
- ✅ **More responsive to price changes**
- ✅ **Higher trade frequency than SMA**
- ✅ **Win Rate: 40-60%**

**Key Difference from SMA:**
- EMA reacts faster to recent price changes
- Should generate signals earlier than SMA(50/200)

---

### 4. RSI Oversold/Overbought - Mean Reversion

**Logic:**
- Entry: RSI(14) < 30 (oversold)
- Exit: RSI(14) > 70 (overbought)

**Expected Results:**
- ✅ **Variable trades** (depends on volatility)
- ✅ **Works best in ranging markets**
- ✅ **May have few trades in strong trends** (RSI stays above 30)
- ✅ **Win Rate: Variable** (50-70% in ranging markets)

**TSLA 2020-2022 Context:**
- TSLA had strong bull trend (few oversold conditions)
- May show 0-5 trades due to persistent uptrend

---

### 5. RSI Momentum - Trend Following

**Logic:**
- Entry: RSI(14) crosses above 50
- Exit: RSI(14) crosses below 50

**Expected Results:**
- ✅ **5-15 trades** (medium frequency)
- ✅ **Catches momentum shifts**
- ✅ **More trades than RSI oversold strategy**
- ✅ **Win Rate: 40-60%**

**Technical Detail:**
- RSI crossing 50 indicates momentum shift
- More sensitive than SMA/EMA crossovers

---

### 6. MACD Zero-Line Crossover

**Logic:**
- Entry: MACD crosses above 0
- Exit: MACD crosses below 0

**Expected Results:**
- ✅ **3-8 trades** (medium frequency)
- ✅ **Trend following characteristics**
- ✅ **Similar behavior to EMA crossover**
- ✅ **Win Rate: 40-60%**

**Technical Detail:**
- MACD above 0 = bullish momentum
- MACD below 0 = bearish momentum

---

### 7. Triple Moving Average Trend - Conservative

**Logic:**
- Entry: SMA(20) > SMA(50) > SMA(200) (all aligned bullish)
- Exit: SMA(20) crosses below SMA(50) (alignment breaks)

**Expected Results:**
- ✅ **1-3 trades** (very conservative)
- ✅ **Requires strong sustained trends**
- ✅ **May have 0 trades** (conditions rarely met)
- ✅ **Win Rate: Variable** (high confidence when triggered)

**Technical Detail:**
- Most restrictive strategy (3 conditions must align)
- Excellent for strong bull markets
- May miss opportunities waiting for alignment

---

### 8. Trend Following with RSI Filter - Smart Entry

**Logic:**
- Entry: SMA(50) crosses above SMA(200) AND RSI > 30
- Exit: SMA(50) crosses below SMA(200)

**Expected Results:**
- ✅ **1-2 trades** (similar to SMA crossover)
- ✅ **Fewer trades than pure SMA** (RSI filter rejects some)
- ✅ **May miss golden crosses** (if RSI ≤ 30 at crossover)
- ✅ **Win Rate: Similar to SMA or slightly better**

**Technical Detail:**
- Avoids entries during extreme weakness (RSI ≤ 30)
- Filter activates only on the crossover bar
- Next bar, must wait for next crossover

---

## Global Validation Checks

### ✅ Required for ALL Strategies:

1. **Equity Curve Dates**
   - X-axis shows: 2020, 2021, 2022
   - NO weird years: 2042, 1991, 137, etc.

2. **Win Rate Display**
   - Shows "X/Y trades" format
   - NOT "0/Y trades" when there are winning trades

3. **Performance Metrics**
   - Total Return displays correctly
   - Win Rate percentage matches X/Y ratio
   - Max Drawdown shows realistic values (0-100%)
   - Sharpe Ratio is numeric or N/A

4. **Trade History**
   - Dates formatted as MM/DD/YYYY
   - Entry/Exit prices are realistic TSLA prices ($30-400 range)
   - P/L values are reasonable
   - Return percentages match P/L

5. **No Errors**
   - No backend errors in console
   - No "NaN" or "undefined" in UI
   - Backtest completes in < 10 seconds

---

## Known Edge Cases & Limitations

### 1. Strategies with 0 Trades
Some strategies may legitimately produce 0 trades:
- **Triple MA Trend**: Conditions rarely align
- **RSI Oversold**: Strong uptrend = no oversold conditions
- **Trend + RSI Filter**: RSI might be ≤ 30 during golden cross

**This is NOT a bug** - it's valid strategy behavior with this data.

### 2. Incomplete Trades
Last trade may show:
- Entry but no exit
- Exit date = End date

**This is correct** - strategy was still in position when backtest ended.

### 3. Early Strategy Start
Strategies requiring long periods (SMA 200) will:
- Not trade for first ~200 bars
- Show "Trade History: No trades" initially

**This is correct** - indicators need warmup period.

### 4. Buy and Hold Special Case
Buy and Hold shows:
- 1 trade in trade history
- But Win Rate may be N/A or 0% (no completed round trip)

**This is correct** - position never closed, so no "win" or "loss."

---

## Testing Checklist

### Phase 1: Critical Tests
- [ ] **Buy and Hold**: Verify uses all capital and shows large returns
- [ ] **Equity Curve**: Dates show 2020-2022 (not weird years)
- [ ] **Win Rate**: Shows "X/Y trades" (not "0/Y")

### Phase 2: Strategy Execution
- [ ] **All 8 strategies**: Execute without errors
- [ ] **Trade counts**: Match expected ranges
- [ ] **Performance metrics**: Display correctly

### Phase 3: Data Validation
- [ ] **Trade dates**: Within 2020-2022 range
- [ ] **Trade prices**: Within TSLA's actual range ($30-400)
- [ ] **P/L calculations**: Mathematically correct

### Phase 4: Edge Cases
- [ ] **0 trades**: Strategies handle gracefully (show message)
- [ ] **Incomplete trades**: Last position handled correctly
- [ ] **NaN handling**: No crashes with insufficient data

---

## Debugging Commands

If issues occur, check browser console for:

```javascript
// These logs show the full request/response cycle:
🚀 STARTING BACKTEST
✅ BACKTEST SUCCESS
📊 backtestResult state changed
🔍 Render check

// Look for errors:
❌ BACKTEST ERROR: [error details]
```

Backend logs on Railway will show:
```
Available stat keys: [list of metrics]
Warning: Stat key 'X' not found
```

---

## Success Criteria

### Minimum Bar (MVP):
- ✅ Buy and Hold shows positive returns (uses all capital)
- ✅ At least 6/8 strategies execute without errors
- ✅ Equity curve dates are correct
- ✅ Win rate displays correctly

### Full Success:
- ✅ All 8 strategies execute without errors
- ✅ All strategies produce expected trade counts
- ✅ No NaN or undefined values anywhere
- ✅ Performance metrics are mathematically accurate
- ✅ UI is responsive and intuitive

---

## Reporting Issues

When reporting issues, include:
1. **Strategy name** that failed
2. **Error message** from console
3. **Expected behavior** vs **actual behavior**
4. **Screenshot** of results (if helpful)
5. **Test parameters** (symbol, dates, capital)

---

*Last Updated: 2025-11-11*
*Version: 1.0*
