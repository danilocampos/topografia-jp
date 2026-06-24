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


  /* -------- Contact form -------- */
  const form = document.querySelector('#contact-form');
  if (form) {
    const status = form.querySelector('.form-status');
    const submitBtn = form.querySelector('button[type="submit"]');
    const WA_URL = 'https://wa.me/553499166794?text=' +
      encodeURIComponent('Olá! Acabei de enviar uma mensagem pelo formulário do site da JP Topografia. Gostaria de continuar o atendimento por aqui.');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validação
      let ok = true;
      form.querySelectorAll('[required]').forEach(input => {
        const field = input.closest('.field');
        const value = input.value.trim();
        let valid = value.length > 0;
        if (input.type === 'email' && valid) valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (input.type === 'tel'   && valid) valid = value.replace(/\D/g, '').length >= 8;
        if (!valid) { field.classList.add('invalid'); ok = false; }
        else field.classList.remove('invalid');
      });
      if (!ok) {
        status.className = 'form-status error';
        status.textContent = 'Por favor, preencha os campos destacados corretamente.';
        return;
      }

      // Envio
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando…';
      status.className = 'form-status';
      status.textContent = '';

      try {
        const res  = await fetch('send.php', { method: 'POST', body: new FormData(form) });
        const data = await res.json();

        if (data.ok) {
          form.reset();
          status.className = 'form-status success';
          status.textContent = 'Mensagem enviada! Redirecionando para o WhatsApp…';
          setTimeout(() => { window.open(WA_URL, '_blank'); }, 1500);
        } else {
          throw new Error(data.error || 'Erro desconhecido.');
        }
      } catch (err) {
        status.className = 'form-status error';
        status.textContent = err.message || 'Falha ao enviar. Tente novamente.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Enviar mensagem <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
      }
    });

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


  /* -------- Service Modals -------- */
  const SVC_DATA = {
    'Levantamento Topográfico': {
      desc: 'O levantamento topográfico é o primeiro passo para qualquer projeto bem executado. Ele fornece informações precisas do terreno: medidas, altitudes, divisas, construções existentes, vegetação e demais características relevantes.',
      use: 'Projetos de engenharia, obras, loteamentos, estradas, terraplenagem, regularizações e estudos técnicos.',
      benefits: 'Precisão nas decisões, redução de riscos, economia de tempo e maior qualidade no resultado final do projeto.',
      when: 'Antes de iniciar qualquer projeto ou obra que envolva intervenções no terreno.',
      img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      highlight: 'Equipamentos de alta precisão e equipe técnica especializada para resultados confiáveis.',
      wa: 'Olá! Gostaria de saber mais sobre o serviço de Levantamento Topográfico.'
    },
    'Levantamento Planialtimétrico': {
      desc: 'Combina dados planimétricos (posição horizontal) e altimétricos (cotas e alturas), gerando curvas de nível e plantas completas do terreno com toda a informação necessária para projetos precisos.',
      use: 'Projetos de terraplenagem, drenagem, loteamentos e obras que exigem análise detalhada do relevo.',
      benefits: 'Visualização precisa do terreno, cálculo de volumes de corte e aterro, e planejamento eficiente da infraestrutura.',
      when: 'Quando o projeto exige análise do relevo e planejamento de movimentação de terra.',
      img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
      highlight: 'Plantas entregues em DWG/DXF e PDF, compatíveis com AutoCAD e softwares de projeto.',
      wa: 'Olá! Gostaria de saber mais sobre o serviço de Levantamento Planialtimétrico.'
    },
    'Georreferenciamento': {
      desc: 'Processo de vinculação de imóveis rurais e urbanos ao Sistema Geodésico Brasileiro (SGB), conforme as normas do INCRA, garantindo a regularização fundiária e legal do seu imóvel.',
      use: 'Regularização fundiária, desmembramento, unificação e registro de imóveis rurais no cartório de registro de imóveis.',
      benefits: 'Regularização legal do imóvel, facilidade em transações imobiliárias, financiamentos bancários e segurança jurídica.',
      when: 'Para regularização, venda, herança, partilha ou financiamento de imóvel rural.',
      img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
      highlight: 'Certificação junto ao INCRA com ART do responsável técnico habilitado.',
      wa: 'Olá! Gostaria de saber mais sobre o serviço de Georreferenciamento.'
    },
    'Topografia com Drone': {
      desc: 'Utilizamos VANTs (drones) com tecnologia RTK para mapeamento aéreo de alta precisão e produtividade. Geramos ortomosaicos, modelos digitais de superfície e nuvem de pontos em tempo reduzido.',
      use: 'Grandes áreas, mineração, agricultura de precisão, obras lineares, fiscalização e áreas de difícil acesso.',
      benefits: 'Alta velocidade de coleta, redução de custos em grandes áreas, ortomosaicos de alta resolução e modelos 3D detalhados.',
      when: 'Quando a área é extensa ou de difícil acesso para os métodos topográficos tradicionais.',
      img: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=800&q=80',
      highlight: 'Drone RTK com precisão centimétrica sem necessidade de pontos de controle adicionais em campo.',
      wa: 'Olá! Gostaria de saber mais sobre o serviço de Topografia com Drone.'
    },
    'Gestão de Drenagem Urbana': {
      desc: 'Desenvolvemos estudos hidrológicos, projetos e fiscalização de sistemas de microdrenagem e macrodrenagem para controle eficiente das águas pluviais em ambientes urbanos e empreendimentos.',
      use: 'Projetos de loteamento, obras viárias, áreas industriais, condomínios e solução de problemas de alagamento.',
      benefits: 'Prevenção de enchentes, conformidade com legislação ambiental, maior vida útil das obras e valorização do empreendimento.',
      when: 'No planejamento de novos empreendimentos, obras de infraestrutura ou na solução de problemas de alagamento.',
      img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
      highlight: 'Projetos em conformidade com as normas ABNT e legislações municipais vigentes.',
      wa: 'Olá! Gostaria de saber mais sobre o serviço de Gestão de Drenagem Urbana.'
    },
    'Laser Scanner Terrestre': {
      desc: 'Tecnologia de captura 3D de alta densidade que gera nuvem de pontos precisa de estruturas e ambientes. Ideal para documentação, engenharia reversa e modelagem BIM com máxima fidelidade.',
      use: 'Retrofit de edificações, patrimônio histórico, plantas industriais, obras civis e projetos de modelagem BIM.',
      benefits: 'Alta precisão sem contato físico, documentação completa e detalhada, redução de retrabalho e integração com softwares BIM.',
      when: 'Para modernização de instalações, documentação de estruturas existentes, projetos de retrofit ou BIM.',
      img: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=800&q=80',
      highlight: 'Nuvem de pontos com alta densidade para máxima fidelidade na documentação de estruturas.',
      wa: 'Olá! Gostaria de saber mais sobre o serviço de Laser Scanner Terrestre.'
    }
  };

  const svcOverlay = document.getElementById('svc-modal');
  if (svcOverlay) {
    const svcTitle    = document.getElementById('svc-modal-title');
    const svcIcon     = document.getElementById('svc-icon');
    const svcDesc     = document.getElementById('svc-desc');
    const svcUse      = document.getElementById('svc-use');
    const svcBenefits = document.getElementById('svc-benefits');
    const svcWhen     = document.getElementById('svc-when');
    const svcImg      = document.getElementById('svc-img');
    const svcHlight   = document.getElementById('svc-highlight-text');
    const svcWaBtn    = document.getElementById('svc-wa-btn');

    function openSvc(article) {
      const title = article.querySelector('h3').textContent.trim();
      const d = SVC_DATA[title];
      if (!d) return;
      svcTitle.textContent    = title;
      svcIcon.innerHTML       = article.querySelector('.icon').innerHTML;
      svcDesc.textContent     = d.desc;
      svcUse.textContent      = d.use;
      svcBenefits.textContent = d.benefits;
      svcWhen.textContent     = d.when;
      svcImg.src              = d.img;
      svcImg.alt              = title;
      svcHlight.textContent   = d.highlight;
      svcWaBtn.href = 'https://wa.me/553499166794?text=' + encodeURIComponent(d.wa);
      svcOverlay.classList.add('open');
      svcOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      svcOverlay.querySelector('.svc-modal-box').scrollTop = 0;
    }

    function closeSvc() {
      svcOverlay.classList.remove('open');
      svcOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.service .more').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openSvc(btn.closest('.service'));
      });
    });

    svcOverlay.querySelector('.svc-close').addEventListener('click', closeSvc);
    svcOverlay.querySelector('.svc-proj-btn').addEventListener('click', closeSvc);
    svcOverlay.addEventListener('click', (e) => { if (e.target === svcOverlay) closeSvc(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && svcOverlay.classList.contains('open')) closeSvc();
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
