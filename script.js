/* Yuevaan IT Consultancy — interactions
   0. Brand preloader dismissal
   1. Mobile navigation toggle, sticky header & theme toggle
   2. Scroll reveal, stats counter & hero network canvas
   3. Client ticker seamless loop
   4. Services motion stage (scroll-triggered start & replay)
   5. Hardened project enquiry form submission
*/

document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. mobile nav, sticky header & theme toggle ---------- */
const btn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');
const topbar = document.querySelector('.topbar');
const themeToggle = document.getElementById('themeToggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');

const syncThemeControls = () => {
  const isDark = document.documentElement.dataset.theme !== 'light';
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute(
      'aria-label',
      isDark ? 'Switch to light theme' : 'Switch to dark theme'
    );
  }
  if (themeMeta) {
    themeMeta.setAttribute('content', isDark ? '#061829' : '#F7F6F2');
  }
};
syncThemeControls();

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const root = document.documentElement;
    const nextTheme = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = nextTheme;
    try {
      localStorage.setItem('yv-theme', nextTheme);
    } catch (e) {}
    syncThemeControls();
    window.dispatchEvent(new Event('themechange'));
  });
}

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

/* ---------- 4. services motion stage (scroll-triggered start & replay) ---------- */
const servicesStage = document.getElementById('servicesStage');
const servicesReplay = document.getElementById('servicesReplay');

let initServicesMotion = () => {};

if (servicesStage) {
  if (reduceMotion) {
    if (servicesReplay) servicesReplay.hidden = true;
  } else {
    const initialImg = document.getElementById('servicesAnim');
    const rawAnimSrc = initialImg?.dataset.src || initialImg?.getAttribute('src');
    let animSrc = null;
    if (rawAnimSrc) {
      try {
        const parsed = new URL(rawAnimSrc, window.location.href);
        const sameOrigin =
          window.location.protocol === 'file:'
            ? parsed.protocol === 'file:'
            : parsed.origin === window.location.origin;
        if (sameOrigin && parsed.pathname.toLowerCase().endsWith('.svg')) {
          animSrc = rawAnimSrc;
        }
      } catch {
        animSrc = null;
      }
    }

    if (initialImg && animSrc) {
      let activeBlobUrl = null;
      let swapping = false;

      // Cache verified same-origin SVG markup once over HTTP(S) for instant Blob timeline resets;
      // falls back to query-string cache busting if opened directly via file://.
      const svgMarkupPromise = fetch(animSrc, { credentials: 'same-origin' })
        .then(res => (res.ok ? res.text() : null))
        .then(txt => (txt && txt.trimStart().startsWith('<svg') ? txt : null))
        .catch(() => null);

      const restartServicesAnim = async () => {
        if (swapping) return;
        swapping = true;

        try {
          const currentImg = servicesStage.querySelector('img');
          if (!currentImg) return;

          const markup = await svgMarkupPromise;
          let nextSrc;
          let createdBlobUrl = null;

          if (markup) {
            const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
            createdBlobUrl = URL.createObjectURL(blob);
            nextSrc = createdBlobUrl;
          } else {
            nextSrc = `${animSrc}?v=${Date.now()}`;
          }

          const nextImg = currentImg.cloneNode(false);
          nextImg.classList.add('services-anim-next');
          nextImg.src = nextSrc;
          servicesStage.appendChild(nextImg);

          if (typeof nextImg.decode === 'function') {
            await nextImg.decode().catch(() => {});
          } else {
            await new Promise(resolve => {
              nextImg.onload = resolve;
              nextImg.onerror = resolve;
            });
          }

          currentImg.remove();
          nextImg.classList.remove('services-anim-next');

          if (activeBlobUrl) URL.revokeObjectURL(activeBlobUrl);
          activeBlobUrl = createdBlobUrl;
        } finally {
          swapping = false;
        }
      };

      let observerStarted = false;
      initServicesMotion = () => {
        if (observerStarted) return;
        observerStarted = true;

        if ('IntersectionObserver' in window) {
          const stageObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
              if (!entry.isIntersecting) return;
              restartServicesAnim();
              stageObserver.unobserve(entry.target);
            });
          }, { threshold: 0.22 });

          stageObserver.observe(servicesStage);
        }
      };

      if (servicesReplay) {
        servicesReplay.addEventListener('click', () => {
          servicesReplay.classList.remove('is-spinning');
          // Force reflow so rapid clicks re-trigger the icon spin cleanly
          void servicesReplay.offsetWidth;
          servicesReplay.classList.add('is-spinning');
          restartServicesAnim();
        });
      }
    }
  }
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
      initServicesMotion();
      window.dispatchEvent(new Event('hero:ready'));
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
  initServicesMotion();
  window.dispatchEvent(new Event('hero:ready'));
}

/* ---------- 2b. hero background engine (Bhutan 20-Dzongkhag Network Map + Tech Particles) ---------- */
(() => {
  const canvas = document.querySelector('.hero-particles');
  if (!canvas) return;
  const hero = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const CONFIG = {
    map: {
      enabled: true,
      maxWidth: 0.62,
      minWidth: 0.42,
      maxHeight: 0.8,
      pinWeight: 16,
      textGap: 10,
      textFade: 14,
      dotAlpha: [0.2, 0.42],
      dotRadius: [1.2, 2.1],
      borderAlpha: 0.42,
      dropout: 0.1,
      jitter: 0.18,
      curve: 0.32,
      introDuration: 2.6,
      parallax: 0.2,
      twinkles: 28,
      packetEvery: [0.3, 0.65]
    },
    particles: {
      enabled: true,
      density: 1 / 52000,
      min: 10,
      max: 30,
      speed: 1,
      linkDistance: 160,
      accentRatio: 0.12,
      nodeShare: 0.2,
      iconShare: 0.45,
      maxBrand: 2,
      themes: {
        code: 1.0,
        languages: 0.75,
        cloud: 1.0,
        systems: 1.1,
        security: 0.85,
        mobile: 0.85,
        ai: 1.1,
        brand: 0.4
      }
    },
    parallax: 28,
    textClear: 0.88
  };

  const MAP = {
    aspect: 1.7931,
    border: [0.8650,0.3608,0.8628,0.3862,0.8489,0.4217,0.8467,0.4451,0.8532,0.4888,0.8671,0.5193,0.8725,0.5295,0.8928,0.5407,0.8982,0.5528,0.8992,0.5671,0.9089,0.5650,0.9314,0.5508,0.9507,0.5498,0.9668,0.5335,0.9989,0.6341,0.9989,0.6524,0.9850,0.6748,0.9700,0.7439,0.9743,0.7744,0.9893,0.8018,0.9989,0.8557,0.9957,0.8852,0.9850,0.9045,0.9668,0.9096,0.9464,0.8872,0.9421,0.8892,0.9432,0.9055,0.9368,0.9116,0.9400,0.9197,0.9378,0.9360,0.9335,0.9350,0.9271,0.9085,0.9218,0.9024,0.9132,0.9055,0.8853,0.9360,0.8660,0.9390,0.8478,0.9319,0.8317,0.9390,0.8178,0.8984,0.8017,0.8953,0.7921,0.9024,0.7792,0.9411,0.7642,0.9533,0.7588,0.9533,0.7460,0.9411,0.7353,0.9370,0.6945,0.9350,0.6785,0.9492,0.5916,0.9573,0.5541,0.9502,0.5198,0.9187,0.4930,0.8831,0.4823,0.8801,0.4630,0.9035,0.4577,0.9065,0.4416,0.9065,0.4319,0.9187,0.4244,0.9553,0.4169,0.9675,0.3708,0.9787,0.3462,0.9888,0.3290,0.9797,0.3258,0.9980,0.3226,1.0000,0.3055,0.9980,0.2851,0.9837,0.2787,0.9827,0.2680,0.9909,0.2626,0.9909,0.2583,0.9858,0.2637,0.9685,0.2626,0.9583,0.2551,0.9472,0.2433,0.9390,0.2315,0.9360,0.2122,0.9400,0.1822,0.9055,0.1704,0.9116,0.1618,0.9116,0.1565,0.9217,0.1447,0.9299,0.1190,0.9299,0.1093,0.9248,0.0943,0.8791,0.0804,0.8638,0.0643,0.8699,0.0589,0.8598,0.0579,0.8404,0.0536,0.8293,0.0472,0.8303,0.0364,0.8506,0.0354,0.7876,0.0300,0.7591,0.0000,0.7266,0.0075,0.6900,0.0139,0.6728,0.0214,0.6636,0.0397,0.6545,0.0461,0.6453,0.0493,0.6280,0.0557,0.6189,0.0665,0.6199,0.0729,0.6301,0.0804,0.6189,0.0697,0.5813,0.0665,0.5569,0.0707,0.5295,0.0761,0.5213,0.0740,0.4980,0.0825,0.4868,0.0815,0.4807,0.0857,0.4715,0.0911,0.4695,0.0922,0.4604,0.0997,0.4472,0.1083,0.4411,0.1179,0.4472,0.1404,0.3780,0.1479,0.3313,0.1576,0.3191,0.1704,0.3100,0.1811,0.2947,0.2176,0.1870,0.2347,0.1667,0.2529,0.1291,0.2947,0.1138,0.3055,0.1047,0.3130,0.0783,0.3280,0.0600,0.3376,0.0376,0.3408,0.0346,0.3430,0.0366,0.3537,0.0254,0.3644,0.0305,0.3698,0.0244,0.3998,0.0081,0.4159,0.0142,0.4244,0.0224,0.4309,0.0203,0.4384,0.0061,0.4459,0.0000,0.4566,0.0142,0.4566,0.0356,0.4652,0.0589,0.4770,0.0620,0.4845,0.0356,0.4941,0.0356,0.5027,0.0457,0.5145,0.0457,0.5295,0.0650,0.5423,0.0671,0.5541,0.0752,0.5563,0.0955,0.5477,0.1016,0.5423,0.1209,0.5316,0.1230,0.5230,0.1402,0.5198,0.1717,0.5305,0.1707,0.5498,0.1758,0.5638,0.1717,0.5777,0.1616,0.5949,0.1789,0.6131,0.1870,0.6324,0.1890,0.6495,0.1961,0.6688,0.2266,0.6785,0.2358,0.6913,0.2378,0.7042,0.2327,0.7342,0.1738,0.7417,0.1707,0.7567,0.1717,0.7631,0.1606,0.7685,0.1819,0.7781,0.1972,0.8006,0.2185,0.8553,0.2398,0.8660,0.2520,0.8703,0.2663,0.8628,0.3181,0.8650,0.3608],
    rows: [
      '0000000000000000000000000110100000000000000000000000000000000000',
      '0000000000000000000001111111100100000000000000000000000000000000',
      '0000000000000000000011111111111111100000000000000000000000000000',
      '0000000000000000000011111111111111100000000000000000000000000000',
      '0000000000000000011111111111111111000000000000000000000000000000',
      '0000000000000001111111111111111110000000000000000000000000000000',
      '0000000000000011111111111111111111111110000000011000000000000000',
      '0000000000000111111111111111111111111111110000111110000000000000',
      '0000000000000111111111111111111111111111111111111111111000000000',
      '0000000000001111111111111111111111111111111111111111111100000000',
      '0000000000001111111111111111111111111111111111111111111000000000',
      '0000000000111111111111111111111111111111111111111111111000000000',
      '0000000001111111111111111111111111111111111111111111111000000000',
      '0000000001111111111111111111111111111111111111111111111000000000',
      '0000000011111111111111111111111111111111111111111111111000000000',
      '0000000011111111111111111111111111111111111111111111110000000000',
      '0000001111111111111111111111111111111111111111111111110000000000',
      '0000011111111111111111111111111111111111111111111111111000000000',
      '0000011111111111111111111111111111111111111111111111111000000000',
      '0000111111111111111111111111111111111111111111111111111110000100',
      '0000111111111111111111111111111111111111111111111111111111111110',
      '0000011111111111111111111111111111111111111111111111111111111110',
      '0001111111111111111111111111111111111111111111111111111111111111',
      '0011111111111111111111111111111111111111111111111111111111111111',
      '0111111111111111111111111111111111111111111111111111111111111110',
      '1111111111111111111111111111111111111111111111111111111111111100',
      '0111111111111111111111111111111111111111111111111111111111111100',
      '0011111111111111111111111111111111111111111111111111111111111100',
      '0011111111111111111111111111111111111111111111111111111111111110',
      '0011111111111111111111111111111111111111111111111111111111111111',
      '0000111111111111111111111111111111111111111111111111111111111111',
      '0000001111111111111111111111111111111111111111111111111111111111',
      '0000000111101111111111111111000001111111111111111110011111010000',
      '0000000000000101111111111110000000011111111100011100010100000000',
      '0000000000000000011111111110000000000000000000000000000000000000',
      '0000000000000000000110000000000000000000000000000000000000000000'
    ],
    pins: [
      ['Thimphu', 0.2711, 0.5329, true],
      ['Paro', 0.2039, 0.5582],
      ['Haa', 0.1678, 0.5955],
      ['Samtse', 0.1107, 0.8784],
      ['Chhukha', 0.2405, 0.7581],
      ['Punakha', 0.342, 0.4679],
      ['Wangdue Phodrang', 0.3485, 0.5251],
      ['Gasa', 0.2973, 0.2723],
      ['Dagana', 0.342, 0.7755],
      ['Tsirang', 0.4152, 0.8122],
      ['Sarpang', 0.458, 0.8978],
      ['Zhemgang', 0.5745, 0.687],
      ['Trongsa', 0.5296, 0.5149],
      ['Bumthang', 0.6025, 0.4872],
      ['Mongar', 0.7475, 0.6521],
      ['Lhuentse', 0.7308, 0.4162],
      ['Trashiyangtse', 0.8246, 0.4499],
      ['Trashigang', 0.8413, 0.6172],
      ['Pemagatshel', 0.7963, 0.7947],
      ['Samdrup Jongkhar', 0.83, 0.885]
    ],
    links: [
      ['Thimphu','Paro'], ['Paro','Haa'], ['Thimphu','Chhukha'], ['Chhukha','Samtse'],
      ['Thimphu','Punakha'], ['Punakha','Gasa'], ['Punakha','Wangdue Phodrang'], ['Wangdue Phodrang','Dagana'],
      ['Dagana','Tsirang'], ['Tsirang','Sarpang'], ['Wangdue Phodrang','Trongsa'], ['Trongsa','Bumthang'],
      ['Trongsa','Zhemgang'], ['Zhemgang','Sarpang'], ['Bumthang','Mongar'], ['Mongar','Lhuentse'],
      ['Mongar','Trashigang'], ['Trashigang','Trashiyangtse'], ['Trashigang','Pemagatshel'],
      ['Pemagatshel','Samdrup Jongkhar'], ['Thimphu','Trashigang'], ['Thimphu','Sarpang']
    ]
  };

  // Curated Yuevaan domain vocabulary (software, registries, LIMS, AWS cloud, security, mobile, AI)
  const THEMES = {
    code: {
      words: ['</>','{ }','=>','( )','[ ]','&&','::','//','fn()','async','await','import','const','git push','200 OK','JSON','REST API','GraphQL','PostgreSQL'],
      icons: ['terminal','branch']
    },
    languages: {
      chips: ['.py','.js','.ts','.go','.sql','.java','.php','.dart','.rs','.sh','.tsx','.yml']
    },
    cloud: {
      words: ['AWS','k8s','docker','CI/CD','deploy','S3','EC2','RDS','terraform','serverless','microservices','99.98% uptime'],
      icons: ['cloud','database','server']
    },
    systems: {
      words: ['ERP','LIMS','Registry','ePayment','Single Window','Civil Registry','Portal','CRM','HRMS','Data Warehouse','G2C Services'],
      icons: ['blocks','database','gear']
    },
    security: {
      words: ['Zero Trust','TLS 1.3','OAuth 2.0','RBAC','ISO 27001','Audit Log','SHA-256','Encrypted','WAF','SSO'],
      icons: ['shield','lock','link']
    },
    mobile: {
      words: ['iOS · Android','Flutter','Offline-first','Biometric Auth','Push Sync','QR Verify','mGov'],
      icons: ['cube','hex','sparkle']
    },
    ai: {
      words: ['AI','ML','LLM','RAG','Document OCR','Analytics','Forecasting','Vector Search','Inference','Embeddings'],
      icons: ['chip','sparkle','brain','neural']
    },
    brand: {
      words: ['Yuevaan IT Consultancy','yuevaan.build()','Thimphu · Bhutan','yuevaanconsultancy.bt','Yuevaan IT Consultancy']
    }
  };

  const fx = document.createElement('canvas'), g = fx.getContext('2d');
  const mapCanvas = document.createElement('canvas'), m = mapCanvas.getContext('2d');
  const mask = document.createElement('canvas'), k = mask.getContext('2d');
  const lineMask = document.createElement('canvas'), lk = lineMask.getContext('2d');
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ZONES = '.hero h1, .hero-lede, .hero-cta, .hero-stat';

  let INK = '196,218,240', BLUE = '79,174,247', SIGNAL = '44,203,123', SURFACE = '8,24,41', DOT = 0.8;
  function readTheme() {
    const cs = getComputedStyle(document.documentElement);
    const v = (name, fb) => cs.getPropertyValue(name).trim() || fb;
    INK = v('--fx-ink', INK);
    BLUE = v('--fx-accent', BLUE);
    SIGNAL = v('--fx-signal', BLUE);
    SURFACE = v('--fx-surface', SURFACE);
    DOT = parseFloat(v('--fx-dot', '0.8')) || 0.8;
  }
  readTheme();

  const MONO = '"IBM Plex Mono", ui-monospace, monospace';
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];
  const clamp01 = x => Math.min(1, Math.max(0, x));
  const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  const easeOutCubic = x => 1 - Math.pow(1 - x, 3);
  const easeOutBack = x => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const easeInOut = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  function seeded(a) {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const circ = (p, x, y, r) => { p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); return p; };
  const ICONS = {
    terminal: new Path2D('M3 5h18v14H3zM7 10l3 2-3 2M12.5 14.5h4.5'),
    branch:   new Path2D('M6 4v10M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 8c0 5-12 4-12 8'),
    cloud:    new Path2D('M7 18h10.5a4 4 0 0 0 .4-7.98A6 6 0 0 0 6.3 9.2 4.4 4.4 0 0 0 7 18z'),
    database: new Path2D('M4 6c0-1.66 3.58-3 8-3s8 1.34 8 3-3.58 3-8 3-8-1.34-8-3zM4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3'),
    server:   new Path2D('M4 4h16v6H4zM4 14h16v6H4zM7.5 7h.01M7.5 17h.01M11 7h5M11 17h5'),
    chip:     new Path2D('M7 7h10v10H7zM10 10h4v4h-4zM9.5 3v4M14.5 3v4M9.5 17v4M14.5 17v4M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4'),
    sparkle:  new Path2D('M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z'),
    brain:    new Path2D('M12 5v14M12 5a3 3 0 0 0-5.2 1.1A3 3 0 0 0 4.5 10a3 3 0 0 0 .5 4.6A3 3 0 0 0 7.5 19a3 3 0 0 0 4.5 0M12 5a3 3 0 0 1 5.2 1.1A3 3 0 0 1 19.5 10a3 3 0 0 1-.5 4.6A3 3 0 0 1 16.5 19a3 3 0 0 1-4.5 0M8.5 10.5c1 0 2 .7 2 2M15.5 10.5c-1 0-2 .7-2 2M7.5 15h2.5M16.5 15H14'),
    neural:   (() => {
      const p = new Path2D(), layers = [[4, [7, 17]], [12, [4, 12, 20]], [20, [9, 15]]], r = 1.7;
      for (let i = 0; i < layers.length - 1; i++)
        for (const y1 of layers[i][1]) for (const y2 of layers[i + 1][1]) { p.moveTo(layers[i][0] + r, y1); p.lineTo(layers[i + 1][0] - r, y2); }
      for (const [x, ys] of layers) for (const y of ys) circ(p, x, y, r);
      return p;
    })(),
    gear:     (() => {
      const p = new Path2D();
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; p.moveTo(12 + Math.cos(a) * 6.5, 12 + Math.sin(a) * 6.5); p.lineTo(12 + Math.cos(a) * 9, 12 + Math.sin(a) * 9); }
      circ(p, 12, 12, 6.5); circ(p, 12, 12, 2.5);
      return p;
    })(),
    blocks:   new Path2D('M1 9h6v6H1zM9 9h6v6H9zM17 9h6v6h-6zM7 12h2M15 12h2'),
    link:     new Path2D('M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1'),
    cube:     new Path2D('M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9'),
    hex:      (() => { const p = new Path2D('M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5zM12 9.5V2.5M14.2 13.2l6 3.5M9.8 13.2l-6 3.5'); circ(p, 12, 12, 2.5); return p; })(),
    shield:   new Path2D('M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4'),
    lock:     new Path2D('M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 14.5v2.5')
  };

  let W = 0, H = 0, dpr = 1;
  let mouse = { x: 0, y: 0, tx: 0, ty: 0, px: -1e4, py: -1e4 };
  let running = false, visible = true, last = 0, rafId = 0, now = 0;
  let mapStart = null;

  const DOTS = [];
  (() => {
    const r = seeded(2017), R = MAP.rows.length, C = MAP.rows[0].length, j0 = CONFIG.map.jitter;
    MAP.rows.forEach((row, j) => {
      for (let i = 0; i < C; i++) {
        const a = r(), b = r(), c = r(), d = r(), e = r();
        if (row[i] !== '1' || a < CONFIG.map.dropout) continue;
        DOTS.push({ u: (i + .5 + (b - .5) * 2 * j0) / C, v: (j + .5 + (c - .5) * 2 * j0) / R, s: d, a: e });
      }
    });
  })();

  const pins = MAP.pins.map(([name, u, v, hub], i) => ({ name, u, v, hub: !!hub, x: 0, y: 0, delay: 0, phase: (i * .37) % 1 }));
  const pinByName = Object.fromEntries(pins.map(p => [p.name, p]));
  const links = MAP.links.map(([a, b]) => ({ a: pinByName[a], b: pinByName[b], cx: 0, cy: 0, delay: 0, long: false }));
  const hub = pins.find(p => p.hub) || pins[0];
  let MB = { x: 0, y: 0, w: 0, h: 0, s: 1 }, maxDist = 1;
  let mapPackets = [], nextMapPacket = 0, twinkles = [];
  let lines = [], visibleDots = [];

  const metricCtx = document.createElement('canvas').getContext('2d');
  const metricCache = new Map();
  function glyphMetrics(cs) {
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    if (!metricCache.has(font)) {
      metricCtx.font = font;
      const box = metricCtx.measureText('Hg'), ink = metricCtx.measureText('ÁHbdfhklgjpqy');
      metricCache.set(font, {
        asc: box.fontBoundingBoxAscent,
        desc: box.fontBoundingBoxDescent,
        top: ink.actualBoundingBoxAscent,
        bottom: ink.actualBoundingBoxDescent
      });
    }
    return metricCache.get(font);
  }

  // Compensate for html.js .reveal:not(.in) translate3d(0, 28px, 0) so text masks align with resting layout
  const revealOffsetY = el => {
    const rev = el.closest?.('.reveal');
    return rev && !rev.classList.contains('in') && !reduceMotionQuery.matches ? 28 : 0;
  };

  function measureLines() {
    const h = hero.getBoundingClientRect(), out = [];
    const add = (l, t, r, b) => {
      if (r - l > 1 && b - t > 1) out.push({ l: l - h.left, t: t - h.top, r: r - h.left, b: b - h.top });
    };
    const range = document.createRange();
    hero.querySelectorAll('.hero h1, .hero-lede, .hero-stat').forEach(el => {
      const dy = revealOffsetY(el);
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent.trim()) continue;
        const cs = getComputedStyle(n.parentElement), m = glyphMetrics(cs);
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) {
          if (!m.asc || !m.top) { add(r.left, r.top - dy, r.right, r.bottom - dy); continue; }
          const base = r.top - dy + (r.height - (m.asc + m.desc)) / 2 + m.asc;
          add(r.left, base - m.top, r.right, base + m.bottom);
        }
      }
    });
    hero.querySelectorAll('.hero-cta .btn').forEach(el => {
      const dy = revealOffsetY(el);
      const r = el.getBoundingClientRect();
      add(r.left, r.top - dy, r.right, Math.max(r.bottom - dy, r.top - dy + 2));
    });
    lines = out;
  }

  function distToText(x, y) {
    let d = Infinity;
    for (const z of lines) {
      const dx = Math.max(z.l - x, 0, x - z.r), dy = Math.max(z.t - y, 0, y - z.b), dd = dx * dx + dy * dy;
      if (dd < d) d = dd;
    }
    return Math.sqrt(d);
  }

  function layoutMap() {
    measureLines();
    const narrow = W < 700, CM = CONFIG.map;
    const maxWf = narrow ? 1.25 : CM.maxWidth, minWf = narrow ? .8 : CM.minWidth;

    // Anchor the Bhutan map's visual center directly on the hero headline + lede block
    // ("We build the systems / Bhutan runs on." + "Registries, laboratory systems...")
    const heroRect = hero.getBoundingClientRect();
    const h1El = hero.querySelector('h1');
    const ledeEl = hero.querySelector('.hero-lede');
    let anchorY = H * 0.42;
    if (h1El && ledeEl) {
      const r1 = h1El.getBoundingClientRect(), dy1 = revealOffsetY(h1El);
      const r2 = ledeEl.getBoundingClientRect(), dy2 = revealOffsetY(ledeEl);
      const topY = r1.top - dy1 - heroRect.top;
      const bottomY = r2.bottom - dy2 - heroRect.top;
      if (bottomY > topY) anchorY = (topY + bottomY) / 2;
    } else if (h1El) {
      const r1 = h1El.getBoundingClientRect(), dy1 = revealOffsetY(h1El);
      anchorY = (r1.top + r1.bottom) / 2 - dy1 - heroRect.top;
    }
    const anchorX = W * 0.5;
    const mapCenterU = 0.5;
    const mapCenterV = 0.535;
    const edgePad = 8;
    const maxAllowedMh = Math.max(
      160,
      Math.min(
        H * CM.maxHeight,
        (anchorY - edgePad) / mapCenterV,
        (H - edgePad - anchorY) / (1 - mapCenterV)
      )
    );

    const evaluate = (mw, mh, s, dyPx) => {
      const x0 = anchorX - mapCenterU * mw;
      const y0 = anchorY + dyPx - mapCenterV * mh;
      const need = 11 * s + CM.textGap, needMini = 3 * s + CM.textGap;
      let cost = 0;
      for (const p of pins) {
        const px = x0 + p.u * mw, py = y0 + p.v * mh;
        const d = (px < 12 || px > W - 12 || py < 12 || py > H - 12) ? 0 : distToText(px, py);
        if (p.hub) {
          if (d < needMini) cost += 3;
          else if (d < need) cost += 1.2;
        } else if (d < needMini) {
          cost += 1;
        } else if (d < need) {
          cost += .35;
        }
      }
      const score = cost * CM.pinWeight - mw + Math.abs(dyPx) * 2.5;
      return { score, x0, y0, mw, mh, s, need, needMini, dyPx };
    };

    let best = null;
    for (let wf = maxWf; wf >= minWf - 1e-6; wf -= .025) {
      let mw = W * wf, mh = mw / MAP.aspect;
      if (mh > maxAllowedMh) { mh = maxAllowedMh; mw = mh * MAP.aspect; }
      const s = Math.min(1.15, Math.max(.55, mw / 1330));
      for (let dyPx = -8; dyPx <= 8.01; dyPx += 4) {
        const r = evaluate(mw, mh, s, dyPx);
        if (!best || r.score < best.score) best = r;
      }
    }
    if (!best) {
      let mw = W * minWf, mh = mw / MAP.aspect;
      if (mh > maxAllowedMh) { mh = maxAllowedMh; mw = mh * MAP.aspect; }
      const s = Math.min(1.15, Math.max(.55, mw / 1330));
      best = evaluate(mw, mh, s, 0);
    }
    MB = { x: best.x0, y: best.y0, w: best.mw, h: best.mh, s: best.s };
    for (const p of pins) {
      p.x = MB.x + p.u * MB.w; p.y = MB.y + p.v * MB.h;
      const d = distToText(p.x, p.y);
      p.hidden = d < best.needMini;
      p.mini = !p.hidden && d < best.need;
    }
    maxDist = Math.max(...[[MB.x, MB.y], [MB.x + MB.w, MB.y], [MB.x, MB.y + MB.h], [MB.x + MB.w, MB.y + MB.h]]
      .map(([x, y]) => Math.hypot(x - hub.x, y - hub.y)));
    const D = CONFIG.map.introDuration;
    for (const p of pins) p.delay = Math.hypot(p.x - hub.x, p.y - hub.y) / maxDist * D * .9;
    for (const L of links) {
      const dx = L.b.x - L.a.x, dy = L.b.y - L.a.y, len = Math.hypot(dx, dy) || 1;
      let nx = -dy / len, ny = dx / len;
      if (ny > 0 || (Math.abs(ny) < .05 && nx > 0)) { nx = -nx; ny = -ny; }
      const bend = len * CONFIG.map.curve;
      L.cx = (L.a.x + L.b.x) / 2 + nx * bend;
      L.cy = (L.a.y + L.b.y) / 2 + ny * bend;
      L.long = len > MB.w * .3;
      L.delay = L.a.delay + .25;
    }
  }

  function bakeMap() {
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    if (!CONFIG.map.enabled) return;
    m.setTransform(dpr, 0, 0, dpr, 0, 0);
    const [a0, a1] = CONFIG.map.dotAlpha, [r0, r1] = CONFIG.map.dotRadius;
    const gapPx = CONFIG.map.textGap, fadePx = CONFIG.map.textFade;
    const keep = (x, y) => smooth(gapPx, gapPx + fadePx, distToText(x, y));
    visibleDots = [];
    twinkles = [];
    for (const d of DOTS) {
      const x = MB.x + d.u * MB.w, y = MB.y + d.v * MB.h, f = keep(x, y);
      if (f <= .01) continue;
      const r = (r0 + (r1 - r0) * d.s) * MB.s;
      m.fillStyle = `rgba(${INK},${((a0 + (a1 - a0) * d.a) * f * DOT).toFixed(3)})`;
      m.beginPath(); m.arc(x, y, r, 0, TAU); m.fill();
      if (f > .9) visibleDots.push({ x, y, r });
    }
    const B = MAP.border, gap = 6.5 * MB.s;
    m.fillStyle = `rgba(${INK},${CONFIG.map.borderAlpha * DOT})`;
    let carry = 0;
    for (let i = 0; i < B.length; i += 2) {
      const ax = MB.x + B[i] * MB.w, ay = MB.y + B[i + 1] * MB.h;
      const j = (i + 2) % B.length, bx = MB.x + B[j] * MB.w, by = MB.y + B[j + 1] * MB.h;
      const len = Math.hypot(bx - ax, by - ay);
      for (let d = carry; d < len; d += gap) {
        const x = ax + (bx - ax) * d / len, y = ay + (by - ay) * d / len, f = keep(x, y);
        if (f <= .01) continue;
        m.globalAlpha = f;
        m.beginPath(); m.arc(x, y, 1.15 * MB.s, 0, TAU); m.fill();
      }
      carry = (carry - len) % gap; if (carry < 0) carry += gap;
    }
    m.globalAlpha = 1;
  }

  const quadPoint = (L, t, ox, oy) => {
    const u = 1 - t;
    return [u * u * L.a.x + 2 * u * t * L.cx + t * t * L.b.x + ox, u * u * L.a.y + 2 * u * t * L.cy + t * t * L.b.y + oy];
  };

  let dtLast = 0;
  function drawMap(c, t, staticFrame, ox, oy) {
    const T = staticFrame ? 1e9 : t - mapStart;
    const intro = staticFrame ? 1 : clamp01(T / CONFIG.map.introDuration);
    const s = MB.s;

    if (intro < 1) {
      const R = easeOutCubic(intro) * maxDist;
      c.strokeStyle = `rgba(${BLUE},${.32 * (1 - intro)})`;
      c.lineWidth = 1.5;
      c.beginPath(); c.arc(hub.x + ox, hub.y + oy, R, 0, TAU); c.stroke();
      c.strokeStyle = `rgba(${BLUE},${.14 * (1 - intro)})`;
      c.beginPath(); c.arc(hub.x + ox, hub.y + oy, R * .82, 0, TAU); c.stroke();
    }

    if (intro >= 1 && !staticFrame && visibleDots.length) {
      while (twinkles.length < CONFIG.map.twinkles) twinkles.push({ d: pick(visibleDots), start: t + rand(0, 3), dur: rand(1.6, 3.2) });
      for (let i = 0; i < twinkles.length; i++) {
        const w = twinkles[i], ph = (t - w.start) / w.dur;
        if (ph < 0) continue;
        if (ph >= 1 || !w.d) { twinkles[i] = { d: pick(visibleDots), start: t + rand(0, 1.5), dur: rand(1.6, 3.2) }; continue; }
        const a = Math.sin(Math.PI * ph);
        c.fillStyle = `rgba(${BLUE},${.55 * a})`;
        c.beginPath();
        c.arc(w.d.x + ox, w.d.y + oy, w.d.r * 1.25, 0, TAU);
        c.fill();
      }
    }

    c.lineWidth = 1.2;
    c.setLineDash([3.5, 4.5]);
    c.lineDashOffset = staticFrame ? 0 : -t * 16;
    for (const L of links) {
      const rev = staticFrame ? 1 : clamp01((T - L.delay) / .9);
      if (rev <= 0) continue;
      const e = easeInOut(rev);
      const c1x = L.a.x + (L.cx - L.a.x) * e, c1y = L.a.y + (L.cy - L.a.y) * e;
      const [ex, ey] = quadPoint(L, e, 0, 0);
      c.strokeStyle = `rgba(${BLUE},${L.long ? .4 : .58})`;
      c.beginPath();
      c.moveTo(L.a.x + ox, L.a.y + oy);
      c.quadraticCurveTo(c1x + ox, c1y + oy, ex + ox, ey + oy);
      c.stroke();
    }
    c.setLineDash([]);

    if (!staticFrame && intro >= .6) {
      nextMapPacket -= dtLast;
      if (nextMapPacket <= 0) {
        nextMapPacket = rand(CONFIG.map.packetEvery[0], CONFIG.map.packetEvery[1]);
        const ready = links.filter(L => T - L.delay > 1);
        if (ready.length) mapPackets.push({ L: pick(ready), t: 0, dur: rand(1.4, 2.6), rev: Math.random() < .3 });
      }
      for (let i = mapPackets.length - 1; i >= 0; i--) {
        const pk = mapPackets[i];
        pk.t += dtLast / pk.dur;
        if (pk.t >= 1) { mapPackets.splice(i, 1); continue; }
        const e = easeInOut(pk.t), tt = pk.rev ? 1 - e : e;
        const [x, y] = quadPoint(pk.L, tt, ox, oy);
        const fade = Math.sin(Math.PI * pk.t);
        c.fillStyle = `rgba(${SIGNAL},${.18 * fade})`;
        c.beginPath(); c.arc(x, y, 6 * s, 0, TAU); c.fill();
        c.fillStyle = `rgba(${SIGNAL},${.95 * fade})`;
        c.beginPath(); c.arc(x, y, 2.1 * s, 0, TAU); c.fill();
      }
    }

    for (const p of pins) {
      if (p.hidden) continue;
      const pop = staticFrame ? 1 : easeOutBack(clamp01((T - p.delay) / .55));
      if (pop <= 0) continue;
      const k2 = (p.hub ? 1.35 : 1) * s * pop, x = p.x + ox, y = p.y + oy;
      if (p.mini) {
        c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 3.6 * k2, 0, TAU); c.fill();
        c.fillStyle = `rgb(${BLUE})`; c.beginPath(); c.arc(x, y, 2.4 * k2, 0, TAU); c.fill();
        continue;
      }
      if (!staticFrame) {
        const rings = p.hub ? 2 : 1;
        for (let r = 0; r < rings; r++) {
          const ph = (t * .45 + p.phase + r * .5) % 1;
          c.strokeStyle = `rgba(${BLUE},${.38 * (1 - ph)})`;
          c.lineWidth = 1;
          c.beginPath(); c.arc(x, y, (7 + ph * 17) * k2, 0, TAU); c.stroke();
        }
      }
      c.fillStyle = `rgba(${BLUE},.10)`;
      c.beginPath(); c.arc(x, y, 10.5 * k2, 0, TAU); c.fill();
      c.strokeStyle = `rgba(${BLUE},.28)`;
      c.lineWidth = 1;
      c.stroke();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(x, y, 4.8 * k2, 0, TAU); c.fill();
      c.fillStyle = `rgb(${BLUE})`;
      c.beginPath(); c.arc(x, y, 3 * k2, 0, TAU); c.fill();
    }
  }

  const PC = CONFIG.particles;
  let particles = [];

  function pickTheme() {
    const brandCount = particles.reduce((n, p) => n + (p.theme === 'brand'), 0);
    const pool = Object.keys(THEMES).filter(key =>
      (PC.themes[key] || 0) > 0 && !(key === 'brand' && brandCount >= PC.maxBrand));
    let r = Math.random() * pool.reduce((s, key) => s + PC.themes[key], 0);
    for (const key of pool) { r -= PC.themes[key]; if (r <= 0) return key; }
    return pool[pool.length - 1];
  }

  function makeParticle(anywhere) {
    const z = rand(.45, 1);
    const p = {
      z, x: rand(0, W), y: anywhere ? rand(0, H) : H + rand(20, 80),
      vy: -rand(7, 18) * z, vx: rand(-2, 2) * z,
      swayAmp: rand(4, 14), swayFreq: rand(.08, .22), phase: rand(0, TAU),
      rot: rand(-.25, .25), vr: rand(-.04, .04),
      accent: Math.random() < PC.accentRatio,
      age: anywhere ? rand(0, 2) : 0, sx: 0, sy: 0, a: 0
    };
    if (Math.random() < PC.nodeShare) {
      p.kind = 'node'; p.radius = rand(1.6, 2.6) * (.6 + .4 * z); p.ring = Math.random() < .35;
    } else {
      const theme = pickTheme(), T = THEMES[theme];
      p.theme = theme;
      if (theme === 'brand') { p.kind = 'brand'; p.text = pick(T.words); p.accent = true; p.rot = 0; p.vr = 0; }
      else if (T.chips) { p.kind = 'chip'; p.text = pick(T.chips); }
      else if (T.icons && Math.random() < PC.iconShare) { p.kind = 'icon'; p.icon = pick(T.icons); p.size = rand(18, 26) * (.6 + .4 * z); }
      else { p.kind = 'text'; p.text = pick(T.words); }
    }
    p.link = p.kind === 'icon' || p.kind === 'node';
    return p;
  }

  function layoutParticles() {
    if (!PC.enabled) { particles = []; return; }
    const n = Math.round(Math.min(PC.max, Math.max(PC.min, W * H * PC.density)));
    if (particles.length < n) while (particles.length < n) particles.push(makeParticle(true));
    else particles.length = n;
    particles.forEach(p => { if (p.x > W) p.x = rand(0, W); });
  }

  function updateParticles(dt) {
    const step = dt * PC.speed;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.age += dt; p.y += p.vy * step; p.x += p.vx * step; p.rot += p.vr * step;
      if (p.y < -80 || p.x < -220 || p.x > W + 220) particles[i] = makeParticle(false);
    }
  }

  function drawChip(x, y, text, size, color, a, dot) {
    g.font = `500 ${size}px ${MONO}`;
    const tw = g.measureText(text).width, pad = size * .55, dotW = dot ? size * .9 : 0;
    const w = tw + pad * 2 + dotW, h = size * 1.75, left = x - w / 2;
    g.beginPath();
    if (g.roundRect) g.roundRect(left, y - h / 2, w, h, h / 2); else g.rect(left, y - h / 2, w, h);
    g.fillStyle = `rgba(${SURFACE},${(dot ? .92 : .6) * a})`; g.fill();
    g.strokeStyle = `rgba(${color},${.55 * a})`; g.lineWidth = 1; g.stroke();
    if (dot) { g.fillStyle = `rgba(${color},${.9 * a})`; g.beginPath(); g.arc(left + pad + size * .25, y, size * .22, 0, TAU); g.fill(); }
    g.fillStyle = `rgba(${color},${.85 * a})`;
    g.fillText(text, left + pad + dotW + tw / 2, y + .5);
  }

  function drawParticles(t, staticFrame) {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const p of particles) {
      const sway = staticFrame ? 0 : Math.sin(t * p.swayFreq + p.phase) * p.swayAmp;
      p.sx = p.x + sway + mouse.x * p.z;
      p.sy = p.y + mouse.y * p.z;
      p.a = smooth(0, 1.6, p.age) * smooth(-40, 90, p.y) * smooth(H + 40, H - 90, p.y) * (.45 + .55 * p.z);
    }
    const L = PC.linkDistance, L2 = L * L;
    g.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i]; if (!a.link) continue;
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j]; if (!b.link) continue;
        const dx = a.sx - b.sx, dy = a.sy - b.sy, d2 = dx * dx + dy * dy;
        if (d2 > L2) continue;
        g.strokeStyle = `rgba(${INK},${(1 - Math.sqrt(d2) / L) * Math.min(a.a, b.a) * .22})`;
        g.beginPath(); g.moveTo(a.sx, a.sy); g.lineTo(b.sx, b.sy); g.stroke();
      }
    }
    for (let pass = 0; pass < 2; pass++) {
      for (const p of particles) {
        if ((p.kind === 'brand') !== (pass === 1)) continue;
        const a = p.a; if (a <= .01) continue;
        const color = p.accent ? BLUE : INK;
        switch (p.kind) {
          case 'text': {
            g.save(); g.translate(p.sx, p.sy); g.rotate(p.rot * .3);
            g.font = `400 ${Math.round(10 + 6 * p.z)}px ${MONO}`;
            g.fillStyle = `rgba(${color},${(p.accent ? .55 : .42) * a})`;
            g.fillText(p.text, 0, 0); g.restore();
            break;
          }
          case 'chip':
            drawChip(p.sx, p.sy, p.text, Math.round(10 + 4 * p.z), color, a * (p.accent ? .9 : .7), false);
            break;
          case 'brand': {
            const size = Math.round(11 + 4 * p.z);
            if (p.text.includes(' ')) drawChip(p.sx, p.sy, p.text, size, BLUE, a * .75, true);
            else { g.font = `500 ${size}px ${MONO}`; g.fillStyle = `rgba(${BLUE},${.6 * a})`; g.fillText(p.text, p.sx, p.sy); }
            break;
          }
          case 'icon': {
            g.save(); g.translate(p.sx, p.sy); g.rotate(p.rot);
            const sc = p.size / 24; g.scale(sc, sc); g.translate(-12, -12);
            g.lineWidth = 1.5 / sc * Math.max(.8, p.z); g.lineCap = 'round'; g.lineJoin = 'round';
            g.strokeStyle = `rgba(${color},${(p.accent ? .6 : .45) * a})`;
            g.stroke(ICONS[p.icon]); g.restore();
            break;
          }
          case 'node':
            g.fillStyle = `rgba(${color},${.6 * a})`;
            g.beginPath(); g.arc(p.sx, p.sy, p.radius, 0, TAU); g.fill();
            if (p.ring) { g.strokeStyle = `rgba(${color},${.25 * a})`; g.lineWidth = 1; g.beginPath(); g.arc(p.sx, p.sy, p.radius + 4, 0, TAU); g.stroke(); }
            break;
        }
      }
    }
  }

  // Soft keep-clear masks rendered at 1x CSS resolution for fast blur & 75% less memory
  function buildMask() {
    k.setTransform(1, 0, 0, 1, 0, 0);
    k.clearRect(0, 0, mask.width, mask.height);
    const h = hero.getBoundingClientRect(), off = 20000, pad = 14;
    k.fillStyle = '#000';
    k.shadowColor = '#000';
    k.shadowBlur = 30;
    k.shadowOffsetX = off;
    hero.querySelectorAll(ZONES).forEach(el => {
      const dy = revealOffsetY(el);
      const r = el.getBoundingClientRect();
      k.fillRect(r.left - h.left - pad - off, r.top - dy - h.top - pad, r.width + pad * 2, r.height + pad * 2);
    });
    if (CONFIG.map.enabled) {
      const B = MAP.border;
      k.beginPath();
      for (let i = 0; i < B.length; i += 2) {
        const x = MB.x + B[i] * MB.w - off, y = MB.y + B[i + 1] * MB.h;
        i ? k.lineTo(x, y) : k.moveTo(x, y);
      }
      k.closePath(); k.fill();
    }
    k.shadowColor = 'transparent';
  }

  function buildLineMask() {
    lk.setTransform(1, 0, 0, 1, 0, 0);
    lk.clearRect(0, 0, lineMask.width, lineMask.height);
    const off = 20000, pad = CONFIG.map.textGap * .7;
    lk.fillStyle = '#000'; lk.shadowColor = '#000'; lk.shadowBlur = 8; lk.shadowOffsetX = off;
    for (const z of lines) {
      lk.fillRect(z.l - pad - off, z.t - pad, z.r - z.l + pad * 2, z.b - z.t + pad * 2);
    }
    lk.shadowColor = 'transparent';
  }

  function applyMask(c, strength, src = mask) {
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'destination-out';
    c.globalAlpha = strength;
    c.drawImage(src, 0, 0, c.canvas.width, c.canvas.height);
    c.restore();
  }

  function render(t, staticFrame) {
    const ox = mouse.x * CONFIG.map.parallax, oy = mouse.y * CONFIG.map.parallax;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (PC.enabled) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, fx.width, fx.height);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawParticles(t, staticFrame);
      applyMask(g, CONFIG.textClear);
      ctx.drawImage(fx, 0, 0);
    }

    const still = staticFrame || reduceMotionQuery.matches;
    if (CONFIG.map.enabled && (mapStart !== null || reduceMotionQuery.matches)) {
      const intro = still ? 1 : clamp01((t - mapStart) / CONFIG.map.introDuration);
      if (intro < 1) {
        ctx.save();
        ctx.beginPath();
        ctx.arc((hub.x + ox) * dpr, (hub.y + oy) * dpr, easeOutCubic(intro) * maxDist * dpr, 0, TAU);
        ctx.clip();
        ctx.drawImage(mapCanvas, ox * dpr, oy * dpr);
        ctx.restore();
      } else {
        ctx.drawImage(mapCanvas, ox * dpr, oy * dpr);
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, fx.width, fx.height);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawMap(g, t, still, ox, oy);
      applyMask(g, 1, lineMask);
      ctx.drawImage(fx, 0, 0);
    }
  }

  function frame(ms) {
    if (!running) return;
    now = ms / 1000;
    if (mapStart === null) mapStart = now;
    const dt = Math.min(.05, now - (last || now));
    last = now; dtLast = dt;
    const ease = 1 - Math.exp(-dt * 3);
    mouse.x += (mouse.tx - mouse.x) * ease;
    mouse.y += (mouse.ty - mouse.y) * ease;
    if (PC.enabled) updateParticles(dt);
    render(now, false);
    rafId = requestAnimationFrame(frame);
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    W = Math.max(1, rect.width); H = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [canvas, fx, mapCanvas]) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    for (const c of [mask, lineMask]) {
      c.width = Math.round(W);
      c.height = Math.round(H);
    }
    layoutParticles();
    layoutMap();
    buildMask();
    buildLineMask();
    bakeMap();
    if (!running) render(now, true);
  }

  function start() {
    if (running || reduceMotionQuery.matches || !visible || document.hidden) return;
    running = true; last = 0;
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  hero.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const r = hero.getBoundingClientRect();
    mouse.px = e.clientX - r.left; mouse.py = e.clientY - r.top;
    mouse.tx = (mouse.px / r.width - .5) * -CONFIG.parallax;
    mouse.ty = (mouse.py / r.height - .5) * -CONFIG.parallax;
  });
  hero.addEventListener('pointerleave', () => {
    mouse.tx = 0; mouse.ty = 0; mouse.px = mouse.py = -1e4;
  });
  window.addEventListener('themechange', () => {
    readTheme();
    bakeMap();
    if (!running) render(now, true);
  });
  window.addEventListener('hero:ready', () => {
    mapStart = performance.now() / 1000;
    resize();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible ? start() : stop();
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reduceMotionQuery.addEventListener?.('change', () => {
    if (reduceMotionQuery.matches) { stop(); render(now, true); } else start();
  });

  let resizeTimer = 0;
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    }).observe(hero);
  } else {
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    });
  }

  resize();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
  start();
})();

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

/* ---------- 5. enquiry form ----------
   Progressive enhancement: without JS the form still posts to /api/enquiry.
   With JS it validates inputs strictly, enforces same-origin submission with a
   timeout, and reports status in an accessible live region. */
const form = document.getElementById('enquiry');
const status = document.getElementById('formStatus');

if (form && status) {
  const ALLOWED_SERVICES = new Set([
    'Web application',
    'Mobile application',
    'Cloud & migration',
    'Infrastructure & networking',
    'ERP implementation',
    'System integration',
    'Not sure yet',
  ]);
  const ALLOWED_TIMELINES = new Set([
    'Tender in progress',
    'Within 3 months',
    'This year',
    'Exploring',
  ]);

  let isSubmitting = false;
  let lastSubmittedAt = 0;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (isSubmitting) return;

    // Honeypot — a bot fills every field it finds, a person never sees this one.
    const honeypot = form.elements.namedItem('company_url');
    if (honeypot && honeypot.value !== '') return;

    if (Date.now() - lastSubmittedAt < 3000) {
      status.textContent = 'Please wait a moment before sending another enquiry.';
      status.classList.add('error');
      return;
    }

    // Trim text inputs so whitespace-only values cannot bypass required/minlength checks
    for (const fieldName of ['name', 'organisation', 'email', 'phone', 'message']) {
      const el = form.elements.namedItem(fieldName);
      if (el && typeof el.value === 'string') {
        el.value = el.value.trim();
      }
    }

    const svcEl = form.elements.namedItem('service');
    const whenEl = form.elements.namedItem('timeline');
    const allowlistValid =
      (!svcEl || ALLOWED_SERVICES.has(svcEl.value)) &&
      (!whenEl || ALLOWED_TIMELINES.has(whenEl.value));

    if (!form.checkValidity() || !allowlistValid) {
      status.textContent =
        'Please enter a valid name, email, phone (if provided), and a short description (at least 10 characters).';
      status.classList.add('error');
      form.querySelector(':invalid')?.focus();
      return;
    }

    // Read action via getAttribute (immune to DOM clobbering via form.action) and enforce same-origin
    const rawAction = form.getAttribute('action') || '/api/enquiry';
    let endpointUrl;
    try {
      endpointUrl = new URL(rawAction, window.location.origin);
    } catch {
      endpointUrl = null;
    }
    if (!endpointUrl || endpointUrl.origin !== window.location.origin) {
      status.textContent = 'Invalid form endpoint configuration.';
      status.classList.add('error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    isSubmitting = true;
    if (submitBtn) submitBtn.disabled = true;
    status.classList.remove('error');
    status.textContent = 'Sending…';

    try {
      const res = await fetch(endpointUrl.href, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: new FormData(form),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(res.statusText);

      lastSubmittedAt = Date.now();
      form.reset();
      status.textContent = 'Thanks — we will reply within one working day.';
    } catch {
      // Never leave someone stuck: give them a route that does not depend on us.
      status.textContent =
        'That did not send. Email info@yuevaanconsultancy.bt or message us on WhatsApp.';
      status.classList.add('error');
    } finally {
      clearTimeout(timeoutId);
      isSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
