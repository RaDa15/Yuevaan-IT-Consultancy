/* Yuevaán IT Consultancy — interactions
   1. Mobile navigation toggle
   2. Scroll reveal for sections
   3. Contact form submit feedback (demo only)
*/

/* ---------- 1. mobile nav ---------- */
const btn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');

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

/* ---------- 2. scroll reveal ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add('in');
      io.unobserve(en.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ---------- 3. client ticker ----------
   Each track holds one .marq-group of logos. We clone it once so the
   track is exactly twice its own width — the CSS then slides it by 50%
   and restarts, which reads as an endless loop with no visible jump.
   The clone is aria-hidden so screen readers announce each logo once. */
document.querySelectorAll('.marq-track').forEach(track => {
  const group = track.querySelector('.marq-group');
  if (!group) return;
  const clone = group.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  track.appendChild(clone);
});

/* ---------- 4. click-to-load map ----------
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

/* ---------- 5. enquiry form ----------
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