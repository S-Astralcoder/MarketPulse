from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field


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


class SignInPayload(BaseModel):
    model_config = ConfigDict(regex_engine="python-re")
    name: str = Field(min_length=2)
    password: str = Field(
        min_length=8,
        max_length=50,
        pattern=r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-+_!@#$%^&*.,?]).+$",
    )


class RegisterPayload(SignInPayload):
    email: EmailStr = Field(min_length=8)
