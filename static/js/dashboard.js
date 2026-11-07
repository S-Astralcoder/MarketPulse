/**
 * MarketPulse — Single-Page Sequential Dashboard with Auto-Scroll Navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  initRefreshTimer();
  initAutoScrollNavigation();
  initAlertsJump();
  initSearch();
});

/**
 * 1. Fixed Monospaced Refresh Timer Tick
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
 * 2. Auto-Scroll Navigation Sidebar
 * Clicking any category button smoothly scrolls the single-page viewport to that section.
 * An IntersectionObserver continuously tracks which section is in view and updates the active state.
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
 * 3. Alerts Jump Action
 * Clicking "Alerts" smoothly scrolls directly to the Risky Stocks section.
 */
function initAlertsJump() {
  const alertsToggle = document.getElementById('alertsToggle');
  const riskySection = document.getElementById('risky-stocks');

  if (!alertsToggle || !riskySection) return;

  alertsToggle.addEventListener('click', () => {
    riskySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/**
 * 4. Real-time Search Filter Across All Single-Page Sections
 */
function initSearch() {
  const searchInput = document.getElementById('stockSearchInput');
  const allCards = document.querySelectorAll('.stock-card');
  const sections = document.querySelectorAll('.category-section');

  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();

    allCards.forEach((card) => {
      const ticker = (card.getAttribute('data-ticker') || '').toLowerCase();
      const name = (card.getAttribute('data-name') || '').toLowerCase();

      const matches = !query || ticker.includes(query) || name.includes(query);
      card.style.display = matches ? 'flex' : 'none';
    });

    // Check each section if all cards are hidden
    sections.forEach((sec) => {
      if (sec.id === 'bookmarked') return;
      const visibleCards = sec.querySelectorAll('.stock-card[style="display: flex;"]');
      const emptyState = sec.querySelector('.empty-state');

      if (query && visibleCards.length === 0) {
        if (!emptyState) {
          const tempEmpty = document.createElement('div');
          tempEmpty.className = 'empty-state visible search-empty-msg';
          tempEmpty.textContent = 'No matching stocks in this category.';
          sec.appendChild(tempEmpty);
        }
      } else {
        const tempEmpty = sec.querySelector('.search-empty-msg');
        if (tempEmpty) tempEmpty.remove();
      }
    });
  });
}

/**
 * 5. Reusable Template Instantiation
 */
window.renderStockCardFromTemplate = function (stock) {
  const template = document.getElementById('stock-card-template');
  if (!template) return null;

  const clone = template.content.cloneNode(true);
  const card = clone.querySelector('.stock-card');

  card.setAttribute('data-ticker', stock.ticker);
  card.setAttribute('data-name', stock.name);
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
