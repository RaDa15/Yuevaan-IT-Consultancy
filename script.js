/* Yuevaán IT Consultancy — interactions
   0. Brand preloader dismissal
   1. Mobile navigation toggle & sticky header state
   2. Scroll reveal & stats counter animation
   3. Client ticker seamless loop
   4. Click-to-load map
   5. Contact form submit feedback (demo only)
*/

document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. mobile nav & sticky header ---------- */
const btn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');
const topbar = document.querySelector('.topbar');

if (btn && nav) {
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? 'Close' : 'Menu';
  });

  nav.addEventListener('click', e => {
    if (e.target.tagName === 'A') {
      nav.classList.remove('open');
      btn.textContent = 'Menu';
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

if (topbar) {
  const syncTopbar = () => {
    topbar.classList.toggle('is-scrolled', window.scrollY > 16);
  };
  syncTopbar();
  window.addEventListener('scroll', syncTopbar, { passive: true });
}

if (nav && 'IntersectionObserver' in window) {
  const navLinks = Array.from(nav.querySelectorAll('a[href^="#"]'));
  const sections = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (sections.length) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const activeId = `#${en.target.id}`;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === activeId);
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });

    sections.forEach(sec => spy.observe(sec));
  }
}

/* ---------- 2. preloader, scroll reveal & stats counting ---------- */
const preloader = document.getElementById('preloader');
const revealEls = document.querySelectorAll('.reveal');
const countEls = document.querySelectorAll('[data-count]');

function animateCount(el) {
  if (el.dataset.counted === 'true') return;
  el.dataset.counted = 'true';

  const target = parseFloat(el.dataset.count);
  if (Number.isNaN(target)) return;

  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const decimals = (el.dataset.count.split('.')[1] || '').length;
  const duration = 1800;

  if (reduceMotion) {
    el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
    return;
  }

  let startTime = null;
  el.textContent = `${prefix}${(0).toFixed(decimals)}${suffix}`;

  const step = timestamp => {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Smooth quartic ease-out
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = target * eased;

    el.textContent = `${prefix}${current.toFixed(decimals)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
    }
  };

  requestAnimationFrame(step);
}

function initRevealAndCounters() {
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('in'));
    countEls.forEach(el => animateCount(el));
    return;
  }

  const io = new IntersectionObserver(entries => {
    let batchIndex = 0;

    entries.forEach(en => {
      if (!en.isIntersecting) return;

      const el = en.target;
      const customDelay = el.dataset.delay;
      let delayMs = 0;

      if (customDelay !== undefined) {
        delayMs = parseInt(customDelay, 10) || 0;
      } else {
        delayMs = Math.min(batchIndex * 85, 425);
        batchIndex += 1;
      }

      el.style.setProperty('--reveal-delay', `${delayMs}ms`);
      el.classList.add('in');

      // Trigger any stats counter inside or on this revealed element
      const counters = el.matches('[data-count]')
        ? [el]
        : Array.from(el.querySelectorAll('[data-count]'));
      counters.forEach(counter => {
        setTimeout(() => animateCount(counter), delayMs);
      });

      io.unobserve(el);
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -44px 0px'
  });

  revealEls.forEach(el => io.observe(el));

  // Observe any standalone [data-count] not wrapped inside .reveal
  const countIo = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      animateCount(en.target);
      countIo.unobserve(en.target);
    });
  }, { threshold: 0.2 });

  countEls.forEach(el => {
    if (!el.closest('.reveal')) {
      countIo.observe(el);
    }
  });
}

if (preloader && !reduceMotion) {
  const startStamp = performance.now();
  const minDisplayMs = 600;
  let dismissed = false;

  const dismissPreloader = () => {
    if (dismissed) return;
    dismissed = true;
    const elapsed = performance.now() - startStamp;
    const wait = Math.max(0, minDisplayMs - elapsed);

    setTimeout(() => {
      preloader.classList.add('is-hidden');
      initRevealAndCounters();
      setTimeout(() => preloader.remove(), 650);
    }, wait);
  };

  if (document.readyState === 'complete') {
    dismissPreloader();
  } else {
    window.addEventListener('load', dismissPreloader, { once: true });
    // Fallback so slow third-party embeds never block the user
    setTimeout(dismissPreloader, 1400);
  }
} else {
  if (preloader) preloader.classList.add('is-hidden');
  initRevealAndCounters();
}

/* ---------- 3. client ticker ----------
   Each track holds one .marq-group of logos. We clone it once so the
   track is exactly twice its own width — the CSS then slides it by 50%
   and restarts, which reads as an endless loop with no visible jump.
   The clone is aria-hidden so screen readers announce each logo once. */
document.querySelectorAll('.marq-track').forEach(track => {
  const group = track.querySelector('.marq-group');
  if (!group) return;
  group.querySelectorAll('.marq-item').forEach(item => {
    if (!item.dataset.org) {
      const img = item.querySelector('img');
      if (img && img.alt) item.dataset.org = img.alt;
    }
  });
  const clone = group.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  track.appendChild(clone);
});

/* ---------- 5. click-to-load map ----------
   The iframe is built only when the visitor asks for it, so a normal page view
   makes zero requests to Google. This is also the single heaviest asset on the
   page, so deferring it improves load time as much as it improves privacy. */
const mapBox = document.getElementById('map');
const mapLoad = document.getElementById('mapLoad');

if (mapBox && mapLoad) {
  const EMBED_SRC =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d503.77410867869423!2d89.65814007763153' +
    '!3d27.451617605673466!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e193014cb56219' +
    '%3A0x62c29fa9f04c61fa!2sYuevaan%20IT%20Consultancy!5e0!3m2!1sen!2sbt!4v1708108622087!5m2!1sen!2sbt';

  mapLoad.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.src = EMBED_SRC;
    frame.title = 'Map showing the Yuevaán IT Consultancy office in Thimphu';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.allowFullscreen = true;

    mapBox.innerHTML = '';
    mapBox.classList.add('is-loaded');
    mapBox.appendChild(frame);
    frame.focus?.();
  });
}

/* ---------- 6. enquiry form ----------
   Progressive enhancement: without JS the form still posts to /api/enquiry.
   With JS it submits in the background and reports status in a live region.
   Replace the fetch target with your real endpoint. */
const form = document.getElementById('enquiry');
const status = document.getElementById('formStatus');

if (form && status) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot — a bot fills every field it finds, a person never sees this one.
    if (form.elements.company_url.value !== '') return;

    if (!form.checkValidity()) {
      status.textContent = 'Add your name, email and a short description before sending.';
      status.classList.add('error');
      form.querySelector(':invalid')?.focus();
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    status.classList.remove('error');
    status.textContent = 'Sending…';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error(res.statusText);

      form.reset();
      status.textContent = 'Thanks — we will reply within one working day.';
    } catch {
      // Never leave someone stuck: give them a route that does not depend on us.
      status.textContent =
        'That did not send. Email info@yuevaanconsultancy.bt or message us on WhatsApp.';
      status.classList.add('error');
    } finally {
      btn.disabled = false;
    }
  });
}
