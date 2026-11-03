/**
 * MarketPulse — Controlled Section Snap & Center-Lock Navigation
 * Provides controlled page-by-page scrolling with center-point snapping and smooth transitions.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', initSnapNavigation);

  function initSnapNavigation() {
    const sections = Array.from(document.querySelectorAll('.snap-section'));
    if (!sections.length) return;

    const navLinks = Array.from(document.querySelectorAll('.nav-link'));
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.offsetHeight : 72;

    let currentIndex = 0;
    let isLocked = false;
    let lockTimer = null;

    // --- 1. Center-Point Scroll Function ---
    function scrollToSection(index, smooth = true) {
      if (index < 0 || index >= sections.length) return;

      currentIndex = index;
      const target = sections[index];

      // Calculate scroll position so the section is centered in the visible viewport
      const targetRect = target.getBoundingClientRect();
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      const sectionHeight = target.offsetHeight;

      // Available height excluding sticky header
      const availableHeight = viewportHeight - headerHeight;
      const verticalOffset = Math.max(0, (availableHeight - sectionHeight) / 2);
      const destination = currentScrollTop + targetRect.top - headerHeight - verticalOffset;

      isLocked = true;
      clearTimeout(lockTimer);

      window.scrollTo({
        top: Math.max(0, destination),
        behavior: smooth ? 'smooth' : 'auto'
      });

      // Update active classes
      sections.forEach((sec, i) => {
        sec.classList.toggle('is-active', i === index);
      });

      updateNavLinks(target.id);

      // Cooldown timer to prevent gesture chaining
      lockTimer = setTimeout(() => {
        isLocked = false;
      }, 750);
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

    // --- 3. Wheel Event Listener (Controlled Snap Scroll) ---
    // Only lock wheel on pointer devices (desktop/laptops) where fine scroll occurs
    let touchStartY = 0;

    window.addEventListener('wheel', (e) => {
      // Do not block user if inspecting an internal scrollable container
      if (Math.abs(e.deltaY) < 15) return;

      if (isLocked) {
        e.preventDefault();
        return;
      }

      if (e.deltaY > 0) {
        // Scroll down
        if (currentIndex < sections.length - 1) {
          e.preventDefault();
          scrollToSection(currentIndex + 1);
        }
      } else {
        // Scroll up
        if (currentIndex > 0) {
          e.preventDefault();
          scrollToSection(currentIndex - 1);
        }
      }
    }, { passive: false });

    // --- 4. Keyboard Navigation ---
    window.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'PageDown', 'Space'].includes(e.code)) {
        if (currentIndex < sections.length - 1) {
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
      } else if (e.code === 'End') {
        e.preventDefault();
        scrollToSection(sections.length - 1);
      }
    });

    // --- 5. Nav Anchor Link Clicks ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href').slice(1);
        const targetSecIndex = sections.findIndex(sec => sec.id === targetId);

        if (targetSecIndex !== -1) {
          e.preventDefault();
          scrollToSection(targetSecIndex);
        }
      });
    });

    // --- 6. Intersection Observer for Scroll Detection ---
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isLocked) {
          const index = sections.indexOf(entry.target);
          if (index !== -1) {
            currentIndex = index;
            sections.forEach((sec, i) => sec.classList.toggle('is-active', i === index));
            updateNavLinks(entry.target.id);
          }
        }
      });
    }, {
      rootMargin: `-${headerHeight}px 0px -40% 0px`,
      threshold: 0.2
    });

    sections.forEach(sec => observer.observe(sec));

    // Initialize first section as active
    sections[0].classList.add('is-active');
  }
})();
