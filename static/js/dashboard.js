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

/**
 * Auth Route Guard: Verify session token with backend /user/access on entry
 */
async function enforceAuthRouteGuard() {
  const auth = window.AuthService;
  const token = auth ? auth.getStoredToken() : null;

  if (!token) {
    window.location.replace('/index.html');
    return false;
  }

  const isValid = await auth.verifyAccess(token);
  if (!isValid) {
    if (auth) auth.clearStoredToken();
    window.location.replace('/index.html');
    return false;
  }

  return true;
}

/**
 * Top-Level Account Profile Modal Controllers
 */
function openProfileModal() {
  const profileModal = document.getElementById('profileModal');
  if (!profileModal) return;
  const trackedCountEl = document.getElementById('profileTrackedCount');
  if (trackedCountEl) trackedCountEl.textContent = trackedTickers ? trackedTickers.size : 0;
  const alertCountEl = document.getElementById('profileAlertCount');
  if (alertCountEl) alertCountEl.textContent = window.currentHighRiskTracked ? window.currentHighRiskTracked.length : 0;
  profileModal.style.display = 'flex';
  profileModal.classList.add('is-open');
  profileModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
  const profileModal = document.getElementById('profileModal');
  if (!profileModal) return;
  profileModal.classList.remove('is-open');
  profileModal.setAttribute('aria-hidden', 'true');
  profileModal.style.display = 'none';
  document.body.style.overflow = '';
}

/**
 * User Profile & Logout Controller
 */
function initUserProfile() {
  const auth = window.AuthService;
  if (!auth) return;

  const headerEmailEl = document.getElementById('headerUserEmail');
  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRole');
  const avatarEl = document.getElementById('userAvatarText');

  const profileUsernameEl = document.getElementById('profileUsername');
  const profileEmailEl = document.getElementById('profileEmail');
  const profileAvatarTextLargeEl = document.getElementById('profileAvatarTextLarge');
  const profileProviderBadgeEl = document.getElementById('profileProviderBadge');

  // 1. Immediately populate from local JWT token without blocking
  let email = 'trader@domain.com';
  let username = 'Analyst';
  let isGoogle = false;

  const token = auth.getStoredToken();
  const payload = auth.decodeJwt(token);
  if (payload && payload.email) {
    email = payload.email;
    username = email.split('@')[0];
  }

  function renderUserUI(uName, uEmail, isGgl) {
    if (headerEmailEl) headerEmailEl.textContent = uEmail;
    if (nameEl) nameEl.textContent = uName;
    if (roleEl) roleEl.textContent = uEmail;

    if (profileUsernameEl) profileUsernameEl.textContent = uName;
    if (profileEmailEl) profileEmailEl.textContent = uEmail;
    if (profileProviderBadgeEl) {
      profileProviderBadgeEl.textContent = isGgl ? 'Google OAuth Account' : 'MarketPulse Terminal ID';
    }

    const parts = uName.trim().split(/\s+/);
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : uName.slice(0, 2).toUpperCase();

    if (avatarEl) avatarEl.textContent = initials;
    if (profileAvatarTextLargeEl) profileAvatarTextLargeEl.textContent = initials;
  }

  renderUserUI(username, email, isGoogle);

  // 2. Asynchronously fetch full user info to refresh profile details
  auth.getUserInfo().then((user) => {
    if (user && user.email) {
      email = user.email;
      username = user.username || user.name || email.split('@')[0];
      isGoogle = !!user.picture_url;
      renderUserUI(username, email, isGoogle);
    }
  }).catch(() => {});
}

/**
 * Initial load of user-tracked stocks from user's POST /track/tracked_list
 */
async function loadTrackedMetrics() {
  const auth = window.AuthService;
  if (!auth) return;

  // 1. Fetch tracked symbols from user's /track/tracked_list endpoint
  const symbols = await auth.getTrackedSymbols();
  if (Array.isArray(symbols) && symbols.length > 0) {
    symbols.forEach((sym) => {
      if (sym) trackedTickers.add(sym);
    });
  }

  // 2. Also augment with POST /metric/tracked if available
  if (trackedTickers.size === 0) {
    const trackedList = await auth.getTrackedMetrics();
    if (Array.isArray(trackedList) && trackedList.length > 0) {
      trackedList.forEach((item) => {
        if (item && item.symbol) {
          trackedTickers.add(item.symbol);
        }
      });
    }
  }

  updateTrackedTelemetry();
}

/**
 * Review / Grid View Mode Toggle Controller
 */
function applyViewMode(reviewMode) {
  const grids = document.querySelectorAll('.cards-grid');
  grids.forEach((grid) => {
    grid.classList.toggle('review-mode', reviewMode);
  });

  const viewModeBtn = document.getElementById('viewModeBtn');
  const viewModeIcon = document.getElementById('viewModeIcon');
  if (viewModeBtn) {
    viewModeBtn.classList.toggle('active', reviewMode);
    viewModeBtn.title = reviewMode ? 'Review Mode Active (Click for Grid View)' : 'Toggle Grid / Review Mode';
  }

  if (viewModeIcon) {
    if (reviewMode) {
      viewModeIcon.innerHTML = `
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
      `;
    } else {
      viewModeIcon.innerHTML = `
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      `;
    }
  }
}

function initViewModeAction() {
  const savedMode = localStorage.getItem('mp_dashboard_view_mode') || 'grid';
  applyViewMode(savedMode === 'review');
}

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize local UI components and handlers immediately so clicks respond with zero delay
  initRefreshTimer();
  initAutoScrollNavigation();
  initRightClickTracking();
  initAlertsAction();
  initViewModeAction();
  initSearch();
  initStockCardClick();
  initModalEvents();
  initUserProfile();

  // 2. Auth Route Guard check
  const authenticated = await enforceAuthRouteGuard();
  if (!authenticated) return;

  // 3. Load backend data once verified
  await loadTrackedMetrics();
  fetchMarketMetrics();
});

/**
 * 1. Clock-Synchronized IST Hourly Refresh Countdown & Auto-Fetch Trigger
 * Synchronizes with Indian Standard Time (UTC+05:30) top-of-the-hour (:00:00 IST).
 */
function initRefreshTimer() {
  const timerEl = document.getElementById('refreshTimer');
  if (!timerEl) return;

  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const HOUR_MS = 60 * 60 * 1000;

  let lastExecutedHourKey = Math.floor((Date.now() + IST_OFFSET_MS) / HOUR_MS);

  function updateTimer() {
    const now = Date.now();
    const currentHourKey = Math.floor((now + IST_OFFSET_MS) / HOUR_MS);

    // If an IST top-of-the-hour boundary was crossed, refresh market telemetry
    if (currentHourKey > lastExecutedHourKey) {
      lastExecutedHourKey = currentHourKey;
      fetchMarketMetrics();
    }

    const msInHour = (now + IST_OFFSET_MS) % HOUR_MS;
    const msRemaining = HOUR_MS - msInHour;
    const totalSec = Math.floor(msRemaining / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;

    const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
    const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
    timerEl.textContent = `${formattedMins}:${formattedSecs}`;
  }

  // Initial immediate tick, then repeat every second
  updateTimer();
  setInterval(updateTimer, 1000);
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

  // Calculate alerts strictly from tracked stocks with Risk > 40
  let trackedRiskyCount = 0;
  const highRiskTrackedList = [];

  trackedTickers.forEach((ticker) => {
    const origCard = document.querySelector(`.category-section:not(#bookmarked) .stock-card[data-ticker="${ticker}"]`);
    const cardRisk = parseInt(origCard?.getAttribute('data-risk') || '0', 10);
    const cached = window.cachedStocksByTicker ? window.cachedStocksByTicker.get(ticker) : null;
    const risk = cached?.risk_score !== undefined ? Number(cached.risk_score) : (cached?.risk !== undefined ? Number(cached.risk) : cardRisk);
    if (risk > 40) {
      trackedRiskyCount++;
      highRiskTrackedList.push({
        ticker,
        name: cached?.name || origCard?.querySelector('.stock-name')?.textContent || ticker,
        risk,
        riskLevel: cached?.risk_level || cached?.riskLevel || (risk >= 70 ? 'HIGH_RISK' : 'ELEVATED'),
        price: cached?.price ? (typeof cached.price === 'string' ? cached.price : `₹${cached.price.toLocaleString('en-IN')}`) : (origCard?.querySelector('.card-price')?.textContent || '--')
      });
    }
  });

  window.currentHighRiskTracked = highRiskTrackedList;

  if (alertCountEl) {
    alertCountEl.textContent = trackedRiskyCount;
  }

  const headerAlertCountEl = document.getElementById('headerAlertCount');
  if (headerAlertCountEl) {
    headerAlertCountEl.textContent = trackedRiskyCount;
    headerAlertCountEl.style.display = trackedRiskyCount > 0 ? 'inline-block' : 'none';
  }

  const profileAlertCountEl = document.getElementById('profileAlertCount');
  if (profileAlertCountEl) {
    profileAlertCountEl.textContent = trackedRiskyCount;
  }

  const profileTrackedCountEl = document.getElementById('profileTrackedCount');
  if (profileTrackedCountEl) {
    profileTrackedCountEl.textContent = count;
  }

  // Populate bookmarked section
  if (bookmarkedGrid && bookmarkedEmpty) {
    if (count === 0) {
      bookmarkedEmpty.style.display = 'block';
      bookmarkedGrid.style.display = 'none';
      bookmarkedGrid.innerHTML = '';
    } else {
      bookmarkedEmpty.style.display = 'none';
      bookmarkedGrid.style.display = '';
      bookmarkedGrid.innerHTML = '';
      const isReview = localStorage.getItem('mp_dashboard_view_mode') === 'review';
      bookmarkedGrid.classList.toggle('review-mode', isReview);

      trackedTickers.forEach((ticker) => {
        const cached = window.cachedStocksByTicker ? window.cachedStocksByTicker.get(ticker) : null;
        if (cached && window.renderStockCardFromTemplate) {
          const card = window.renderStockCardFromTemplate(cached);
          if (card) {
            card.classList.add('is-tracked');
            bookmarkedGrid.appendChild(card);
            return;
          }
        }
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

async function toggleTrack(ticker) {
  const auth = window.AuthService;
  const isCurrentlyTracked = trackedTickers.has(ticker);

  if (isCurrentlyTracked) {
    // Optimistic local update
    trackedTickers.delete(ticker);
    updateTrackedTelemetry();

    if (auth) {
      const res = await auth.untrackStock(ticker);
      if (!res.success) {
        console.warn('Backend untrack failed:', res.error);
        // Rollback state if server rejects
        trackedTickers.add(ticker);
        updateTrackedTelemetry();
      }
    }
  } else {
    // Optimistic local update
    trackedTickers.add(ticker);
    updateTrackedTelemetry();

    if (auth) {
      const res = await auth.trackStock(ticker);
      if (!res.success) {
        console.warn('Backend track failed:', res.error);
        // Rollback state if server rejects
        trackedTickers.delete(ticker);
        updateTrackedTelemetry();
      }
    }
  }
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
 * 4. Alert Action (Tracked Risk Alerts with Risk > 40)
 */
function renderAlertsModalContent() {
  const alertsModalBody = document.getElementById('alertsModalBody');
  if (!alertsModalBody) return;

  updateTrackedTelemetry();
  const items = window.currentHighRiskTracked || [];
  alertsModalBody.innerHTML = '';

  if (items.length === 0) {
    if (trackedTickers.size === 0) {
      alertsModalBody.innerHTML = `
        <div class="alert-empty-box">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <p><strong>No Tracked Symbols</strong><br>Bookmark stocks to monitor real-time risk alerts.</p>
        </div>
      `;
    } else {
      alertsModalBody.innerHTML = `
        <div class="alert-empty-box">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <p><strong style="color: #10B981;">Telemetry Nominal</strong><br>All ${trackedTickers.size} tracked stocks have risk ≤ 40.</p>
        </div>
      `;
    }
  } else {
    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'alert-item-card';
      row.innerHTML = `
        <div class="alert-item-info">
          <span class="alert-item-symbol">${item.ticker} <span class="badge-tag tag-risky">RISK &gt; 40</span></span>
          <span class="alert-item-name">${item.name} · ${item.price}</span>
        </div>
        <div class="alert-item-badge">
          Risk: ${item.risk}/100
        </div>
      `;
      row.addEventListener('click', () => {
        closeAlertsModal();
        const card = document.querySelector(`.stock-card[data-ticker="${item.ticker}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('flash-attention');
          setTimeout(() => card.classList.remove('flash-attention'), 2000);
        }
      });
      alertsModalBody.appendChild(row);
    });
  }
}

function openAlertsModal() {
  const alertsModal = document.getElementById('alertsModal');
  if (!alertsModal) return;
  renderAlertsModalContent();
  alertsModal.style.display = 'flex';
  alertsModal.classList.add('is-open');
  alertsModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeAlertsModal() {
  const alertsModal = document.getElementById('alertsModal');
  if (!alertsModal) return;
  alertsModal.classList.remove('is-open');
  alertsModal.setAttribute('aria-hidden', 'true');
  alertsModal.style.display = 'none';
  document.body.style.overflow = '';
}

function initAlertsAction() {
  const alertsToggle = document.getElementById('alertsToggle');
  const headerNotificationsBtn = document.getElementById('headerNotificationsBtn');
  const alertsModal = document.getElementById('alertsModal');
  const alertsModalCloseBtn = document.getElementById('alertsModalCloseBtn');

  if (alertsToggle) alertsToggle.addEventListener('click', openAlertsModal);
  if (headerNotificationsBtn) headerNotificationsBtn.addEventListener('click', openAlertsModal);
  if (alertsModalCloseBtn) alertsModalCloseBtn.addEventListener('click', closeAlertsModal);
  if (alertsModal) {
    alertsModal.addEventListener('click', (e) => {
      if (e.target === alertsModal) closeAlertsModal();
    });
  }
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
    if (e.key === 'Escape') {
      if (modal && modal.style.display !== 'none') {
        closeStockDetailModal();
      }
      closeProfileModal();
      closeAlertsModal();
    }
  });
}

// Global resilient document-level click delegation
document.addEventListener('click', (e) => {
  // 1. Account Profile Button
  if (e.target.closest('#accountBtn')) {
    e.preventDefault();
    openProfileModal();
    return;
  }

  // 2. Profile Modal Close Button
  if (e.target.closest('#profileModalCloseBtn')) {
    e.preventDefault();
    closeProfileModal();
    return;
  }

  // 3. Profile Modal Backdrop click
  const profModal = document.getElementById('profileModal');
  if (profModal && e.target === profModal) {
    closeProfileModal();
    return;
  }

  // 4. Alerts Triggers (Sidebar pill or Header notifications bell)
  if (e.target.closest('#alertsToggle') || e.target.closest('#headerNotificationsBtn')) {
    e.preventDefault();
    openAlertsModal();
    return;
  }

  // 5. Alerts Modal Close Button
  if (e.target.closest('#alertsModalCloseBtn')) {
    e.preventDefault();
    closeAlertsModal();
    return;
  }

  // 6. Alerts Modal Backdrop click
  const alModal = document.getElementById('alertsModal');
  if (alModal && e.target === alModal) {
    closeAlertsModal();
    return;
  }

  // 7. View Mode Grid / Review Toggle Button
  if (e.target.closest('#viewModeBtn')) {
    e.preventDefault();
    const currentMode = localStorage.getItem('mp_dashboard_view_mode') || 'grid';
    const nextMode = currentMode === 'review' ? 'grid' : 'review';
    applyViewMode(nextMode === 'review');
    localStorage.setItem('mp_dashboard_view_mode', nextMode);
    return;
  }

  // 8. Sign Out Triggers (Sidebar logout button or profile modal signout button)
  if (e.target.closest('#logoutBtn') || e.target.closest('#profileSignOutBtn')) {
    e.preventDefault();
    if (window.AuthService) window.AuthService.logout();
    return;
  }
});

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
    const auth = window.AuthService;
    const token = auth ? auth.getStoredToken() : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/metric/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        access_token: token,
        token_type: 'Bearer'
      })
    });
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
    grid.style.display = '';
    const isReview = localStorage.getItem('mp_dashboard_view_mode') === 'review';
    grid.classList.toggle('review-mode', isReview);

    stocks.forEach((item) => {
      const card = renderStockCardFromTemplate(item);
      if (card) grid.appendChild(card);
    });
  }
}
