from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum


router = APIRouter()


class IndicatorType(str, Enum):
    """Available technical indicators."""
    SMA = "sma"
    EMA = "ema"
    RSI = "rsi"
    MACD = "macd"
    BBANDS = "bbands"
    ATR = "atr"
    STOCHASTIC = "stochastic"


class ConditionType(str, Enum):
    """Condition types for strategy rules."""
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    CROSSES_ABOVE = "crosses_above"
    CROSSES_BELOW = "crosses_below"
    EQUALS = "equals"


class StrategyRule(BaseModel):
    """Individual strategy rule."""
    indicator: IndicatorType
    params: Dict[str, Any] = Field(default_factory=dict)
    condition: ConditionType
    compare_to: Any  # Can be another indicator or a value


class StrategyDefinition(BaseModel):
    """Complete strategy definition."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    entry_rules: List[StrategyRule] = Field(..., min_items=1)
    exit_rules: List[StrategyRule] = Field(..., min_items=1)
    position_size: float = Field(default=1.0, ge=0, le=1)
    stop_loss: Optional[float] = Field(None, ge=0, le=1)
    take_profit: Optional[float] = Field(None, ge=0)
    max_positions: int = Field(default=1, ge=1)


class Strategy(BaseModel):
    """Saved strategy model."""
    id: str
    name: str
    description: Optional[str]
    definition: StrategyDefinition
    created_at: datetime
    updated_at: datetime
    is_public: bool = False
    author: Optional[str] = None


# In-memory storage for demo (replace with database)
strategies_db: Dict[str, Strategy] = {}


@router.post("/", response_model=Strategy)
async def create_strategy(definition: StrategyDefinition):
    """
    Create a new strategy.

    Saves a strategy definition that can be reused for multiple backtests.
    """
    import uuid
    from datetime import datetime

    strategy_id = str(uuid.uuid4())
    now = datetime.utcnow()

    strategy = Strategy(
        id=strategy_id,
        name=definition.name,
        description=definition.description,
        definition=definition,
        created_at=now,
        updated_at=now
    )

    strategies_db[strategy_id] = strategy
    return strategy


@router.get("/", response_model=List[Strategy])
async def list_strategies(
    limit: int = 10,
    offset: int = 0,
    search: Optional[str] = None
):
    """
    List all saved strategies.

    Supports pagination and search.
    """
    strategies = list(strategies_db.values())

    if search:
        strategies = [
            s for s in strategies
            if search.lower() in s.name.lower() or
            (s.description and search.lower() in s.description.lower())
        ]

    return strategies[offset:offset + limit]


@router.get("/{strategy_id}", response_model=Strategy)
async def get_strategy(strategy_id: str):
    """
    Get a specific strategy by ID.
    """
    if strategy_id not in strategies_db:
        raise HTTPException(status_code=404, detail="Strategy not found")

    return strategies_db[strategy_id]


@router.put("/{strategy_id}", response_model=Strategy)
async def update_strategy(strategy_id: str, definition: StrategyDefinition):
    """
    Update an existing strategy.
    """
    if strategy_id not in strategies_db:
        raise HTTPException(status_code=404, detail="Strategy not found")

    strategy = strategies_db[strategy_id]
    strategy.definition = definition
    strategy.name = definition.name
    strategy.description = definition.description
    strategy.updated_at = datetime.utcnow()

    return strategy


@router.delete("/{strategy_id}")
async def delete_strategy(strategy_id: str):
    """
    Delete a strategy.
    """
    if strategy_id not in strategies_db:
        raise HTTPException(status_code=404, detail="Strategy not found")

    del strategies_db[strategy_id]
    return {"message": "Strategy deleted successfully"}


@router.get("/templates/list")
async def list_strategy_templates():
    """
    Get pre-built strategy templates.

    These are common strategies that users can use as starting points.
    """
    templates = [
        {
            "id": "sma_crossover",
            "name": "SMA Crossover",
            "description": "Simple moving average crossover strategy",
            "difficulty": "beginner",
            "definition": {
                "name": "SMA Crossover",
                "description": "Buy when fast SMA crosses above slow SMA, sell when it crosses below",
                "entry_rules": [
                    {
                        "indicator": "sma",
                        "params": {"period": 50},
                        "condition": "crosses_above",
                        "compare_to": {"indicator": "sma", "params": {"period": 200}}
                    }
                ],
                "exit_rules": [
                    {
                        "indicator": "sma",
                        "params": {"period": 50},
                        "condition": "crosses_below",
                        "compare_to": {"indicator": "sma", "params": {"period": 200}}
                    }
                ],
                "position_size": 1.0
            }
        },
        {
            "id": "rsi_mean_reversion",
            "name": "RSI Mean Reversion",
            "description": "Buy oversold, sell overbought based on RSI",
            "difficulty": "beginner",
            "definition": {
                "name": "RSI Mean Reversion",
                "description": "Buy when RSI < 30, sell when RSI > 70",
                "entry_rules": [
                    {
                        "indicator": "rsi",
                        "params": {"period": 14},
                        "condition": "less_than",
                        "compare_to": 30
                    }
                ],
                "exit_rules": [
                    {
                        "indicator": "rsi",
                        "params": {"period": 14},
                        "condition": "greater_than",
                        "compare_to": 70
                    }
                ],
                "position_size": 1.0
            }
        },
        {
            "id": "macd_divergence",
            "name": "MACD Divergence",
            "description": "Trade based on MACD line crossing signal line",
            "difficulty": "intermediate",
            "definition": {
                "name": "MACD Divergence",
                "description": "Buy when MACD crosses above signal, sell when it crosses below",
                "entry_rules": [
                    {
                        "indicator": "macd",
                        "params": {"fast": 12, "slow": 26, "signal": 9},
                        "condition": "crosses_above",
                        "compare_to": "signal"
                    }
                ],
                "exit_rules": [
                    {
                        "indicator": "macd",
                        "params": {"fast": 12, "slow": 26, "signal": 9},
                        "condition": "crosses_below",
                        "compare_to": "signal"
                    }
                ],
                "position_size": 1.0
            }
        }
    ]

    return templates
