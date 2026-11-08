import asyncio
import datetime
from typing import Any

import numpy as np
import pandas as pd
import yfinance as yf
from rich import print
from sqlalchemy import select

from src.database import AsyncSessionFactory, Stock, StockMetrics
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

    # Flatten and normalize MultiIndex columns (e.g., from yfinance)
    if isinstance(data.columns, pd.MultiIndex):
        if "Price" in data.columns.names:
            data.columns = data.columns.get_level_values("Price")
        else:
            for level in range(data.columns.nlevels):
                values = {
                    str(v).capitalize() for v in data.columns.get_level_values(level)
                }
                if {"Close", "High", "Low"}.intersection(values):
                    data.columns = data.columns.get_level_values(level)
                    break
            else:
                data.columns = data.columns.get_level_values(0)

    data.columns = [str(col).strip().capitalize() for col in data.columns]

    close = data["Close"]
    high = data["High"]
    low = data["Low"]

    if isinstance(close, pd.DataFrame):
        close = close.squeeze()
    if isinstance(high, pd.DataFrame):
        high = high.squeeze()
    if isinstance(low, pd.DataFrame):
        low = low.squeeze()

    # ---------------------------------------------------------
    # 1. Trend: EMA 20 & EMA 50
    # ---------------------------------------------------------
    ema_20 = close.ewm(span=20, adjust=False).mean()  # pyright: ignore[reportAttributeAccessIssue]
    ema_50 = close.ewm(span=50, adjust=False).mean()  # pyright: ignore[reportAttributeAccessIssue] # pyright: ignore[reportAttributeAccessIssue]

    curr_close = float(close.iloc[-1])  # pyright: ignore[reportAttributeAccessIssue]
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
    prev_close = close.shift(1)  # pyright: ignore[reportAttributeAccessIssue]
    tr1 = high - low  # pyright: ignore[reportOperatorIssue]
    tr2 = (high - prev_close).abs()  # pyright: ignore[reportOperatorIssue]
    tr3 = (low - prev_close).abs()  # pyright: ignore[reportOperatorIssue]
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)  # pyright: ignore[reportArgumentType, reportCallIssue]

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
    up_move = high - high.shift(1)  # pyright: ignore[reportAttributeAccessIssue, reportOperatorIssue]
    down_move = low.shift(1) - low  # pyright: ignore[reportOperatorIssue, reportAttributeAccessIssue]

    plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)  # pyright: ignore[reportOperatorIssue]
    minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)  # pyright: ignore[reportOperatorIssue]

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

    # ---------------------------------------------------------
    # 4. Momentum: Wilder's RSI(14)
    # ---------------------------------------------------------
    delta = close.diff()  # pyright: ignore[reportAttributeAccessIssue]
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
    # 5. Composite Risk Scoring (Component-Decoupled Model)
    # ---------------------------------------------------------
    # 5.1 Trend Risk (0-100 pts, 40% weight)
    pct_below_50 = max(0.0, ((curr_ema_50 - curr_close) / curr_ema_50) * 100.0)
    p_dist_score = min(50.0, (pct_below_50 / 5.0) * 50.0)

    spread_deficit = max(0.0, -ema_spread_pct)
    spread_score = min(30.0, (spread_deficit / 3.0) * 30.0)

    pct_below_20 = max(0.0, ((curr_ema_20 - curr_close) / curr_ema_20) * 100.0)
    short_term_score = min(20.0, (pct_below_20 / 3.0) * 20.0)

    trend_risk = min(100.0, p_dist_score + spread_score + short_term_score)

    # 5.2 Volatility Risk (0-100 pts, 35% weight)
    atr_ratio_score = min(70.0, max(0.0, (atr_ratio - 0.9) / 1.1) * 70.0)
    rsi_dev = abs(curr_rsi - 50.0)
    rsi_score = min(30.0, max(0.0, (rsi_dev - 20.0) / 15.0) * 30.0)
    volatility_risk = min(100.0, atr_ratio_score + rsi_score)

    # 5.3 Regime / Chop Risk (0-100 pts, 25% weight)
    adx_val = 0.0 if np.isnan(curr_adx) else curr_adx
    adx_chop_score = min(70.0, max(0.0, (28.0 - adx_val) / 16.0) * 70.0)

    raw_plus_di = float(plus_di.iloc[-1])
    raw_minus_di = float(minus_di.iloc[-1])
    curr_plus_di = 0.0 if np.isnan(raw_plus_di) else raw_plus_di
    curr_minus_di = 0.0 if np.isnan(raw_minus_di) else raw_minus_di

    di_diff = abs(curr_plus_di - curr_minus_di)
    di_sum = curr_plus_di + curr_minus_di
    di_conflict = 1.0 - (di_diff / max(di_sum, 1e-6))
    conflict_score = min(30.0, max(0.0, di_conflict * 30.0))
    regime_risk = min(100.0, adx_chop_score + conflict_score)

    # Weighted composite score clamped to [0, 100]
    composite_risk = (0.40 * trend_risk) + (0.35 * volatility_risk) + (0.25 * regime_risk)
    risk_score = round(min(100.0, max(0.0, composite_risk)))

    if risk_score <= 34:
        risk_level = RiskLevel.LOW
    elif risk_score <= 65:
        risk_level = RiskLevel.MODERATE
    else:
        risk_level = RiskLevel.HIGH_RISK

    return {
        "price_change": round(curr_close - float(close.iloc[-2]), 2),  # pyright: ignore[reportAttributeAccessIssue]
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


async def fetch_and_calculate_market_metrics_and_update():
    async with AsyncSessionFactory() as session:
        stocks = await session.scalars(select(Stock).where(Stock.is_active == True))
        end_date = datetime.datetime.now()  # noqa: DTZ005
        start_date = end_date - datetime.timedelta(days=20)

        for stock in stocks.all():
            print(f"Fetching data from {stock.symbol}")
            stock_market_candles = yf.download(
                tickers=stock.symbol,
                start=start_date,
                end=end_date,
                interval="1h",
                multi_level_index=False,
            )
            if stock_market_candles is None or stock_market_candles.empty:
                continue
            stock_metrics = await asyncio.to_thread(
                compute_market_pulse, stock_market_candles
            )
            stock_metrics_row = StockMetrics(
                symbol=stock.symbol, name=stock.name, **stock_metrics
            )
            print("Computed results")
            print(stock_metrics_row)
            session.add(stock_metrics_row)
        await session.commit()
