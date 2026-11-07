/* Yuevaan IT Consultancy — CSP-safe early bootstrap
   1. Marks documentElement with .js and restores saved theme before first paint (zero FOUC)
   2. Handles image load fallbacks via capturing error listener (no inline onerror or outerHTML)
*/
document.documentElement.classList.add('js');

try {
  const savedTheme = localStorage.getItem('yv-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    document.documentElement.dataset.theme = savedTheme;
  }
} catch {
  // Storage access blocked in strict privacy modes — keep default dark theme
}

window.addEventListener(
  'error',
  event => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;

    const fallbackLabel = img.dataset.fallback;
    if (fallbackLabel) {
      const badge = document.createElement('span');
      badge.className = 'client-fallback';
      badge.textContent = fallbackLabel;
      img.replaceWith(badge);
      return;
    }

    if (img.hasAttribute('data-hide-on-error')) {
      img.style.display = 'none';
    }
  },
  true
);

