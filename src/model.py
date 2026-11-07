from enum import Enum


class Trend(Enum):
    BULLISH = "BULLISH"
    NEUTRAL = "NEUTRAL"
    BEARISH = "BEARISH"


class RiskLevel(Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH_RISK = "HIGH_RISK"


class RsiMovementStatus(Enum):
    OVERSOLD = "OVERSOLD"
    BALANCED = "BALENCED"
    OVERBOUGHT = "OVERBOUGHT"


class VolitilityStatus(Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    ELEVATED = "ELEVATED"
