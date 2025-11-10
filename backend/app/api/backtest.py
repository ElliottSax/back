from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


router = APIRouter()


class AssetClass(str, Enum):
    """Supported asset classes."""
    STOCK = "stock"
    CRYPTO = "crypto"
    FOREX = "forex"
    OPTION = "option"


class BacktestRequest(BaseModel):
    """Backtest request model."""
    symbol: str = Field(..., description="Asset symbol (e.g., AAPL, BTC-USD)")
    asset_class: AssetClass = Field(default=AssetClass.STOCK, description="Asset class")
    strategy_id: Optional[str] = Field(None, description="Saved strategy ID")
    strategy_definition: Optional[Dict[str, Any]] = Field(None, description="Strategy definition")
    start_date: datetime = Field(..., description="Backtest start date")
    end_date: datetime = Field(..., description="Backtest end date")
    initial_capital: float = Field(default=10000.0, ge=0, description="Initial capital")
    commission: float = Field(default=0.001, ge=0, le=1, description="Commission per trade")
    timeframe: str = Field(default="1d", description="Data timeframe (1d, 1h, 15m, etc.)")


class BacktestResult(BaseModel):
    """Backtest result model."""
    symbol: str
    asset_class: AssetClass
    start_date: datetime
    end_date: datetime
    initial_capital: float
    final_value: float
    total_return: float
    total_return_pct: float
    sharpe_ratio: Optional[float]
    max_drawdown: float
    max_drawdown_pct: float
    win_rate: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    avg_win: float
    avg_loss: float
    profit_factor: Optional[float]
    equity_curve: List[Dict[str, Any]]
    trades: List[Dict[str, Any]]


@router.post("/run", response_model=BacktestResult)
async def run_backtest(request: BacktestRequest):
    """
    Run a backtest with the specified strategy and parameters.

    This endpoint executes a backtest and returns comprehensive results including
    performance metrics, equity curve, and trade history.
    """
    try:
        # Import here to avoid circular dependencies
        from backtesting.engine import BacktestEngine
        from app.services.data_service import DataService

        # Validate request
        if not request.strategy_id and not request.strategy_definition:
            raise HTTPException(
                status_code=400,
                detail="Either strategy_id or strategy_definition must be provided"
            )

        # Fetch historical data
        data_service = DataService()
        df = await data_service.get_historical_data(
            symbol=request.symbol,
            asset_class=request.asset_class,
            start_date=request.start_date,
            end_date=request.end_date,
            timeframe=request.timeframe
        )

        if df.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for {request.symbol}"
            )

        # Initialize backtesting engine
        engine = BacktestEngine(
            data=df,
            initial_capital=request.initial_capital,
            commission=request.commission
        )

        # Load or create strategy
        if request.strategy_id:
            strategy = await engine.load_strategy(request.strategy_id)
        else:
            strategy = engine.create_strategy_from_definition(request.strategy_definition)

        # Run backtest
        result = await engine.run(strategy)

        return BacktestResult(
            symbol=request.symbol,
            asset_class=request.asset_class,
            start_date=request.start_date,
            end_date=request.end_date,
            initial_capital=request.initial_capital,
            final_value=result['final_value'],
            total_return=result['total_return'],
            total_return_pct=result['total_return_pct'],
            sharpe_ratio=result.get('sharpe_ratio'),
            max_drawdown=result['max_drawdown'],
            max_drawdown_pct=result['max_drawdown_pct'],
            win_rate=result['win_rate'],
            total_trades=result['total_trades'],
            winning_trades=result['winning_trades'],
            losing_trades=result['losing_trades'],
            avg_win=result['avg_win'],
            avg_loss=result['avg_loss'],
            profit_factor=result.get('profit_factor'),
            equity_curve=result['equity_curve'],
            trades=result['trades']
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        print(f"ERROR in run_backtest: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)


@router.get("/status/{backtest_id}")
async def get_backtest_status(backtest_id: str):
    """
    Get the status of a running backtest (for async execution).
    """
    # TODO: Implement async backtest tracking
    return {"status": "pending", "message": "Async backtests not yet implemented"}
