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
    const signInErr = document.getElementById('signInError');
    const signUpErr = document.getElementById('signUpError');

    if (signInErr) {
      signInErr.classList.remove('is-visible');
      signInErr.textContent = '';
    }
    if (signUpErr) {
      signUpErr.classList.remove('is-visible');
      signUpErr.textContent = '';
    }

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

  // Dedicated Launch Controller with Access Check
  window.handleLaunchDashboard = async function (e) {
    if (e && e.preventDefault) e.preventDefault();
    const auth = window.AuthService;
    const token = auth ? auth.getStoredToken() : null;

    if (token) {
      const isValid = await auth.verifyAccess(token);
      if (isValid) {
        window.location.href = '/dashboard.html';
        return;
      }
    }
    // Unauthenticated or invalid token: open sign-in modal
    window.openAuthModal('signin');
  };

  // Immediate global click delegation for any auth & launch triggers
  document.addEventListener('click', function (e) {
    const launchTrigger = e.target.closest('#openSignUpBtn, .launch-app-btn, a[href="#dashboard"]');
    if (launchTrigger) {
      e.preventDefault();
      window.handleLaunchDashboard(e);
      return;
    }

    const authTrigger = e.target.closest('#openSignInBtn, [data-open-modal], a[href="#signin"], a[href="#signup"]');
    if (authTrigger) {
      e.preventDefault();
      const isSignUp = authTrigger.getAttribute('href') === '#signup' ||
                       authTrigger.getAttribute('data-open-modal') === 'signup';
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
      const signInErr = document.getElementById('signInError');
      const signUpErr = document.getElementById('signUpError');
      if (signInErr) { signInErr.classList.remove('is-visible'); signInErr.textContent = ''; }
      if (signUpErr) { signUpErr.classList.remove('is-visible'); signUpErr.textContent = ''; }
      switchTab(tab || 'signin');
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      const signInErr = document.getElementById('signInError');
      const signUpErr = document.getElementById('signUpError');
      if (signInErr) { signInErr.classList.remove('is-visible'); signInErr.textContent = ''; }
      if (signUpErr) { signUpErr.classList.remove('is-visible'); signUpErr.textContent = ''; }
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
        window.handleLaunchDashboard(e);
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

    // Google Sign-In placeholder note
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const googleSignUpBtn = document.getElementById('googleSignUpBtn');
    [googleSignInBtn, googleSignUpBtn].forEach((btn) => {
      if (!btn) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const errBanner = btn.closest('form')?.querySelector('.auth-error-banner');
        if (errBanner) {
          errBanner.textContent = 'Google OAuth is currently in development. Please use email credentials.';
          errBanner.classList.add('is-visible');
        }
      });
    });

    // Wire Sign-In Form (POST /user/signup)
    if (formSignIn) {
      formSignIn.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('signinEmail');
        const passwordInput = document.getElementById('signinPassword');
        const errorBanner = document.getElementById('signInError');
        const submitBtn = formSignIn.querySelector('.auth-submit-btn');

        if (errorBanner) {
          errorBanner.classList.remove('is-visible');
          errorBanner.textContent = '';
        }

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        if (!email || !password) {
          if (errorBanner) {
            errorBanner.textContent = 'Please provide both email and password.';
            errorBanner.classList.add('is-visible');
          }
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.dataset.originalHtml = submitBtn.innerHTML;
          submitBtn.innerHTML = '<span>Verifying credentials...</span>';
        }

        const result = await window.AuthService.signIn(email, password);

        if (result.success) {
          if (submitBtn) submitBtn.innerHTML = '<span>Authenticated. Loading Terminal...</span>';
          window.location.href = '/dashboard.html';
        } else {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitBtn.dataset.originalHtml || '<span>Access Terminal</span>';
          }
          if (errorBanner) {
            errorBanner.textContent = result.error || 'Authentication failed. Please check credentials.';
            errorBanner.classList.add('is-visible');
          }
        }
      });
    }

    // Wire Registration Form (POST /user/register)
    if (formSignUp) {
      formSignUp.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('signupName');
        const emailInput = document.getElementById('signupEmail');
        const passwordInput = document.getElementById('signupPassword');
        const disclaimerBox = document.getElementById('signupDisclaimer');
        const errorBanner = document.getElementById('signUpError');
        const submitBtn = formSignUp.querySelector('.auth-submit-btn');

        if (errorBanner) {
          errorBanner.classList.remove('is-visible');
          errorBanner.textContent = '';
        }

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const disclaimer = disclaimerBox ? disclaimerBox.checked : false;

        if (!name || name.length < 2) {
          if (errorBanner) {
            errorBanner.textContent = 'Name must be at least 2 characters long.';
            errorBanner.classList.add('is-visible');
          }
          if (nameInput) nameInput.focus();
          return;
        }

        if (!email) {
          if (errorBanner) {
            errorBanner.textContent = 'Please enter a valid email address.';
            errorBanner.classList.add('is-visible');
          }
          if (emailInput) emailInput.focus();
          return;
        }

        // Validate backend password pattern: min 8, lower, upper, digit, special char
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-+_!@#$%^&*.,?]).{8,50}$/;
        if (!passwordPattern.test(password)) {
          if (errorBanner) {
            errorBanner.textContent = 'Password must be 8-50 characters with at least one uppercase letter, one lowercase letter, one digit, and one special symbol.';
            errorBanner.classList.add('is-visible');
          }
          if (passwordInput) passwordInput.focus();
          return;
        }

        if (!disclaimer) {
          if (errorBanner) {
            errorBanner.textContent = 'Please acknowledge that MarketPulse provides telemetry data, not investment advice.';
            errorBanner.classList.add('is-visible');
          }
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.dataset.originalHtml = submitBtn.innerHTML;
          submitBtn.innerHTML = '<span>Registering account...</span>';
        }

        const result = await window.AuthService.register(name, email, password);

        if (result.success) {
          if (submitBtn) submitBtn.innerHTML = '<span>Registration verified. Redirecting...</span>';
          window.location.href = '/dashboard.html';
        } else {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitBtn.dataset.originalHtml || '<span>Initialize Account</span>';
          }
          if (errorBanner) {
            errorBanner.textContent = result.error || 'Registration failed.';
            errorBanner.classList.add('is-visible');
          }
        }
      });
    }
  }
})();
