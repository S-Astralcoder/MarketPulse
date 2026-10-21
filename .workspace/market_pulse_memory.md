# Market Pulse — Session Memory & Architecture Context

## 1. Project Overview & Philosophy
- **Name:** Market Pulse
- **Core Value Proposition:** A safety assessment engine for stocks and broad market conditions.
- **Explicit Boundary:** Market Pulse **does not** predict future prices. It provides an objective safety assessment and risk profile to help users determine whether engaging in trading or investing is prudent under current conditions.

---

## 2. Division of Labor & Development Strategy
- **User Ownership:** Backend architecture, database design, analytical algorithms, and complex business logic.
- **AI Ownership:** Frontend UI scaffolding, semantic HTML, modern CSS styling, design system implementation, and repetitive frontend/JS tasks under user direction.
- **Development Order:** Frontend-first approach while keeping the backend minimalistic and functional, followed by feature and pipeline backfilling.
- **Authorization Rule:** Never create, edit, or modify application files without explicit user instruction.

---

## 3. UI/UX Design System
- **Theme:** Modern, premium dark purple ("Purple-Dark" / Obsidian aesthetic).
  - **Base Canvas / Background:** `#0A0714` (deep obsidian purple-black).
  - **Surfaces / Cards:** `#130E26` (elevated purple-dark).
  - **Elevated / Hover:** `#1E173B`.
  - **Borders & Dividers:** `#2D2353` (thin 1px structural borders).
- **Typography:**
  - **Text Colors:** Smoky White (`#ECECF1`) for primary text to prevent eye strain; Muted Violet-Gray (`#9A96A8`) for secondary text/labels.
  - **Font Families (Google Fonts):**
    - UI / Headings: `Plus Jakarta Sans` (or `Inter`) for clean, geometric readability.
    - Numerical / Tickers / Metrics: `JetBrains Mono` for tabular, non-shifting numbers.
- **Signaling Accents (Semantic only):**
  - **Safe / Low Risk:** Electric Mint / Emerald (`#00E599` / `#10B981`).
  - **High Risk / Danger Zone:** Crimson / Coral (`#FF3366` / `#EF4444`).
  - **Neutral / Average:** Amber (`#F59E0B`) or Slate (`#64748B`).
- **Iconography:** Font Awesome (v6 Free via CDN).

---

## 4. Dashboard Architecture & Flow
```
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] MarketPulse   Dashboard                   [Search / Filter Bar]   [Profile (Avatar + Settings)] │
├────────────────────────────────────────────────────────────────────────┤
│ Hero Search & Global Filter Strip (Ticker search, Sector filters, "On Watch" toggle)                  │
├────────────────────────────────────────────────────────────────────────┤
│ 1. WATCHLIST ("ON WATCH") SECTION                                      │
│    Pinned cards saved by the user (3–4 columns max)                    │
├────────────────────────────────────────────────────────────────────────┤
│ 2. SAFE ZONE (LOW RISK / STABLE TRENDS)                                │
│    Glowing Emerald borders (#00E599), clear bullish/sideways trends    │
├────────────────────────────────────────────────────────────────────────┤
│ 3. HIGH RISK ZONE (RED / DANGER ZONE)                                  │
│    Glowing Crimson borders (#FF3366), high volatility / negative news  │
├────────────────────────────────────────────────────────────────────────┤
│ 4. NEUTRAL & AVERAGE MARKETS (WATCH & WAIT)                            │
│    Muted Slate/Amber borders, followed by a "Show More" / pagination   │
└────────────────────────────────────────────────────────────────────────┘
```

- **Grid Density Rules:** 3 cards minimum to 4 cards maximum per row on desktop viewports.
- **Card Glowing Effects:** 1px sharp border paired with subtle radial drop-glow (`box-shadow: 0 0 20px -5px rgba(...)`) keyed to the risk tier.

---

## 5. Card Face Anatomy
Each stock card in the grid features:
1. **Header Row:** Company Logo/Icon + Ticker (e.g. `NVDA`) + Full Company Name + "On Watch" star/bookmark toggle.
2. **Signal Row:** Risk Level Badge (`SAFE` / `MODERATE` / `HIGH RISK`) + Directional Bias (`BULLISH` / `SIDEWAYS` / `BEARISH`).
3. **Glance Metrics Strip:**
   - **Trend:** Momentum arrow + alignment indicator.
   - **Volatility:** Categorized ATR level (Low / Moderate / High).
   - **RSI:** Value and zone (e.g., `RSI 62 (Neutral)`).
4. **Sentiment Highlight:** 1-line news/regulatory summary with citation pill (e.g. *Bloomberg*, *Reuters*).

---

## 6. Detailed Inspection Model (Right-Side Drawer)
- **Mechanic:** Clicking a card triggers an active slide-in drawer on the right side (~30% screen width / min 380px).
- **Independent Scrolling:** Main stock grid and right inspector scroll independently to allow seamless side-by-side comparison without losing viewport position.
- **Drawer Contents:**
  - Full Ticker, Name, and Live Price.
  - Comprehensive Composite Safety Gauge (0–100 scale).
  - Deep-dive metrics: Moving averages (50/200 EMA), historical volatility vs current spike, RSI divergence.
  - Regulatory & Compliance alerts (SEC filings, antitrust scrutiny, policy impacts).
  - Complete News & Sentiment Feed with verifiable outbound citation links.

---

## 7. Current Repository Baseline
- **Runtime:** Python `>=3.12` managed with `uv`.
- **Framework:** FastAPI (`fastapi[standard]>=0.143.0`), Uvicorn (`uvicorn>=0.54.0`).
- **Database / Schema:** SQLAlchemy (`sqlalchemy>=2.1.4`), Pydantic (`pydantic>=2.13.5`).
- **Static Assets:** Mounted at root `/` pointing to `static/` (currently contains basic `index.html`).
- **Active Routers:**
  - Health check (`src/endpoint/health.py`)
  - User router (`src/endpoint/user.py`)
- **Entrypoint:** `main.py` -> `src.app:app`.

---

## 8. Next Session / Immediate Action Plan
- Scaffold initial semantic HTML, typography links, and Font Awesome in `static/index.html`.
- Build CSS design tokens and base styles for the Obsidian Purple palette, grid, and card glows.
- Implement the split-view layout with the sticky header and right-side inspector drawer.
