/* JP TOPOGRAFIA — vanilla JS interactions */
(function () {
  'use strict';

  /* -------- Tweaks defaults (host-editable) -------- */
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "primaryColor": "#1B9CD8"
  }/*EDITMODE-END*/;

  const tweakState = { ...TWEAK_DEFAULTS };

  function applyPrimary(color) {
    document.documentElement.style.setProperty('--primary', color);
    // derive a darker tone for hover
    document.documentElement.style.setProperty('--primary-600',
      shade(color, -0.12));
  }
  function shade(hex, percent) {
    const c = hex.replace('#', '');
    const num = parseInt(c, 16);
    let r = (num >> 16) + Math.round(255 * percent);
    let g = ((num >> 8) & 0x00FF) + Math.round(255 * percent);
    let b = (num & 0x0000FF) + Math.round(255 * percent);
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }
  applyPrimary(tweakState.primaryColor);


  /* -------- Sticky header -------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (window.scrollY > 24) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();


  /* -------- Mobile drawer -------- */
  const menuToggle = document.querySelector('.menu-toggle');
  const drawer = document.querySelector('.drawer');
  if (menuToggle && drawer) {
    menuToggle.addEventListener('click', () => {
      drawer.classList.toggle('open');
      const open = drawer.classList.contains('open');
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => drawer.classList.remove('open'));
    });
  }


  /* -------- Scroll reveal -------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));


  /* -------- Animated KPI counters -------- */
  const counters = document.querySelectorAll('[data-count]');
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dur = 1400;
      const start = performance.now();
      const startVal = 0;
      const ease = t => 1 - Math.pow(1 - t, 3);
      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const v = Math.floor(startVal + (target - startVal) * ease(t));
        el.textContent = v + suffix;
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(step);
      counterIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterIO.observe(c));


  /* -------- Lightbox -------- */
  const projects = Array.from(document.querySelectorAll('.project'));
  const lightbox = document.querySelector('.lightbox');
  if (lightbox && projects.length) {
    const lbImg = lightbox.querySelector('img');
    const lbTitle = lightbox.querySelector('.lb-title');
    const lbCaption = lightbox.querySelector('.lb-caption');
    let current = 0;

    const items = projects.map(p => ({
      src: p.dataset.full || p.querySelector('img').src,
      title: p.dataset.title || p.querySelector('h4')?.textContent || '',
      caption: p.dataset.caption || ''
    }));

    function open(i) {
      current = i;
      const item = items[i];
      lbImg.src = item.src;
      lbTitle.textContent = item.title;
      lbCaption.textContent = item.caption;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }
    function nav(d) { open((current + d + items.length) % items.length); }

    projects.forEach((p, i) => p.addEventListener('click', () => open(i)));
    lightbox.querySelector('.close').addEventListener('click', close);
    lightbox.querySelector('.prev').addEventListener('click', () => nav(-1));
    lightbox.querySelector('.next').addEventListener('click', () => nav(1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') nav(1);
      if (e.key === 'ArrowLeft') nav(-1);
    });
  }


  /* -------- FAQ: ensure only one open at a time (optional) -------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        document.querySelectorAll('.faq-item[open]').forEach(other => {
          if (other !== item) other.open = false;
        });
      }
    });
  });


  /* -------- Contact form validation -------- */
  const form = document.querySelector('#contact-form');
  if (form) {
    const status = form.querySelector('.form-status');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      form.querySelectorAll('[required]').forEach(input => {
        const field = input.closest('.field');
        const value = input.value.trim();
        let valid = value.length > 0;
        if (input.type === 'email' && valid) {
          valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }
        if (input.type === 'tel' && valid) {
          valid = value.replace(/\D/g, '').length >= 8;
        }
        if (!valid) { field.classList.add('invalid'); ok = false; }
        else field.classList.remove('invalid');
      });
      if (!ok) {
        status.className = 'form-status error';
        status.textContent = 'Por favor, preencha os campos destacados corretamente.';
        return;
      }
      status.className = 'form-status success';
      status.textContent = 'Obrigado! Recebemos sua mensagem. Em breve entraremos em contato.';
      form.reset();
    });
    // Clear invalid on input
    form.querySelectorAll('input, textarea, select').forEach(el => {
      el.addEventListener('input', () => el.closest('.field')?.classList.remove('invalid'));
    });
  }


  /* -------- Newsletter form -------- */
  const news = document.querySelector('#newsletter-form');
  if (news) {
    news.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = news.querySelector('input[type="email"]');
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      if (!valid) {
        input.focus();
        input.style.outline = '2px solid #DC2626';
        setTimeout(() => input.style.outline = '', 1200);
        return;
      }
      const btn = news.querySelector('button');
      const orig = btn.textContent;
      btn.textContent = 'Inscrito! ✓';
      input.value = '';
      setTimeout(() => btn.textContent = orig, 2200);
    });
  }


  /* -------- Phone mask -------- */
  const phone = document.querySelector('input[name="phone"]');
  if (phone) {
    phone.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
      else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
      else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
      else if (v.length > 0) v = v.replace(/^(\d{0,2}).*/, '($1');
      e.target.value = v;
    });
  }


  /* -------- Smooth-scroll anchors -------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });


  /* =========================================================
     TWEAKS PANEL — primary color
     ========================================================= */
  const PRIMARY_OPTIONS = [
    { label: 'Azul JP (padrão)', value: '#1B9CD8' },
    { label: 'Marinho', value: '#0B2545' },
    { label: 'Verde técnico', value: '#0E9F6E' },
    { label: 'Laranja', value: '#F2761B' },
    { label: 'Roxo', value: '#6D4AFF' },
    { label: 'Vermelho', value: '#DC2F3E' }
  ];

  // Build tweaks UI
  const tweaks = document.createElement('div');
  tweaks.className = 'tweaks';
  tweaks.innerHTML = `
    <button class="close-tw" aria-label="Fechar">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>
    </button>
    <h6>Tweaks</h6>
    <div class="row">
      <label>Cor primária</label>
      <div class="swatches" id="tw-swatches">
        ${PRIMARY_OPTIONS.map(o => `
          <button class="swatch" data-color="${o.value}" title="${o.label}" style="background:${o.value}"></button>
        `).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(tweaks);

  function highlightActive(color) {
    tweaks.querySelectorAll('.swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.color.toLowerCase() === color.toLowerCase());
    });
  }
  highlightActive(tweakState.primaryColor);

  tweaks.querySelectorAll('.swatch').forEach(s => {
    s.addEventListener('click', () => {
      const color = s.dataset.color;
      tweakState.primaryColor = color;
      applyPrimary(color);
      highlightActive(color);
      try {
        window.parent.postMessage(
          { type: '__edit_mode_set_keys', edits: { primaryColor: color } },
          '*'
        );
      } catch (e) {}
    });
  });

  tweaks.querySelector('.close-tw').addEventListener('click', () => {
    tweaks.classList.remove('open');
    try {
      window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
    } catch (e) {}
  });

  // Host protocol — register listener BEFORE announcing
  window.addEventListener('message', (e) => {
    const msg = e.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === '__activate_edit_mode') tweaks.classList.add('open');
    if (msg.type === '__deactivate_edit_mode') tweaks.classList.remove('open');
  });
  try {
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
  } catch (e) {}

})();
