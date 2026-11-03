# MarketPulse — Landing Page Frontend Plan

> **Source Reference:** Figma File `X55YOrS30rHEM1BucGFtka` (Page `1:10`, Frame `15:9` "index.html")  
> **Status:** Revised to reflect user directives (Obsidian & Purple, soft/matte aesthetic, zero gradient slop)  

---

## 1. Product Mission & Editorial Stance

- **Core Mission:** Provide market participants with clear, objective market intelligence—unvarnished signals, systemic warnings, and structural context.
- **Strict Boundary ("We Show, We Don't Force"):** 
  - **No price predictions.**
  - **No trade calls or buy/sell recommendations.** 
  - **No manufactured urgency or FOMO.**
  - The platform provides clear telemetry so the user can make informed, independent decisions.

---

## 2. Visual Direction: "Soft Obsidian & Purple"

### What Went Wrong Previously (The "AI Slop" Trap)
Loud multi-stop linear gradients, radioactive neon glows, excessive glassmorphic backdrop blurs, and busy decorative shapes that made the interface look like a generic crypto-casino template.

### The Corrected Design Rules
1. **Flat & Soft Surfaces:** Use deep, matte obsidian bases with flat elevated card surfaces. No aggressive gradients.
2. **Restrained Color Budget:** 
   - 90% matte obsidian and muted slate/violet-gray.
   - 10% purposeful accents (soft violet for primary interactions; muted mint and muted rose strictly for signals and warnings).
3. **Subtle Depth:** Single-layer soft drop shadows (`rgba(0, 0, 0, 0.35)`) and 1px crisp structural borders (`#261E38`). No luminous glowing borders.
4. **Authentic Imagery:** Purpose-crafted UI diagrams, vector signal indicators, and clean graphic assets instead of psychedelic AI blobs.

### CSS Design Tokens
```css
:root {
  /* Canvas & Base Surfaces */
  --bg-canvas: #0B0813;           /* Deep matte obsidian */
  --bg-surface: #140F22;          /* Elevated surface */
  --bg-surface-subtle: #19132B;   /* Interactive / hover card */
  --bg-surface-inset: #0F0B1A;    /* Wells, badges, code blocks */

  /* Borders & Dividers */
  --border-subtle: #241D38;       /* Standard 1px divider */
  --border-strong: #332A4D;       /* Focused / active element */

  /* Typography */
  --text-primary: #EDEBF2;        /* High-contrast smoky white */
  --text-secondary: #9B94AA;      /* Neutral secondary slate */
  --text-muted: #655E75;          /* Disclaimers & footnotes */

  /* Soft Accents (Strictly non-neon) */
  --accent-purple: #7E57C2;       /* Soft regal violet (primary action) */
  --accent-purple-hover: #9068D4;
  --signal-warning: #E06C75;      /* Soft rose/crimson (risk / elevated volatility) */
  --signal-steady: #52B788;       /* Muted sage/mint (stable / clean trend) */
  --signal-neutral: #E5A93C;      /* Soft ochre/amber (caution / consolidation) */

  /* Shadows & Radius */
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.3);
  --shadow-subtle: 0 2px 8px rgba(0, 0, 0, 0.2);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}
```

---

## 3. Section-by-Section Layout Architecture (Frame `15:9`)

### 3.1 Header (`data-node-id="15:10"`, Height: 79px)
- **Status:** **Active Build**
- **Left (`15:11`, 278×55px):**
  - Minimal wordmark: `MarketPulse` in `Plus Jakarta Sans` with an understated status dot (`--signal-steady`).
- **Right (`15:12`, 616×33px):**
  - Navigation links: `Why MarketPulse`, `Signals`, `Mission`, `Pricing`.
  - Actions: Clean text link `Sign In` + solid soft-purple button `Launch App`.
- **Divider (`15:13`):** 1px solid `--border-subtle`. No loud gradient separator.

---

### 3.2 Hero Section (`data-node-id="15:14"`, Height: 746px)
- **Status:** **Active Build**
- **Headline (`15:16`, 832×58px):**
  - *Copy:* **"Clear Market Signals. Zero Price Predictions."**
  - *Styling:* Solid `--text-primary`, no text-clip gradients, clean letter spacing.
- **Subheadlines (`15:17` & `15:18`, 969×32px & 791×32px):**
  - *Line 1:* "Understand volatility expansion, liquidity shifts, and structural warnings across the market."
  - *Line 2:* "We provide the telemetry so you can make your own decisions. We never tell you what to trade."
- **Dual Buttons (`15:19` & `15:20`, 383×67px & 384×67px):**
  - **Left (Primary):** `Explore Market Telemetry` — Solid soft-purple background (`--accent-purple`), crisp text.
  - **Right (Secondary):** `How We Assess Risk` — Outlined button with `--border-strong`, subtle hover lift.

---

### 3.3 "Why You Need It?" (`data-node-id="15:21"`, Height: 638px)
- **Status:** **Active Build**
- **Headline (`15:23`, 631×53px):**
  - *Title:* "Built to Show What's Actually Happening"
- **Left Column: 8 Telemetry & Signal Rows (`15:24` to `15:31`, 583×35px each):**
  1. **Volatility Regimes:** Flags abnormal ATR spikes and squeeze setups without emotional bias.
  2. **Structural Warnings:** Surfaces momentum divergences across critical timeframes.
  3. **No Advisory Interference:** Zero buy/sell calls, no "targets", no speculative cheerleading.
  4. **Categorized Market States:** Clear classification of conditions: Stable, Transitioning, High Turbulence.
  5. **Regulatory & Filing Radar:** Automatic tracking of institutional disclosures, insider filings, and SEC events.
  6. **Contextual Signal Inspector:** Inspect underlying math behind every metric on demand.
  7. **Verified Context Over Noise:** Summarized events tied to verifiable disclosures, not social chatter.
  8. **Uncluttered Delivery:** Information organized for speed and analytical clarity.
- **Right Column: Visual Graphic Container (`15:22`, 664×523px):**
  - Clean, soft comparison asset: Side-by-side illustration of noisy market hype vs. quiet, structured signal clarity.

---

### 3.4 "UI Display" Showcase (`data-node-id="15:42"`, Height: 751px)
- **Status:** **Blank / Reserved Space** (as instructed)
- **Implementation:**
  - Semantic section container with reserved height / aspect ratio.
  - Understated placeholder frame: Clean dashed or subtle 1px border with a soft note: *"Dashboard Telemetry Engine — In Active Development"*.
  - Leaves the exact layout footprint from Figma (`15:43`) without dummy slop filling the space.

---

### 3.5 "Mission Page" (`data-node-id="15:32"`, Height: 541px)
- **Status:** **Active Build**
- **Heading (`15:33`, 570×40px):**
  - *Title:* "Our Stance on the Market"
- **Central Statement Card (`15:34`, 1084×439px):**
  - Soft matte card (`--bg-surface`) with `--border-subtle` border and generous interior padding.
  - *Manifesto Copy:*
    > "Most trading tools try to sell certainty in an uncertain environment. They promise magical price targets, predictive algorithms, and effortless gains.
    >
    > We believe that's fundamentally misleading.
    > 
    > MarketPulse was built on a different principle: markets cannot be predicted, but risks can be quantified. We show you structural volatility, divergence warnings, and data-backed market states so you have the situational awareness needed to act with discipline. 
    > 
    > We give you the facts. The decisions are entirely yours."

---

### 3.6 "Pricing" (`data-node-id="15:35"`, Height: 863px)
- **Status:** **Mock Cards / Reserved Space** (as instructed)
- **Section Heading (`15:37`, 636×51px):**
  - *Title:* "Plans & Access"
- **3 Mock Pricing Cards (`15:38`, `15:39`, `15:40`, ~430×552px):**
  - Minimal, clean card skeletons (Tier names: Free Observer, Active Trader, API / Data).
  - Outlined placeholder tiers with simple bullet points and a "Coming Soon / In Development" action indicator.
- **Bottom Banner (`15:41`, 1256×38px):**
  - Reserved note bar.

---

### 3.7 "End" / Disclaimer & Footer (`data-node-id="15:44"`, Height: 324px)
- **Status:** **Active Build**
- **Disclaimer Box (`15:45`, 1313×226px):**
  - Subtle inset card (`--bg-surface-inset`) with muted typography.
  - Transparent legal boundary stating that MarketPulse is purely an informational telemetry tool, not an investment advisor, and does not solicit securities trades.
- **Footer Bar (`15:46`, 1063×42px):**
  - Clean typographic footer: Brand name, copyright, and utility links (`Terms`, `Privacy`, `Telemetry Status`).

---

## 4. Next Implementation Step

1. Scaffold semantic HTML structure in `static/index.html` reflecting these 7 sections.
2. Create `static/css/style.css` with the soft obsidian/purple variables and clean typography (`Plus Jakarta Sans`).
3. Leave Section 4 (`UI display`) cleanly reserved and Section 6 (`Pricing`) with minimal mock cards.
