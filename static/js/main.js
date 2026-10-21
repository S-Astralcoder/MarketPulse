/**
 * Market Pulse — Main Client Script
 * Stack: Vanilla ES6 JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // Watchlist Star Toggle Interactivity
  const watchButtons = document.querySelectorAll('.btn-watch');
  watchButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering card selection/drawer
      const icon = btn.querySelector('i');
      if (icon) {
        if (icon.classList.contains('fa-regular')) {
          icon.classList.remove('fa-regular');
          icon.classList.add('fa-solid');
          btn.classList.add('active');
        } else {
          icon.classList.remove('fa-solid');
          icon.classList.add('fa-regular');
          btn.classList.remove('active');
        }
      }
    });
  });

  // Smooth scroll helper for internal anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }
    });
  });
});
