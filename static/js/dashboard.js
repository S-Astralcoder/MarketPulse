/**
 * MarketPulse — Single-Page Dashboard with Right-Click Context Menu Tracking & Alerts
 */

document.addEventListener('DOMContentLoaded', () => {
  initRefreshTimer();
  initAutoScrollNavigation();
  initRightClickTracking();
  initAlertsAction();
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
  if (badgeCountEl) badgeCountEl.textContent = `${count} stocks`;

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
 * 6. Reusable Template Instantiation Helper
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
