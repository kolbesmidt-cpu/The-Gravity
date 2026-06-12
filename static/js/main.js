/* ============================================================
   THE GRAVITY — UI motion & interactivity
   Hero entrance, word rotator, scroll reveals, counters,
   card glow tracking, mobile nav, and the contact form.
   ============================================================ */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();
    initTheme();
    initNav();
    initRotator();
    initReveals();
    initCounters();
    initCardGlow();
    initForm();
    initPreloader(initHero); // play hero entrance once the intro finishes
  });

  /* ---------- Light / dark theme toggle ---------- */
  function initTheme() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const root = document.documentElement;
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      localStorage.setItem('gravity-theme', next);
      // let the 3D background adapt its colors
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
    });
  }

  /* ---------- Opening animation ---------- */
  function initPreloader(onDone) {
    const pre = document.getElementById('preloader');
    if (!pre) { onDone && onDone(); return; }

    const fill = document.getElementById('preloaderFill');
    const count = document.getElementById('preloaderCount');
    const letters = document.querySelectorAll('.preloader-name span');

    const finish = () => {
      pre.classList.add('done');
      onDone && onDone();
      // free the node after it fades out
      setTimeout(() => pre.remove(), 900);
    };

    if (reduced) { finish(); return; }

    // Stagger the brand letters in.
    letters.forEach((l, idx) => { l.style.animationDelay = `${0.15 + idx * 0.05}s`; });

    // Animate the loading counter from 0 -> 100.
    const duration = 1700;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const pct = Math.round(eased * 100);
      if (count) count.textContent = pct;
      if (fill) fill.style.width = pct + '%';
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(finish, 350);
      }
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Navbar: scrolled state + mobile toggle ---------- */
  function initNav() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('navToggle');
    const links = document.querySelector('.nav-links');

    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (toggle && links) {
      toggle.addEventListener('click', () => links.classList.toggle('open'));
      links.querySelectorAll('a').forEach((a) =>
        a.addEventListener('click', () => links.classList.remove('open'))
      );
    }
  }

  /* ---------- Hero entrance animation ---------- */
  function initHero() {
    const lines = document.querySelectorAll('.hero-title .line');
    const fadeIns = document.querySelectorAll(
      '.hero-eyebrow, .hero-sub, .hero-actions, .rotator'
    );

    if (reduced || !hasGSAP) {
      lines.forEach((l) => (l.style.opacity = 1));
      fadeIns.forEach((el) => el.classList.remove('reveal'));
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from(lines, {
      yPercent: 120, opacity: 0, duration: 1, stagger: 0.12, skewY: 6,
    });
    fadeIns.forEach((el) => el.classList.remove('reveal'));
    tl.from(fadeIns, {
      y: 24, opacity: 0, duration: 0.8, stagger: 0.12,
    }, '-=0.5');
  }

  /* ---------- Rotating hero words ---------- */
  function initRotator() {
    const wrap = document.getElementById('rotatorWords');
    if (!wrap) return;
    const words = Array.from(wrap.children);
    if (!words.length) return;

    let i = 0;
    words.forEach((w, idx) => {
      w.style.position = 'absolute';
      w.style.transition = 'transform .6s cubic-bezier(.5,0,.2,1), opacity .6s';
      w.style.transform = idx === 0 ? 'translateY(0)' : 'translateY(110%)';
      w.style.opacity = idx === 0 ? '1' : '0';
    });

    if (reduced) return;
    setInterval(() => {
      const current = words[i];
      i = (i + 1) % words.length;
      const next = words[i];
      current.style.transform = 'translateY(-110%)';
      current.style.opacity = '0';
      next.style.transform = 'translateY(110%)';
      // force reflow so the entrance animates
      void next.offsetWidth;
      next.style.transition = 'none';
      requestAnimationFrame(() => {
        next.style.transition = 'transform .6s cubic-bezier(.5,0,.2,1), opacity .6s';
        next.style.transform = 'translateY(0)';
        next.style.opacity = '1';
      });
    }, 2200);
  }

  /* ---------- Scroll reveal for .reveal elements ---------- */
  function initReveals() {
    const items = document.querySelectorAll('.reveal');
    if (reduced) {
      items.forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
      return;
    }

    if (hasGSAP && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      items.forEach((el) => {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });
      return;
    }

    // Fallback: IntersectionObserver
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.style.transition = 'opacity .8s ease, transform .8s ease';
          e.target.style.opacity = 1;
          e.target.style.transform = 'none';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Animated stat counters ---------- */
  function initCounters() {
    const nums = document.querySelectorAll('.stat-num');
    const run = (el) => {
      const target = +el.dataset.target;
      if (reduced) { el.textContent = target; return; }
      const dur = 1600;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach((n) => io.observe(n));
  }

  /* ---------- Card hover glow follows the cursor ---------- */
  function initCardGlow() {
    document.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Contact form -> Flask API ---------- */
  function initForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const status = document.getElementById('formStatus');
    const btn = document.getElementById('submitBtn');

    const clearErrors = () =>
      form.querySelectorAll('.error').forEach((s) => (s.textContent = ''));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();
      status.textContent = '';
      status.className = 'form-status';

      const payload = {
        name: form.name.value,
        email: form.email.value,
        message: form.message.value,
      };

      btn.disabled = true;
      btn.querySelector('.btn-label').textContent = 'Transmitting…';

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (res.ok && data.ok) {
          status.textContent = data.message;
          status.classList.add('ok');
          form.reset();
        } else if (data.errors) {
          Object.entries(data.errors).forEach(([field, msg]) => {
            const el = form.querySelector(`.error[data-for="${field}"]`);
            if (el) el.textContent = msg;
          });
          status.textContent = 'Please fix the highlighted fields.';
          status.classList.add('bad');
        } else {
          throw new Error('Unexpected response');
        }
      } catch (err) {
        status.textContent = 'Transmission failed — please try again.';
        status.classList.add('bad');
      } finally {
        btn.disabled = false;
        btn.querySelector('.btn-label').textContent = 'Send transmission';
      }
    });
  }
})();
