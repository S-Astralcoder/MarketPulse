# Market Pulse — Session Memory & Architecture Context

## 1. Project Overview & Philosophy
- **Name:** Market Pulse
- **Core Value Proposition:** A safety assessment engine for stocks and broad market conditions.
- **Explicit Boundary:** Market Pulse **does not** predict future prices. It provides an objective safety assessment and risk profile to help users determine whether engaging in trading or investing is prudent under current conditions.

---

## 2. Analytical Pipelines
The system evaluates market safety across three primary pillars:

1. **Trend Analysis:**
   - Evaluates momentum and structural price action.
   - Identifies whether the underlying asset is trending or consolidating.

2. **Volatility Assessment:**
   - Measures risk exposure, price swings, and tail-risk probability.
   - Quantifies whether conditions are stable or erratic.

3. **News & Sentiment Analysis:**
   - **Macro Sentiment:** Broader market sentiment and macroeconomic indicators.
   - **Regulatory & Compliance Tracking:** Changes in laws, SEC/regulatory filings, tariffs, and monetary policies.
   - **Company-Specific Focus:** Micro-level news, earnings reports, executive developments, and company sentiment.

---

## 3. User Deliverables & Outputs
For every analyzed market or stock, the platform delivers:
- **Risk Factor:** Quantified risk level (e.g., Low / Moderate / High / Extreme) and safety assurance score.
- **Market Bias:** Categorical directional bias — **Bullish**, **Bearish**, or **Sideways**.
- **Source Attribution & Citations:** Every advisory insight, sentiment score, or data signal must cite its origin (news articles, official filings, exchange data).

---

## 4. Current Repository Baseline
- **Runtime:** Python `>=3.12` managed with `uv`.
- **Framework:** FastAPI (`fastapi[standard]>=0.143.0`), Uvicorn (`uvicorn>=0.54.0`).
- **Database / Schema:** SQLAlchemy (`sqlalchemy>=2.1.4`), Pydantic (`pydantic>=2.13.5`).
- **Static Assets:** Mounted at root `/` pointing to `static/`.
- **Active Routers:**
  - Health check (`src/endpoint/health.py`)
  - User router (`src/endpoint/user.py`)
- **Entrypoint:** `main.py` -> `src.app:app`.

---

## 5. Roadmap & Immediate Next Steps
1. **Pipeline Specifications:**
   - Select and configure financial data APIs for technical/trend data.
   - Select news aggregation & sentiment analysis providers/APIs (scraping vs. structured feeds).
   - Establish regulatory change monitors (e.g., SEC EDGAR, central bank feeds).
2. **Scoring Engine:**
   - Define the aggregation algorithm that synthesizes trend, volatility, and sentiment into the composite **Risk Factor** and **Market Bias**.
3. **Data Pipeline Integration:**
   - Build backend service modules under `src/services/` or `src/pipeline/`.
   - Implement source tracking / citation schema in API responses.
4. **Session Handoff Protocol:**
   - When launching a subsequent session, inspect this file first to resume from the latest roadmap state.
