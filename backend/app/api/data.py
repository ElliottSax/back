from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.api.backtest import AssetClass


router = APIRouter()


class DataRequest(BaseModel):
    """Market data request model."""
    symbol: str = Field(..., description="Asset symbol")
    asset_class: AssetClass = Field(default=AssetClass.STOCK)
    start_date: datetime
    end_date: datetime
    timeframe: str = Field(default="1d", description="Data timeframe")


class DataResponse(BaseModel):
    """Market data response model."""
    symbol: str
    asset_class: AssetClass
    timeframe: str
    data_points: int
    data: List[Dict[str, Any]]


class SymbolSearchResult(BaseModel):
    """Symbol search result."""
    symbol: str
    name: str
    asset_class: AssetClass
    exchange: Optional[str] = None


@router.post("/fetch", response_model=DataResponse)
async def fetch_historical_data(request: DataRequest):
    """
    Fetch historical market data for a given symbol.

    Supports multiple asset classes and timeframes.
    """
    try:
        from app.services.data_service import DataService

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

        # Convert DataFrame to list of dicts
        data_list = df.reset_index().to_dict(orient='records')

        return DataResponse(
            symbol=request.symbol,
            asset_class=request.asset_class,
            timeframe=request.timeframe,
            data_points=len(data_list),
            data=data_list
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search", response_model=List[SymbolSearchResult])
async def search_symbols(
    query: str = Query(..., min_length=1, description="Search query"),
    asset_class: Optional[AssetClass] = Query(None, description="Filter by asset class"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results")
):
    """
    Search for symbols across different asset classes.
    """
    # TODO: Implement symbol search with real data sources
    # This is a placeholder implementation
    results = [
        SymbolSearchResult(
            symbol="AAPL",
            name="Apple Inc.",
            asset_class=AssetClass.STOCK,
            exchange="NASDAQ"
        ),
        SymbolSearchResult(
            symbol="BTC-USD",
            name="Bitcoin",
            asset_class=AssetClass.CRYPTO,
            exchange="Coinbase"
        )
    ]

    # Filter by asset class if provided
    if asset_class:
        results = [r for r in results if r.asset_class == asset_class]

    # Filter by query
    results = [
        r for r in results
        if query.upper() in r.symbol.upper() or query.upper() in r.name.upper()
    ]

    return results[:limit]


@router.get("/available-assets")
async def get_available_assets():
    """
    Get list of all supported asset classes and their data sources.
    """
    return {
        "asset_classes": [
            {
                "name": "stock",
                "display_name": "Stocks & ETFs",
                "sources": ["Yahoo Finance"],
                "timeframes": ["1d", "1h", "5m"],
                "features": ["dividends", "splits"]
            },
            {
                "name": "crypto",
                "display_name": "Cryptocurrency",
                "sources": ["Yahoo Finance", "CCXT"],
                "timeframes": ["1d", "1h", "15m", "5m", "1m"],
                "features": ["24/7 trading"]
            },
            {
                "name": "forex",
                "display_name": "Forex",
                "sources": ["Alpha Vantage"],
                "timeframes": ["1d", "1h", "15m"],
                "features": ["major pairs", "minor pairs"]
            },
            {
                "name": "option",
                "display_name": "Options",
                "sources": ["Alpha Vantage"],
                "timeframes": ["1d"],
                "features": ["greeks", "multi-leg"]
            }
        ]
    }


@router.get("/cache/stats")
async def get_cache_stats():
    """
    Get data cache statistics.
    """
    from app.services.data_service import DataService
    return DataService.get_cache_stats()


@router.post("/cache/clear")
async def clear_cache():
    """
    Clear the data cache to force fresh data fetching.
    """
    from app.services.data_service import DataService
    data_service = DataService()
    return data_service.clear_cache()
