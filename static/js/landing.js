/**
 * MarketPulse — Fluid Section Snap & Navigation Controller
 * Provides natural, unblocked scrolling with native CSS proximity snapping,
 * keyboard controls, and active section tracking.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', initLandingNavigation);

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
})();
