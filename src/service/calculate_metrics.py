import asyncio
import datetime
from typing import Any

import numpy as np
import pandas as pd
import yfinance as yf
from sqlalchemy import select

from src.database import AsyncSessionFactory, Stock
from src.model import RiskLevel, RsiMovementStatus, Trend, VolitilityStatus


def compute_market_pulse(df: pd.DataFrame) -> dict[str, Any]:
    """Calculate EMA, ADX(14), ATR/NATR, RSI(14), and Composite Risk Score

    over a 1-hour OHLCV DataFrame.

    Requires at least 65 rows of continuous OHLCV data.
    Expected columns: ['Open', 'High', 'Low', 'Close', 'Volume']
    """
    if len(df) < 65:
        raise ValueError(f"Insufficient data: expected >= 65 bars, got {len(df)}")

    # Work on a copy to avoid mutating the caller's frame
    data = df.copy()
    close = data["Close"]
    high = data["High"]
    low = data["Low"]

    # ---------------------------------------------------------
    # 1. Trend: EMA 20 & EMA 50
    # ---------------------------------------------------------
    ema_20 = close.ewm(span=20, adjust=False).mean()
    ema_50 = close.ewm(span=50, adjust=False).mean()

    curr_close = float(close.iloc[-1])
    curr_ema_20 = float(ema_20.iloc[-1])
    curr_ema_50 = float(ema_50.iloc[-1])

    ema_spread_pct = ((curr_ema_20 - curr_ema_50) / curr_ema_50) * 100

    if ema_spread_pct > 0.15 and curr_close > curr_ema_20:
        trend_direction = Trend.BULLISH
    elif ema_spread_pct < -0.15 and curr_close < curr_ema_20:
        trend_direction = Trend.BEARISH
    else:
        trend_direction = Trend.NEUTRAL

    # ---------------------------------------------------------
    # 2. Volatility: True Range, ATR(14), NATR, and ATR Ratio
    # ---------------------------------------------------------
    prev_close = close.shift(1)
    tr1 = high - low
    tr2 = (high - prev_close).abs()
    tr3 = (low - prev_close).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)

    # Wilder's smoothing for ATR (alpha = 1/14)
    atr_14 = tr.ewm(alpha=1 / 14, adjust=False).mean()
    curr_atr = float(atr_14.iloc[-1])

    natr = (curr_atr / curr_close) * 100

    # ATR baseline: 50-period SMA of ATR
    atr_baseline = atr_14.rolling(window=50).mean()
    curr_atr_baseline = float(atr_baseline.iloc[-1])

    atr_ratio = (curr_atr / curr_atr_baseline) if curr_atr_baseline > 0 else 1.0

    if atr_ratio > 1.3:
        volatility_status = VolitilityStatus.ELEVATED
    elif atr_ratio < 0.8:
        volatility_status = VolitilityStatus.LOW
    else:
        volatility_status = VolitilityStatus.NORMAL

    # ---------------------------------------------------------
    # 3. Regime: Wilder's ADX(14)
    # ---------------------------------------------------------
    up_move = high - high.shift(1)
    down_move = low.shift(1) - low

    plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
    minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)

    plus_dm_series = pd.Series(plus_dm, index=data.index)
    minus_dm_series = pd.Series(minus_dm, index=data.index)

    smoothed_tr = tr.ewm(alpha=1 / 14, adjust=False).mean()
    smoothed_plus_dm = plus_dm_series.ewm(alpha=1 / 14, adjust=False).mean()
    smoothed_minus_dm = minus_dm_series.ewm(alpha=1 / 14, adjust=False).mean()

    plus_di = 100 * (smoothed_plus_dm / smoothed_tr)
    minus_di = 100 * (smoothed_minus_dm / smoothed_tr)

    dx = 100 * ((plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan))
    adx_series = dx.ewm(alpha=1 / 14, adjust=False).mean()

    curr_adx = float(adx_series.iloc[-1])
    is_sideways = np.isnan(curr_adx) or curr_adx < 20.0

    # ---------------------------------------------------------
    # 4. Momentum: Wilder's RSI(14)
    # ---------------------------------------------------------
    delta = close.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = (-delta).where(delta < 0, 0.0)

    avg_gain = gain.ewm(alpha=1 / 14, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / 14, adjust=False).mean()

    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi_series = 100 - (100 / (1 + rs))

    curr_rsi = float(rsi_series.iloc[-1])

    if curr_rsi >= 70.0:
        movement_status = RsiMovementStatus.OVERBOUGHT
    elif curr_rsi <= 30.0:
        movement_status = RsiMovementStatus.OVERSOLD
    else:
        movement_status = RsiMovementStatus.BALANCED

    # ---------------------------------------------------------
    # 5. Composite Risk Scoring (Scale: 0 to 100)
    # ---------------------------------------------------------
    risk_score = 0

    # Regime / Chop penalty
    if is_sideways:
        risk_score += 30

    # Trend conflict penalty
    if curr_close < curr_ema_50:
        risk_score += 25
    if curr_ema_20 < curr_ema_50:
        risk_score += 15

    # Volatility shock penalty
    if atr_ratio > 1.3:
        risk_score += 20

    # Momentum extension penalty
    if curr_rsi > 75.0 or curr_rsi < 25.0:
        risk_score += 10

    # Clamp risk score to [0, 100]
    risk_score = min(100, max(0, risk_score))

    if risk_score <= 34:
        risk_level = RiskLevel.LOW
    elif risk_score <= 65:
        risk_level = RiskLevel.MODERATE
    else:
        risk_level = RiskLevel.HIGH_RISK

    return {
        "price_change": round(curr_close - float(close.iloc[-2]), 2),
        "close_price": round(curr_close, 2),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "rsi": round(curr_rsi, 2),
        "movement_status": movement_status,
        "atr": round(curr_atr, 2),
        "natr": round(natr, 2),
        "atr_ratio": round(atr_ratio, 2),
        "volatility_status": volatility_status,
        "ema_fast": round(curr_ema_20),
        "ema_slow": round(curr_ema_50),
        "trend_direction": trend_direction,
        "adx": 0 if np.isnan(curr_adx) else round(curr_adx),
    }


async def fetch_and_calculate_market_metrics():
    async with AsyncSessionFactory() as session:
        stock_symbols = await session.scalars(
            select(Stock.symbol).where(Stock.is_active == True)
        )
        end_date = datetime.datetime.now()  # noqa: DTZ005
        start_date = end_date - datetime.timedelta(days=20)

        for stock_symbol in stock_symbols.all():
            stock_market_candles = yf.download(
                tickers=stock_symbols, start=start_date, end=end_date, interval="1h"
            )
            if stock_market_candles is None:
                continue
            stock_metrics = await asyncio.to_thread(
                compute_market_pulse, stock_market_candles
            )
