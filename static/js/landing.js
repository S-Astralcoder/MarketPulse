/**
 * MarketPulse — Fluid Section Snap & Navigation Controller
 * Provides natural, unblocked scrolling with native CSS proximity snapping,
 * keyboard controls, and active section tracking.
 */

(function () {
  'use strict';

  // --- Global Modal Handlers (guaranteed immediate availability) ---
  window.openAuthModal = function (tab) {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (window.switchAuthTab) window.switchAuthTab(tab || 'signin');
  };

  window.closeAuthModal = function () {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  window.switchAuthTab = function (tab) {
    const tabSignIn = document.getElementById('tabSignIn');
    const tabSignUp = document.getElementById('tabSignUp');
    const formSignIn = document.getElementById('formSignIn');
    const formSignUp = document.getElementById('formSignUp');

    if (tab === 'signup') {
      if (tabSignUp) {
        tabSignUp.classList.add('is-active');
        tabSignUp.setAttribute('aria-selected', 'true');
      }
      if (tabSignIn) {
        tabSignIn.classList.remove('is-active');
        tabSignIn.setAttribute('aria-selected', 'false');
      }
      if (formSignUp) formSignUp.classList.add('is-active');
      if (formSignIn) formSignIn.classList.remove('is-active');
      const input = formSignUp ? formSignUp.querySelector('input') : null;
      if (input) setTimeout(() => input.focus(), 60);
    } else {
      if (tabSignIn) {
        tabSignIn.classList.add('is-active');
        tabSignIn.setAttribute('aria-selected', 'true');
      }
      if (tabSignUp) {
        tabSignUp.classList.remove('is-active');
        tabSignUp.setAttribute('aria-selected', 'false');
      }
      if (formSignIn) formSignIn.classList.add('is-active');
      if (formSignUp) formSignUp.classList.remove('is-active');
      const input = formSignIn ? formSignIn.querySelector('input') : null;
      if (input) setTimeout(() => input.focus(), 60);
    }
  };

  // Immediate global click delegation for any auth trigger
  document.addEventListener('click', function (e) {
    const trigger = e.target.closest('#openSignInBtn, #openSignUpBtn, [data-open-modal], a[href="#signin"], a[href="#signup"]');
    if (trigger) {
      e.preventDefault();
      const isSignUp = trigger.id === 'openSignUpBtn' ||
                       trigger.getAttribute('href') === '#signup' ||
                       trigger.getAttribute('data-open-modal') === 'signup';
      window.openAuthModal(isSignUp ? 'signup' : 'signin');
    }
  });

  // Self-booting lifecycle
  function boot() {
    initLandingNavigation();
    initAuthModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  function initLandingNavigation() {
    const snapSections = Array.from(document.querySelectorAll('.snap-section'));
    if (!snapSections.length) return;

    const navLinks = Array.from(document.querySelectorAll('.nav-link'));
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.offsetHeight : 72;

    let currentIndex = 0;

    // --- 1. Center-Point Scroll Function for programmatic navigation ---
    function scrollToSection(index) {
      if (index < 0 || index >= snapSections.length) return;

      currentIndex = index;
      const target = snapSections[index];

      // Center section within available viewport excluding header
      const targetRect = target.getBoundingClientRect();
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      const sectionHeight = target.offsetHeight;

      const availableHeight = viewportHeight - headerHeight;
      const verticalOffset = Math.max(0, (availableHeight - sectionHeight) / 2);
      const destination = currentScrollTop + targetRect.top - headerHeight - verticalOffset;

      window.scrollTo({
        top: Math.max(0, destination),
        behavior: 'smooth'
      });

      snapSections.forEach((sec, i) => {
        sec.classList.toggle('is-active', i === index);
      });

      updateNavLinks(target.id);
    }

    // --- 2. Update Nav Links ---
    function updateNavLinks(activeId) {
      if (!activeId) return;
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === `#${activeId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }

    // --- 3. Keyboard Navigation (Arrow Keys / Page Keys) ---
    window.addEventListener('keydown', (e) => {
      // Do not interfere if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (['ArrowDown', 'PageDown'].includes(e.code)) {
        if (currentIndex < snapSections.length - 1) {
          e.preventDefault();
          scrollToSection(currentIndex + 1);
        }
      } else if (['ArrowUp', 'PageUp'].includes(e.code)) {
        if (currentIndex > 0) {
          e.preventDefault();
          scrollToSection(currentIndex - 1);
        }
      } else if (e.code === 'Home') {
        e.preventDefault();
        scrollToSection(0);
      }
    });

    // --- 4. Smooth Anchor Clicks ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        if (this.id === 'openSignInBtn' || this.id === 'openSignUpBtn') return;
        const targetId = this.getAttribute('href').slice(1);
        const targetSecIndex = snapSections.findIndex(sec => sec.id === targetId);

        if (targetSecIndex !== -1) {
          e.preventDefault();
          scrollToSection(targetSecIndex);
        } else {
          // Non-snap section anchor (e.g. #end or others)
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    // --- 5. Intersection Observer for Smooth Section State ---
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = snapSections.indexOf(entry.target);
          if (index !== -1) {
            currentIndex = index;
            snapSections.forEach((sec, i) => sec.classList.toggle('is-active', i === index));
            updateNavLinks(entry.target.id);
          }
        }
      });
    }, {
      rootMargin: `-${headerHeight}px 0px -35% 0px`,
      threshold: 0.25
    });

    snapSections.forEach(sec => observer.observe(sec));

    // Ensure hero is active initially
    if (snapSections[0]) {
      snapSections[0].classList.add('is-active');
    }
  }

  // --- Authentication Modal Controller (Figma 29:12) ---
  function initAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;

    const openSignInBtn = document.getElementById('openSignInBtn');
    const openSignUpBtn = document.getElementById('openSignUpBtn');
    const closeBtn = document.getElementById('closeAuthModalBtn');
    const tabSignIn = document.getElementById('tabSignIn');
    const tabSignUp = document.getElementById('tabSignUp');
    const formSignIn = document.getElementById('formSignIn');
    const formSignUp = document.getElementById('formSignUp');
    const switchToSignUp = document.getElementById('switchToSignUp');
    const switchToSignIn = document.getElementById('switchToSignIn');

    function openModal(tab) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      switchTab(tab || 'signin');
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    function switchTab(tab) {
      if (tab === 'signin') {
        tabSignIn.classList.add('is-active');
        tabSignIn.setAttribute('aria-selected', 'true');
        tabSignUp.classList.remove('is-active');
        tabSignUp.setAttribute('aria-selected', 'false');
        formSignIn.classList.add('is-active');
        formSignUp.classList.remove('is-active');
        const input = formSignIn.querySelector('input');
        if (input) setTimeout(() => input.focus(), 60);
      } else {
        tabSignUp.classList.add('is-active');
        tabSignUp.setAttribute('aria-selected', 'true');
        tabSignIn.classList.remove('is-active');
        tabSignIn.setAttribute('aria-selected', 'false');
        formSignUp.classList.add('is-active');
        formSignIn.classList.remove('is-active');
        const input = formSignUp.querySelector('input');
        if (input) setTimeout(() => input.focus(), 60);
      }
    }

    if (openSignInBtn) {
      openSignInBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('signin');
      });
    }

    if (openSignUpBtn) {
      openSignUpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('signup');
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });

    if (tabSignIn) {
      tabSignIn.addEventListener('click', () => switchTab('signin'));
    }

    if (tabSignUp) {
      tabSignUp.addEventListener('click', () => switchTab('signup'));
    }

    if (switchToSignUp) {
      switchToSignUp.addEventListener('click', () => switchTab('signup'));
    }

    if (switchToSignIn) {
      switchToSignIn.addEventListener('click', () => switchTab('signin'));
    }

    // Social login simulation (Google placeholder)
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const googleSignUpBtn = document.getElementById('googleSignUpBtn');
    [googleSignInBtn, googleSignUpBtn].forEach(btn => {
      if (!btn) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span>Connecting to Google OAuth...</span>`;
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = originalContent;
          window.closeAuthModal();
        }, 800);
      });
    });

    // Gentle submission simulation
    [formSignIn, formSignUp].forEach(form => {
      if (!form) return;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('.auth-submit-btn');
        if (submitBtn) {
          const originalContent = submitBtn.innerHTML;
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<span>Connecting to Terminal...</span>`;
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
            window.closeAuthModal();
          }, 800);
        }
      });
    });
  }
})();
