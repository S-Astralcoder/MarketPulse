/**
 * MarketPulse — Single-Page Dashboard with Real-time Metrics Telemetry
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
 * Right-clicking any stock card reveals Track / Untrack options.
 * Alert counter strictly calculates from tracked stocks only.
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

  // Listen for right click on any stock card
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

    // Position menu with viewport edge safety
    const menuWidth = 160;
    const menuHeight = 44;
    const posX = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
    const posY = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

    contextMenu.style.left = `${posX}px`;
    contextMenu.style.top = `${posY}px`;
    contextMenu.style.display = 'block';
  });

  // Menu action button click
  contextTrackBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeContextMenuTicker) {
      toggleTrack(activeContextMenuTicker);
    }
    closeMenu();
  });

  // Close context menu on outside click, window resize, scroll, or Escape
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
 * 4. Alert Action (Only accounts for tracked/booked cards)
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
 * 6. Reusable Stock Card Instantiation Template Helper
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

  // 5. Expandable Drawer Details (Revealed on Card Hover)
  const expandedNameEl = clone.querySelector('.tpl-expanded-name');
  if (expandedNameEl) expandedNameEl.textContent = stock.name;

  const expandedCatEl = clone.querySelector('.tpl-expanded-category');
  if (expandedCatEl) expandedCatEl.textContent = `${stock.category} • ${stock.riskLevel.replace('_', ' ')}`;

  const priceEl = clone.querySelector('.tpl-price');
  if (priceEl) priceEl.textContent = stock.price;

  const changeEl = clone.querySelector('.tpl-price-change');
  if (changeEl) {
    changeEl.textContent = stock.priceChange;
    changeEl.classList.add(stock.isPricePositive ? 'positive' : 'negative');
  }

  const emaSpreadEl = clone.querySelector('.tpl-ema-spread');
  if (emaSpreadEl) emaSpreadEl.textContent = `EMA 20: ${stock.emaFast} / EMA 50: ${stock.ema}`;

  const natrEl = clone.querySelector('.tpl-natr-val');
  if (natrEl) natrEl.textContent = `NATR: ${stock.natr}% (${stock.atrRatio})`;

  const rsiRegimeEl = clone.querySelector('.tpl-rsi-status');
  if (rsiRegimeEl) rsiRegimeEl.textContent = `RSI ${stock.rsi} • ${stock.rsiStatus}`;

  const volatilityEl = clone.querySelector('.tpl-volatility-status');
  if (volatilityEl) volatilityEl.textContent = `Volatility: ${stock.volatilityStatus}`;

  return card;
};

/**
 * 7. Fetch Metrics Telemetry from Backend & Populate Dashboard
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

    const metricsList = Array.from(latestMap.values());

    // 1. Trending: BULLISH trend or ADX >= 25, sorted by ADX descending
    const trendingStocks = metricsList
      .filter((m) => m.trend_direction === 'BULLISH' || m.adx >= 25)
      .sort((a, b) => b.adx - a.adx);

    // 2. Top Stocks: High prominence bellwethers
    const TOP_SYMBOLS_PRIORITY = [
      'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'BHARTIARTL.NS',
      'ICICIBANK.NS', 'INFY.NS', 'SBIN.NS', 'ITC.NS', 'LT.NS',
      'KOTAKBANK.NS', 'AXISBANK.NS', 'SUNPHARMA.NS', 'MARUTI.NS'
    ];
    const topStocks = metricsList
      .filter((m) => TOP_SYMBOLS_PRIORITY.includes(m.symbol) || m.trend_direction === 'BULLISH')
      .sort((a, b) => {
        const idxA = TOP_SYMBOLS_PRIORITY.indexOf(a.symbol);
        const idxB = TOP_SYMBOLS_PRIORITY.indexOf(b.symbol);
        return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
      });

    // 3. Risky Stocks: risk_score >= 35 or top highest risk scores
    const highOrModerateRisk = metricsList.filter((m) => m.risk_score >= 35);
    const riskyStocks = highOrModerateRisk.length > 0 
      ? highOrModerateRisk.sort((a, b) => b.risk_score - a.risk_score)
      : [...metricsList].sort((a, b) => b.risk_score - a.risk_score).slice(0, 5);

    // 4. Safe Stocks: LOW risk (risk_score <= 20) sorted ascending by risk_score
    const safeStocks = metricsList
      .filter((m) => m.risk_level === 'LOW' || m.risk_score <= 20)
      .sort((a, b) => a.risk_score - b.risk_score);

    // 5. Average Stocks: Moderate or middle range risk (15 <= risk_score <= 55)
    const averageStocks = metricsList
      .filter((m) => m.risk_level === 'MODERATE' || (m.risk_score >= 15 && m.risk_score <= 55))
      .sort((a, b) => b.risk_score - a.risk_score);

    // Populate Category Sections
    populateSection('trending', trendingStocks);
    populateSection('top-stocks', topStocks);
    populateSection('risky-stocks', riskyStocks);
    populateSection('safe-stocks', safeStocks);
    populateSection('average-stocks', averageStocks);

    // Re-synchronize tracked/bookmarked stocks telemetry
    updateTrackedTelemetry();

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
      const card = renderStockCardFromTemplate({
        ticker: item.symbol,
        name: item.name,
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
        volatilityStatus: item.volatility_status
      });
      if (card) grid.appendChild(card);
    });
  }
}
