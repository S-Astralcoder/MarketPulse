/**
 * MarketPulse — Dashboard Interactions & Template Utilities
 * Provides search filtering, risk sorting, live timer tick, and reusable card template instantiation.
 */

document.addEventListener('DOMContentLoaded', () => {
  initRefreshTimer();
  initSearchAndFilter();
  initRiskySortToggle();
});

/**
 * 1. Monospaced Refresh Timer Tick
 * Ticks from 42 seconds downwards to 0, formatting without causing layout shifts.
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
 * 2. Search & Category Filter Navigation
 */
function initSearchAndFilter() {
  const searchInput = document.getElementById('stockSearchInput');
  const filterPills = document.querySelectorAll('#categoryFilterBar .filter-pill');
  const cardContainer = document.getElementById('stocksCardContainer');
  const emptyState = document.getElementById('emptyStateBox');

  if (!cardContainer) return;

  let currentCategory = 'all';
  let currentSearch = '';

  function applyFilters() {
    const cards = cardContainer.querySelectorAll('.stock-card');
    let visibleCount = 0;

    cards.forEach((card) => {
      const ticker = (card.getAttribute('data-ticker') || '').toLowerCase();
      const name = (card.querySelector('.stock-name')?.textContent || '').toLowerCase();
      const category = (card.getAttribute('data-category') || '').toLowerCase();
      const risk = parseInt(card.getAttribute('data-risk') || '0', 10);

      // Search matching
      const matchesSearch = !currentSearch || ticker.includes(currentSearch) || name.includes(currentSearch);

      // Category matching
      let matchesCategory = true;
      if (currentCategory === 'tech') {
        matchesCategory = category === 'tech';
      } else if (currentCategory === 'index') {
        matchesCategory = category === 'index';
      } else if (currentCategory === 'high-risk') {
        matchesCategory = risk >= 60;
      }

      if (matchesSearch && matchesCategory) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  // Bind Search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      applyFilters();
    });
  }

  // Bind Category pills
  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      filterPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.getAttribute('data-filter') || 'all';
      applyFilters();
    });
  });
}

/**
 * 3. Sort Risky Cards First Toggle
 */
function initRiskySortToggle() {
  const toggleBtn = document.getElementById('riskyFilterToggle');
  const cardContainer = document.getElementById('stocksCardContainer');
  if (!toggleBtn || !cardContainer) return;

  let isRiskyFirst = false;

  toggleBtn.addEventListener('click', () => {
    isRiskyFirst = !isRiskyFirst;
    toggleBtn.classList.toggle('active', isRiskyFirst);

    const cards = Array.from(cardContainer.querySelectorAll('.stock-card'));

    if (isRiskyFirst) {
      cards.sort((a, b) => {
        const riskA = parseInt(a.getAttribute('data-risk') || '0', 10);
        const riskB = parseInt(b.getAttribute('data-risk') || '0', 10);
        return riskB - riskA;
      });
    } else {
      // Revert to initial order (by ticker attribute sequence)
      const defaultOrder = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'AMD', 'SPY'];
      cards.sort((a, b) => {
        const tickerA = a.getAttribute('data-ticker') || '';
        const tickerB = b.getAttribute('data-ticker') || '';
        return defaultOrder.indexOf(tickerA) - defaultOrder.indexOf(tickerB);
      });
    }

    cards.forEach((card) => cardContainer.appendChild(card));
  });
}

/**
 * 4. Helper to Clone and Render Card via <template id="stock-card-template">
 * Exposed on window for future backend integrations.
 *
 * @param {Object} stock
 * @param {string} stock.ticker e.g. "NVDA"
 * @param {string} stock.name e.g. "NVIDIA Corp"
 * @param {string} stock.logo e.g. "NV"
 * @param {number} stock.risk e.g. 78
 * @param {string} stock.category e.g. "tech"
 * @param {string} stock.statusText e.g. "Market open • Elevated volatility"
 * @param {boolean} stock.isElevatedStatus
 * @param {string} stock.rsi e.g. "74.2"
 * @param {string} stock.rsiDelta e.g. "+3.1"
 * @param {string} stock.atr e.g. "14.80"
 * @param {string} stock.atrDelta e.g. "+0.8"
 * @param {string} stock.ema e.g. "612.4"
 * @param {string} stock.emaState e.g. "Bullish"
 * @param {string} stock.strength e.g. "84%"
 * @param {string} stock.strengthState e.g. "Strong"
 */
window.renderStockCardFromTemplate = function (stock) {
  const template = document.getElementById('stock-card-template');
  if (!template) return null;

  const clone = template.content.cloneNode(true);
  const card = clone.querySelector('.stock-card');

  card.setAttribute('data-ticker', stock.ticker);
  card.setAttribute('data-category', stock.category || 'general');
  card.setAttribute('data-risk', String(stock.risk));

  clone.querySelector('.tpl-logo').textContent = stock.logo || stock.ticker.slice(0, 2);
  clone.querySelector('.tpl-name').textContent = stock.name;
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
