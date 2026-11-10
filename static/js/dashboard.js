/**
 * MarketPulse — Single-Page Dashboard with Real-time Metrics Telemetry
 * Interactive Full-Screen Modal with Visual Gauge & Hierarchical Data Display
 */

const STOCK_SECTORS = {
  'RELIANCE.NS': 'Energy',
  'TCS.NS': 'Information Technology',
  'HDFCBANK.NS': 'Financial Services',
  'BHARTIARTL.NS': 'Telecommunication',
  'ICICIBANK.NS': 'Financial Services',
  'INFY.NS': 'Information Technology',
  'SBIN.NS': 'Financial Services',
  'ITC.NS': 'Consumer Goods',
  'HINDUNILVR.NS': 'Consumer Goods',
  'LT.NS': 'Construction & Engineering',
  'BAJFINANCE.NS': 'Financial Services',
  'HCLTECH.NS': 'Information Technology',
  'KOTAKBANK.NS': 'Financial Services',
  'AXISBANK.NS': 'Financial Services',
  'SUNPHARMA.NS': 'Healthcare',
  'TATAMOTORS.NS': 'Automobile',
  'MARUTI.NS': 'Automobile',
  'NTPC.NS': 'Utilities',
  'ONGC.NS': 'Energy',
  'TITAN.NS': 'Consumer Durables',
  'SMCI': 'Technology'
};

// Global telemetry cache by ticker symbol
window.cachedStocksByTicker = new Map();
let activeModalTicker = null;

function formatCurrency(val, symbol) {
  if (val === undefined || val === null) return '--';
  if (symbol === 'SMCI' || !symbol.endsWith('.NS')) {
    return `$${val.toFixed(2)}`;
  }
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDelta(delta) {
  if (delta === undefined || delta === null) return '0.00';
  const prefix = delta >= 0 ? '+' : '';
  return `${prefix}${delta.toFixed(2)}`;
}

document.addEventListener('DOMContentLoaded', () => {
  initRefreshTimer();
  initAutoScrollNavigation();
  initRightClickTracking();
  initAlertsAction();
  initSearch();
  initStockCardClick();
  initModalEvents();
  fetchMarketMetrics();
});

/**
 * 1. Fixed Monospaced Refresh Timer Tick & Auto-Fetch
 */
function initRefreshTimer() {
  const timerEl = document.getElementById('refreshTimer');
  if (!timerEl) return;

  let secondsLeft = 42;

  setInterval(() => {
    secondsLeft--;
    if (secondsLeft < 0) {
      secondsLeft = 42;
      fetchMarketMetrics();
    }
    const formattedSec = secondsLeft < 10 ? `0${secondsLeft}` : `${secondsLeft}`;
    timerEl.textContent = `00:${formattedSec}`;
  }, 1000);
}

/**
 * 2. Auto-Scroll Navigation Sidebar
 */
function initAutoScrollNavigation() {
  const navBtns = document.querySelectorAll('#categoryNavList .nav-item-btn');
  const sections = document.querySelectorAll('.category-section');
  const viewport = document.getElementById('dashboardViewport');

  if (!viewport || sections.length === 0) return;

  // Click to smooth-scroll
  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Track active section on scroll
  const observerOptions = {
    root: viewport,
    rootMargin: '0px 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navBtns.forEach((btn) => {
          if (btn.getAttribute('data-target') === id) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));
}

/**
 * 3. Right-Click Context Menu & Tracking System
 */
const trackedTickers = new Set();
let activeContextMenuTicker = null;

function updateTrackedTelemetry() {
  const sidebarCountEl = document.getElementById('sidebarBookmarkedCount');
  const badgeCountEl = document.getElementById('bookmarkedCountBadge');
  const alertCountEl = document.getElementById('alertCount');
  const bookmarkedGrid = document.getElementById('bookmarkedCardsGrid');
  const bookmarkedEmpty = document.getElementById('bookmarkedEmptyState');

  const count = trackedTickers.size;
  if (sidebarCountEl) sidebarCountEl.textContent = count;
  if (badgeCountEl) badgeCountEl.textContent = `${count} ${count === 1 ? 'stock' : 'stocks'}`;

  // Calculate alerts strictly from tracked stocks
  let trackedRiskyCount = 0;
  trackedTickers.forEach((ticker) => {
    const origCard = document.querySelector(`.category-section:not(#bookmarked) .stock-card[data-ticker="${ticker}"]`);
    const risk = parseInt(origCard?.getAttribute('data-risk') || '0', 10);
    if (risk >= 60) {
      trackedRiskyCount++;
    }
  });

  if (alertCountEl) {
    alertCountEl.textContent = trackedRiskyCount;
  }

  // Populate bookmarked section
  if (bookmarkedGrid && bookmarkedEmpty) {
    if (count === 0) {
      bookmarkedEmpty.style.display = 'block';
      bookmarkedGrid.style.display = 'none';
      bookmarkedGrid.innerHTML = '';
    } else {
      bookmarkedEmpty.style.display = 'none';
      bookmarkedGrid.style.display = 'grid';
      bookmarkedGrid.innerHTML = '';

      trackedTickers.forEach((ticker) => {
        const origCard = document.querySelector(`.category-section:not(#bookmarked) .stock-card[data-ticker="${ticker}"]`);
        if (origCard) {
          const clone = origCard.cloneNode(true);
          bookmarkedGrid.appendChild(clone);
        }
      });
    }
  }

  // Sync `.is-tracked` class on all card instances
  document.querySelectorAll('.stock-card').forEach((card) => {
    const ticker = card.getAttribute('data-ticker');
    if (ticker) {
      card.classList.toggle('is-tracked', trackedTickers.has(ticker));
    }
  });

  // Sync modal track button if active
  if (activeModalTicker) {
    const modalTrackBtn = document.getElementById('modalTrackBtn');
    const modalTrackBtnText = document.getElementById('modalTrackBtnText');
    const isTracked = trackedTickers.has(activeModalTicker);
    if (modalTrackBtn && modalTrackBtnText) {
      modalTrackBtn.classList.toggle('untrack', isTracked);
      modalTrackBtnText.textContent = isTracked ? 'Untrack This Stock' : 'Track This Stock';
    }
  }
}

function toggleTrack(ticker) {
  if (trackedTickers.has(ticker)) {
    trackedTickers.delete(ticker);
  } else {
    trackedTickers.add(ticker);
  }
  updateTrackedTelemetry();
}

function initRightClickTracking() {
  const contextMenu = document.getElementById('cardContextMenu');
  const contextTrackBtn = document.getElementById('contextTrackBtn');
  const contextTrackText = document.getElementById('contextTrackText');

  if (!contextMenu || !contextTrackBtn) return;

  function closeMenu() {
    contextMenu.style.display = 'none';
    activeContextMenuTicker = null;
  }

  document.addEventListener('contextmenu', (e) => {
    const card = e.target.closest('.stock-card');
    if (!card) {
      closeMenu();
      return;
    }

    e.preventDefault();
    const ticker = card.getAttribute('data-ticker');
    if (!ticker) return;

    activeContextMenuTicker = ticker;
    const isTracked = trackedTickers.has(ticker);

    if (isTracked) {
      contextTrackText.textContent = 'Untrack Stock';
      contextTrackBtn.classList.add('untrack');
    } else {
      contextTrackText.textContent = 'Track Stock';
      contextTrackBtn.classList.remove('untrack');
    }

    const menuWidth = 160;
    const menuHeight = 44;
    const posX = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
    const posY = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

    contextMenu.style.left = `${posX}px`;
    contextMenu.style.top = `${posY}px`;
    contextMenu.style.display = 'block';
  });

  contextTrackBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeContextMenuTicker) {
      toggleTrack(activeContextMenuTicker);
    }
    closeMenu();
  });

  document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
      closeMenu();
    }
  });

  window.addEventListener('scroll', closeMenu, true);
  window.addEventListener('resize', closeMenu);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
    }
  });
}

/**
 * 4. Alert Action
 */
function initAlertsAction() {
  const alertsToggle = document.getElementById('alertsToggle');
  const bookmarkedSection = document.getElementById('bookmarked');
  const riskySection = document.getElementById('risky-stocks');

  if (!alertsToggle) return;

  alertsToggle.addEventListener('click', () => {
    if (trackedTickers.size > 0 && bookmarkedSection) {
      bookmarkedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (riskySection) {
      riskySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

/**
 * 5. Real-time Search Filter Across All Single-Page Sections
 */
function initSearch() {
  const searchInput = document.getElementById('stockSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    const allCards = document.querySelectorAll('.category-section:not(#bookmarked) .stock-card');
    const sections = document.querySelectorAll('.category-section:not(#bookmarked)');

    allCards.forEach((card) => {
      const ticker = (card.getAttribute('data-ticker') || '').toLowerCase();
      const name = (card.getAttribute('data-name') || '').toLowerCase();

      const matches = !query || ticker.includes(query) || name.includes(query);
      card.style.display = matches ? 'flex' : 'none';
    });

    sections.forEach((sec) => {
      const visibleCards = sec.querySelectorAll('.stock-card[style="display: flex;"]');
      let searchEmpty = sec.querySelector('.search-empty-msg');

      if (query && visibleCards.length === 0) {
        if (!searchEmpty) {
          searchEmpty = document.createElement('div');
          searchEmpty.className = 'empty-state visible search-empty-msg';
          searchEmpty.textContent = 'No matching stocks in this category.';
          sec.appendChild(searchEmpty);
        }
      } else if (searchEmpty) {
        searchEmpty.remove();
      }
    });
  });
}

/**
 * 6. Stock Card Click -> Full-Screen Modal Expansion
 */
function initStockCardClick() {
  document.addEventListener('click', (e) => {
    // Ignore clicks inside context menu or modal itself
    if (e.target.closest('#cardContextMenu') || e.target.closest('#stockDetailModal')) {
      return;
    }

    const card = e.target.closest('.stock-card');
    if (!card) return;

    const ticker = card.getAttribute('data-ticker');
    if (!ticker) return;

    if (window.cachedStocksByTicker && window.cachedStocksByTicker.has(ticker)) {
      openStockDetailModal(window.cachedStocksByTicker.get(ticker));
    }
  });
}

/**
 * 7. Full-Screen Modal Event Handlers
 */
function initModalEvents() {
  const modal = document.getElementById('stockDetailModal');
  const backdrop = document.getElementById('modalBackdrop');
  const closeBtn = document.getElementById('modalCloseBtn');
  const trackBtn = document.getElementById('modalTrackBtn');

  if (!modal) return;

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeStockDetailModal();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closeStockDetailModal();
    });
  }

  if (trackBtn) {
    trackBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeModalTicker) {
        toggleTrack(activeModalTicker);
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display !== 'none') {
      closeStockDetailModal();
    }
  });
}

function openStockDetailModal(stock) {
  const modal = document.getElementById('stockDetailModal');
  if (!modal) return;

  activeModalTicker = stock.ticker;

  // --- Left Column: Visual & Executive Overview ---
  document.getElementById('modalLogo').textContent = stock.logo || stock.ticker.slice(0, 2);
  document.getElementById('modalTicker').textContent = stock.ticker;
  document.getElementById('modalSector').textContent = stock.category;
  document.getElementById('modalName').textContent = stock.name;

  // Price & Delta
  document.getElementById('modalPrice').textContent = stock.price;
  const deltaEl = document.getElementById('modalDelta');
  deltaEl.textContent = stock.priceChange;
  deltaEl.className = `modal-delta-badge tabular-num ${stock.isPricePositive ? 'positive' : 'negative'}`;

  // Market Status Pill
  const statusDot = document.getElementById('modalStatusDot');
  if (stock.isElevatedStatus || stock.risk >= 60) {
    statusDot.classList.add('elevated');
    document.getElementById('modalStatusPillText').textContent = 'Volatile / Elevated Risk';
  } else {
    statusDot.classList.remove('elevated');
    document.getElementById('modalStatusPillText').textContent = 'Steady Regime';
  }

  // Risk Gauge Radial SVG
  document.getElementById('modalGaugeScore').textContent = stock.risk;
  const gaugeFill = document.getElementById('modalGaugeFill');
  const riskBadge = document.getElementById('modalRiskBadge');

  // Arc length is pi * 80 ~= 251.327
  const circumference = 251.327;
  const strokeOffset = circumference * (1 - Math.min(100, Math.max(0, stock.risk)) / 100);
  gaugeFill.style.strokeDashoffset = strokeOffset;

  if (stock.risk >= 60) {
    gaugeFill.style.stroke = 'var(--signal-high)';
    riskBadge.className = 'gauge-badge high';
    riskBadge.textContent = 'HIGH RISK';
  } else if (stock.risk >= 35) {
    gaugeFill.style.stroke = 'var(--signal-moderate)';
    riskBadge.className = 'gauge-badge moderate';
    riskBadge.textContent = 'MODERATE RISK';
  } else {
    gaugeFill.style.stroke = 'var(--signal-steady)';
    riskBadge.className = 'gauge-badge low';
    riskBadge.textContent = 'LOW RISK';
  }

  // Factor Weight Subcomponent Bars
  // Trend Risk (40% weight)
  const trendScore = stock.trend_direction === 'BEARISH' ? 75 : (stock.trend_direction === 'NEUTRAL' ? 35 : 15);
  document.getElementById('modalTrendRiskVal').textContent = `${trendScore}/100`;
  document.getElementById('modalTrendRiskBar').style.width = `${trendScore}%`;

  // Volatility Risk (35% weight)
  const volScore = stock.volatility_status === 'ELEVATED' ? 82 : (stock.volatility_status === 'NORMAL' ? 28 : 12);
  document.getElementById('modalVolRiskVal').textContent = `${volScore}/100`;
  document.getElementById('modalVolRiskBar').style.width = `${volScore}%`;

  // Regime / Chop Risk (25% weight)
  const rawAdx = stock.adx || 25;
  const regimeScore = Math.round(Math.max(10, Math.min(95, (30 - rawAdx) * 3 + 40)));
  document.getElementById('modalRegimeRiskVal').textContent = `${regimeScore}/100`;
  document.getElementById('modalRegimeRiskBar').style.width = `${regimeScore}%`;

  // Track Button State
  const trackBtn = document.getElementById('modalTrackBtn');
  const trackBtnText = document.getElementById('modalTrackBtnText');
  const isTracked = trackedTickers.has(stock.ticker);
  trackBtn.classList.toggle('untrack', isTracked);
  trackBtnText.textContent = isTracked ? 'Untrack This Stock' : 'Track This Stock';

  // --- Right Column: Hierarchical Analytics ---
  // Panel 01: Trend Architecture
  document.getElementById('modalEmaFast').textContent = stock.emaFast;
  document.getElementById('modalEmaSlow').textContent = stock.ema;
  const trendBadge = document.getElementById('modalTrendDirectionBadge');
  trendBadge.textContent = stock.trend_direction;
  trendBadge.className = `hierarchy-badge ${stock.trend_direction.toLowerCase()}`;
  document.getElementById('modalEmaSpreadDesc').textContent = 
    `Fast EMA 20 (${stock.emaFast}) is trading ${stock.emaFast >= stock.ema ? 'above' : 'below'} Slow EMA 50 (${stock.ema}) with ${stock.trend_direction.toLowerCase()} bias.`;

  // Panel 02: Volatility & Dispersion
  document.getElementById('modalAtr').textContent = stock.atr;
  document.getElementById('modalNatr').textContent = `${stock.natr}%`;
  const volBadge = document.getElementById('modalVolStatusBadge');
  volBadge.textContent = stock.volatility_status;
  volBadge.className = `hierarchy-badge ${stock.volatility_status.toLowerCase()}`;
  document.getElementById('modalAtrRatioDesc').textContent = 
    `Current true range is ${stock.atrRatio} relative to 50-period SMA baseline.`;

  // Panel 03: Momentum Oscillator
  document.getElementById('modalRsiVal').textContent = stock.rsi;
  const rsiBadge = document.getElementById('modalRsiMovementBadge');
  rsiBadge.textContent = stock.rsiStatus;
  rsiBadge.className = `hierarchy-badge ${stock.rsiStatus.toLowerCase()}`;
  document.getElementById('modalRsiBand').textContent = 
    stock.rsiStatus === 'OVERBOUGHT' ? 'Overbought (>= 70 Zone)' : (stock.rsiStatus === 'OVERSOLD' ? 'Oversold (<= 30 Zone)' : 'Balanced Zone (30 - 70)');
  document.getElementById('modalRsiPointer').style.left = `${Math.min(100, Math.max(0, parseFloat(stock.rsi)))}%`;

  // Panel 04: Regime & Directional Strength
  document.getElementById('modalAdx').textContent = stock.adx;
  const adxBadge = document.getElementById('modalAdxStrengthBadge');
  const isStrongTrend = (stock.adx || 0) >= 25;
  adxBadge.innerHTML = isStrongTrend ? 'STRONG&nbsp;TREND' : 'RANGEBOUND';
  adxBadge.className = `hierarchy-badge ${isStrongTrend ? 'strong' : 'moderate'}`;
  
  const adxCharEl = document.getElementById('modalAdxChar');
  if (adxCharEl) {
    adxCharEl.textContent = isStrongTrend ? 'Trending Market' : 'Consolidation / Range';
  }
  
  document.getElementById('modalAdxDesc').textContent = 
    isStrongTrend 
      ? "Wilder's ADX indicates persistent directional trend velocity." 
      : "Wilder's ADX indicates low directional conviction / consolidation.";

  // Metadata Footer
  document.getElementById('modalUpdatedTime').innerHTML = `<span class="status-dot-pulse"></span><span>Snapshot: ${stock.updatedAt}</span>`;
  document.getElementById('modalUuid').textContent = stock.uuid;

  // Open Modal
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeStockDetailModal() {
  const modal = document.getElementById('stockDetailModal');
  if (!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  activeModalTicker = null;
}

/**
 * 8. Reusable Stock Card Instantiation Template Helper
 */
window.renderStockCardFromTemplate = function (stock) {
  const template = document.getElementById('stock-card-template');
  if (!template) return null;

  const clone = template.content.cloneNode(true);
  const card = clone.querySelector('.stock-card');

  card.setAttribute('data-ticker', stock.ticker);
  card.setAttribute('data-name', stock.name);
  card.setAttribute('data-risk', String(stock.risk));

  // Card Header Meta
  clone.querySelector('.tpl-logo').textContent = stock.logo || stock.ticker.slice(0, 2);
  clone.querySelector('.tpl-name').textContent = stock.name;
  clone.querySelector('.tpl-ticker').textContent = stock.ticker;

  // Risk Badge
  const riskBadge = clone.querySelector('.tpl-risk-badge');
  const riskText = clone.querySelector('.tpl-risk-text');
  riskText.textContent = `Risk ${stock.risk}/100`;

  if (stock.risk >= 60) {
    riskBadge.classList.add('high');
  } else if (stock.risk >= 35) {
    riskBadge.classList.add('moderate');
  } else {
    riskBadge.classList.add('low');
  }

  // Market Status Row
  const statusDot = clone.querySelector('.tpl-status-dot');
  if (stock.isElevatedStatus || stock.risk >= 60) {
    statusDot.classList.add('elevated');
  }
  clone.querySelector('.tpl-status-text').textContent = stock.statusText;

  // 1. RSI (14)
  clone.querySelector('.tpl-rsi-val').textContent = stock.rsi;
  const rsiDeltaEl = clone.querySelector('.tpl-rsi-delta');
  rsiDeltaEl.textContent = stock.rsiStatus;
  if (stock.rsiStatus === 'OVERBOUGHT') {
    rsiDeltaEl.classList.add('negative');
  } else if (stock.rsiStatus === 'OVERSOLD') {
    rsiDeltaEl.classList.add('positive');
  } else {
    rsiDeltaEl.classList.add('neutral');
  }

  // 2. ATR
  clone.querySelector('.tpl-atr-val').textContent = stock.atr;
  const atrDeltaEl = clone.querySelector('.tpl-atr-delta');
  atrDeltaEl.textContent = stock.atrRatio;
  if (parseFloat(stock.atrRatio) > 1.3) {
    atrDeltaEl.classList.add('negative');
  } else if (parseFloat(stock.atrRatio) < 0.8) {
    atrDeltaEl.classList.add('positive');
  } else {
    atrDeltaEl.classList.add('neutral');
  }

  // 3. EMA (50)
  clone.querySelector('.tpl-ema-val').textContent = stock.ema;
  const emaDeltaEl = clone.querySelector('.tpl-ema-delta');
  emaDeltaEl.textContent = stock.emaState;
  emaDeltaEl.classList.add(stock.emaState.toLowerCase());

  // 4. Strength (ADX)
  clone.querySelector('.tpl-adx-val').textContent = stock.strength;
  const adxDeltaEl = clone.querySelector('.tpl-adx-delta');
  adxDeltaEl.textContent = stock.strengthState;
  adxDeltaEl.classList.add(stock.strengthState.toLowerCase());

  return card;
};

/**
 * 9. Fetch Metrics Telemetry from Backend & Populate Dashboard
 */
async function fetchMarketMetrics() {
  try {
    const res = await fetch('/metric/');
    if (!res.ok) {
      console.warn(`Metrics fetch error: HTTP ${res.status}`);
      return;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.info('No metrics data returned from endpoint.');
      return;
    }

    // Deduplicate: take the latest entry per symbol by created_at
    const latestMap = new Map();
    data.forEach((item) => {
      const existing = latestMap.get(item.symbol);
      if (!existing || new Date(item.created_at) > new Date(existing.created_at)) {
        latestMap.set(item.symbol, item);
      }
    });

    // Normalize and cache each unique stock record
    window.cachedStocksByTicker.clear();
    const metricsList = [];

    latestMap.forEach((item) => {
      const dateObj = new Date(item.created_at);
      const timeStr = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        : 'Recent';

      const normalized = {
        ticker: item.symbol,
        name: item.name,
        uuid: item.uuid || '--',
        risk: item.risk_score,
        riskLevel: item.risk_level,
        logo: item.symbol.replace('.NS', '').slice(0, 2),
        statusText: `${item.trend_direction.charAt(0) + item.trend_direction.slice(1).toLowerCase()} trend • ${item.volatility_status.toLowerCase()} volatility`,
        isElevatedStatus: item.risk_score >= 60 || item.volatility_status === 'ELEVATED',
        rsi: item.rsi.toFixed(1),
        rsiStatus: item.movement_status === 'BALENCED' ? 'BALANCED' : item.movement_status,
        atr: item.atr.toFixed(2),
        atrRatio: `${item.atr_ratio.toFixed(2)}x`,
        natr: item.natr.toFixed(2),
        ema: item.ema_slow.toFixed(0),
        emaFast: item.ema_fast.toFixed(0),
        emaState: item.trend_direction.charAt(0) + item.trend_direction.slice(1).toLowerCase(),
        strength: `${item.adx}%`,
        strengthState: item.adx >= 25 ? 'Strong' : 'Moderate',
        price: formatCurrency(item.close_price, item.symbol),
        priceChange: formatDelta(item.price_change),
        isPricePositive: item.price_change >= 0,
        category: STOCK_SECTORS[item.symbol] || 'Equities',
        volatility_status: item.volatility_status,
        trend_direction: item.trend_direction,
        adx: item.adx,
        updatedAt: `${timeStr} IST`
      };

      window.cachedStocksByTicker.set(item.symbol, normalized);
      metricsList.push(normalized);
    });

    // 1. Trending: BULLISH trend or ADX >= 25, sorted by ADX descending
    const trendingStocks = metricsList
      .filter((m) => m.trend_direction === 'BULLISH' || m.adx >= 25)
      .sort((a, b) => b.adx - a.adx);

    // 2. Top Stocks: High prominence bellwethers
    const TOP_SYMBOLS_PRIORITY = [
      'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'BHARTIARTL.NS',
      'ICICIBANK.NS', 'INFY.NS', 'SBIN.NS', 'ITC.NS', 'LT.NS',
      'BAJFINANCE.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 'SUNPHARMA.NS', 'MARUTI.NS'
    ];
    const topStocks = metricsList
      .filter((m) => TOP_SYMBOLS_PRIORITY.includes(m.ticker) || m.trend_direction === 'BULLISH')
      .sort((a, b) => {
        const idxA = TOP_SYMBOLS_PRIORITY.indexOf(a.ticker);
        const idxB = TOP_SYMBOLS_PRIORITY.indexOf(b.ticker);
        return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
      });

    // 3. Risky Stocks: risk >= 35 or top highest risk scores
    const highOrModerateRisk = metricsList.filter((m) => m.risk >= 35);
    const riskyStocks = highOrModerateRisk.length > 0 
      ? highOrModerateRisk.sort((a, b) => b.risk - a.risk)
      : [...metricsList].sort((a, b) => b.risk - a.risk).slice(0, 5);

    // 4. Safe Stocks: LOW risk (risk <= 20) sorted ascending by risk
    const safeStocks = metricsList
      .filter((m) => m.riskLevel === 'LOW' || m.risk <= 20)
      .sort((a, b) => a.risk - b.risk);

    // 5. Average Stocks: Moderate or middle range risk (15 <= risk <= 55)
    const averageStocks = metricsList
      .filter((m) => m.riskLevel === 'MODERATE' || (m.risk >= 15 && m.risk <= 55))
      .sort((a, b) => b.risk - a.risk);

    // Populate Category Sections
    populateSection('trending', trendingStocks);
    populateSection('top-stocks', topStocks);
    populateSection('risky-stocks', riskyStocks);
    populateSection('safe-stocks', safeStocks);
    populateSection('average-stocks', averageStocks);

    // Re-synchronize tracked/bookmarked stocks telemetry
    updateTrackedTelemetry();

    // If modal is currently open, refresh its data in place
    if (activeModalTicker && window.cachedStocksByTicker.has(activeModalTicker)) {
      openStockDetailModal(window.cachedStocksByTicker.get(activeModalTicker));
    }

  } catch (err) {
    console.error('Error fetching market metrics:', err);
  }
}

function populateSection(sectionId, stocks) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const grid = section.querySelector('.cards-grid');
  const emptyState = section.querySelector('.empty-state');
  const badge = section.querySelector('.section-badge');
  const navCountEl = document.querySelector(`#categoryNavList .nav-item-btn[data-target="${sectionId}"] .nav-count`);

  const count = stocks.length;
  if (badge) badge.textContent = `${count} ${count === 1 ? 'stock' : 'stocks'}`;
  if (navCountEl) navCountEl.textContent = count;

  if (!grid) return;
  grid.innerHTML = '';

  if (count === 0) {
    if (emptyState) emptyState.style.display = 'block';
    grid.style.display = 'none';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    grid.style.display = 'grid';

    stocks.forEach((item) => {
      const card = renderStockCardFromTemplate(item);
      if (card) grid.appendChild(card);
    });
  }
}
