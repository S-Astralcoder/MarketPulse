/**
 * MarketPulse — Category Navigation, Telemetry Filtering & Card Utilities
 */

document.addEventListener('DOMContentLoaded', () => {
  initRefreshTimer();
  initCategoryNavigation();
  initAlertsToggle();
  initSearch();
});

/**
 * 1. Fixed Monospaced Refresh Timer
 * Loops 42 -> 0 without causing horizontal layout shifts.
 */
function initRefreshTimer() {
  const timerEl = document.getElementById('refreshTimer');
  if (!timerEl) return;

  let secondsLeft = 42;

  setInterval(() => {
    secondsLeft--;
    if (secondsLeft < 0) {
      secondsLeft = 42;
    }
    const formattedSec = secondsLeft < 10 ? `0${secondsLeft}` : `${secondsLeft}`;
    timerEl.textContent = `00:${formattedSec}`;
  }, 1000);
}

/**
 * 2. Category Navigation Panel
 * Categories: Bookmarked, Trending, Top Stocks, Risky Stocks, Safe Stocks, Average Stocks
 */
let currentCategory = 'trending';
let isAlertsActive = false;
let currentSearchQuery = '';

const CATEGORY_TITLES = {
  bookmarked: 'Bookmarked Stocks',
  trending: 'Trending Stocks',
  top: 'Top Stocks',
  risky: 'Risky Stocks',
  safe: 'Safe Stocks',
  average: 'Average Stocks'
};

function filterDisplay() {
  const cardContainer = document.getElementById('stocksCardContainer');
  const emptyState = document.getElementById('emptyStateBox');
  const headingEl = document.getElementById('currentCategoryHeading');
  const countBadgeEl = document.getElementById('currentCountBadge');

  if (!cardContainer) return;

  const cards = cardContainer.querySelectorAll('.stock-card');
  let visibleCount = 0;

  if (isAlertsActive) {
    if (headingEl) headingEl.textContent = 'Risky Alerts';
  } else {
    if (headingEl) headingEl.textContent = CATEGORY_TITLES[currentCategory] || 'Stocks';
  }

  cards.forEach((card) => {
    const ticker = (card.getAttribute('data-ticker') || '').toLowerCase();
    const name = (card.querySelector('.stock-name')?.textContent || '').toLowerCase();
    const categories = (card.getAttribute('data-categories') || '').split(',');
    const risk = parseInt(card.getAttribute('data-risk') || '0', 10);

    const matchesSearch = !currentSearchQuery || ticker.includes(currentSearchQuery) || name.includes(currentSearchQuery);

    let matchesCategory = false;
    if (isAlertsActive) {
      matchesCategory = risk >= 60;
    } else {
      matchesCategory = categories.includes(currentCategory);
    }

    if (matchesSearch && matchesCategory) {
      card.style.display = 'flex';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  if (countBadgeEl) {
    countBadgeEl.textContent = `${visibleCount} stocks`;
  }

  if (emptyState) {
    if (visibleCount === 0) {
      emptyState.style.display = 'block';
      if (currentCategory === 'bookmarked' && !isAlertsActive) {
        emptyState.textContent = 'No cards marked yet. Tag or bookmark cards to view them here.';
      } else {
        emptyState.textContent = 'No stocks match the selected filter or search query.';
      }
    } else {
      emptyState.style.display = 'none';
    }
  }
}

function initCategoryNavigation() {
  const navBtns = document.querySelectorAll('#categoryNavList .nav-item-btn');
  const alertsToggle = document.getElementById('alertsToggle');

  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Deactivate alerts mode when clicking a category
      isAlertsActive = false;
      if (alertsToggle) alertsToggle.classList.remove('active');

      navBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      currentCategory = btn.getAttribute('data-category') || 'trending';
      filterDisplay();
    });
  });
}

/**
 * 3. Alerts Toggle Action
 * When clicked, highlights all red-flagged/risky cards (risk >= 60).
 */
function initAlertsToggle() {
  const alertsToggle = document.getElementById('alertsToggle');
  const navBtns = document.querySelectorAll('#categoryNavList .nav-item-btn');

  if (!alertsToggle) return;

  alertsToggle.addEventListener('click', () => {
    isAlertsActive = !isAlertsActive;
    alertsToggle.classList.toggle('active', isAlertsActive);

    if (isAlertsActive) {
      navBtns.forEach((b) => b.classList.remove('active'));
    } else {
      // Restore active category button
      const activeBtn = document.querySelector(`#categoryNavList .nav-item-btn[data-category="${currentCategory}"]`);
      if (activeBtn) activeBtn.classList.add('active');
    }

    filterDisplay();
  });
}

/**
 * 4. Search Filter
 */
function initSearch() {
  const searchInput = document.getElementById('stockSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.trim().toLowerCase();
    filterDisplay();
  });
}

/**
 * 5. Template Instantiation Helper for Dynamic Cards
 */
window.renderStockCardFromTemplate = function (stock) {
  const template = document.getElementById('stock-card-template');
  if (!template) return null;

  const clone = template.content.cloneNode(true);
  const card = clone.querySelector('.stock-card');

  card.setAttribute('data-ticker', stock.ticker);
  card.setAttribute('data-categories', (stock.categories || []).join(','));
  card.setAttribute('data-risk', String(stock.risk));

  clone.querySelector('.tpl-logo').textContent = stock.logo || stock.ticker.slice(0, 2);
  clone.querySelector('.tpl-name').textContent = stock.name;
  clone.querySelector('.tpl-popover').textContent = stock.name;
  clone.querySelector('.tpl-ticker').textContent = stock.ticker;

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

  const statusDot = clone.querySelector('.tpl-status-dot');
  if (stock.isElevatedStatus || stock.risk >= 60) {
    statusDot.classList.add('elevated');
  }
  clone.querySelector('.tpl-status-text').textContent = stock.statusText;

  // RSI
  clone.querySelector('.tpl-rsi-val').textContent = stock.rsi;
  const rsiDeltaEl = clone.querySelector('.tpl-rsi-delta');
  rsiDeltaEl.textContent = stock.rsiDelta;
  rsiDeltaEl.classList.add(stock.rsiDelta.startsWith('+') ? 'positive' : 'negative');

  // ATR
  clone.querySelector('.tpl-atr-val').textContent = stock.atr;
  const atrDeltaEl = clone.querySelector('.tpl-atr-delta');
  atrDeltaEl.textContent = stock.atrDelta;
  atrDeltaEl.classList.add(stock.atrDelta.startsWith('+') ? 'negative' : 'positive');

  // EMA
  clone.querySelector('.tpl-ema-val').textContent = stock.ema;
  const emaDeltaEl = clone.querySelector('.tpl-ema-delta');
  emaDeltaEl.textContent = stock.emaState;
  emaDeltaEl.classList.add(stock.emaState.toLowerCase());

  // Strength (ADX)
  clone.querySelector('.tpl-adx-val').textContent = stock.strength;
  const adxDeltaEl = clone.querySelector('.tpl-adx-delta');
  adxDeltaEl.textContent = stock.strengthState;
  adxDeltaEl.classList.add(stock.strengthState.toLowerCase());

  return card;
};
