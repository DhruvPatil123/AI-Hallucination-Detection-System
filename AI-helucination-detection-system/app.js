document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Hero Text Reveal ---
  const heroTitle = document.getElementById('hero-title');
  if (heroTitle) {
    const text = heroTitle.textContent;
    heroTitle.textContent = '';
    text.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.className = 'char';
      heroTitle.appendChild(span);
      setTimeout(() => span.classList.add('visible'), 500 + i * 38);
    });
  }

  // --- 2. Generic Counter Animation ---
  function animateCounter(el, target, decimals = 0, duration = 2000, delay = 0) {
    if (!el) return;
    setTimeout(() => {
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const ease = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = (ease * target).toFixed(decimals);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(decimals);
      };
      requestAnimationFrame(step);
    }, delay);
  }

  animateCounter(document.getElementById('hero-stat'), 99.9, 1, 2200, 1000);
  animateCounter(document.getElementById('m-precision'), 90, 0, 1800, 600);
  animateCounter(document.getElementById('m-recall'), 85, 0, 1800, 800);
  animateCounter(document.getElementById('m-latency'), 142, 0, 1600, 1000);
  animateCounter(document.getElementById('m-uptime'), 99.9, 1, 2000, 1200);
  animateCounter(document.getElementById('m-integrations'), 12, 0, 1400, 1400);

  // --- 3. Process Line Animation ---
  const processSection = document.getElementById('process');
  const processLine = document.querySelector('.process-line');
  if (processSection && processLine) {
    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setTimeout(() => { processLine.style.width = '90%'; }, 300);
        }
      });
    }, { threshold: 0.3 }).observe(processSection);
  }

  // --- 4. Pricing Toggle ---
  const billingSwitch = document.getElementById('billing-switch');
  const labelMonthly  = document.getElementById('label-monthly');
  const labelAnnual   = document.getElementById('label-annual');
  const amounts       = document.querySelectorAll('.amount');
  let isAnnual = true;

  if (billingSwitch) {
    billingSwitch.addEventListener('click', () => {
      isAnnual = !isAnnual;
      const circle = billingSwitch.querySelector('.toggle-circle');
      if (isAnnual) {
        circle.style.transform = 'translateX(0px)';
        labelAnnual.classList.add('active'); labelMonthly.classList.remove('active');
      } else {
        circle.style.transform = 'translateX(26px)';
        labelMonthly.classList.add('active'); labelAnnual.classList.remove('active');
      }
      amounts.forEach(a => {
        a.style.opacity = '0'; a.style.transform = 'translateY(-8px)';
        setTimeout(() => {
          a.textContent = isAnnual ? a.getAttribute('data-annual') : a.getAttribute('data-monthly');
          a.style.transition = 'opacity .3s, transform .3s';
          a.style.opacity = '1'; a.style.transform = 'translateY(0)';
        }, 250);
      });
    });
  }

  // --- 5. Testimonial Marquee + Stars ---
  const marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeTrack) {
    Array.from(marqueeTrack.children).forEach(item => marqueeTrack.appendChild(item.cloneNode(true)));
  }
  const starObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const c = e.target, rating = parseInt(c.getAttribute('data-rating') || 5);
        c.innerHTML = '';
        for (let i = 0; i < 5; i++) {
          const s = document.createElement('span');
          s.className = 'star';
          s.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
          c.appendChild(s);
          if (i < rating) setTimeout(() => s.classList.add('filled'), i * 140);
        }
        starObs.unobserve(c);
      }
    });
  }, { threshold: 0.5, rootMargin: '0px 100px 0px 100px' });
  document.querySelectorAll('.stars').forEach(c => starObs.observe(c));

  // --- 6. API Response Teaser (typing animation) ---
  const teaserEl = document.getElementById('teaser-json');
  if (teaserEl) {
    const lines = [
      `<span class="tj-key">"request_id"</span>: <span class="tj-str">"req_8f4a2c91"</span>,`,
      `<span class="tj-key">"hallucination_score"</span>: <span class="tj-num">0.82</span>,`,
      `<span class="tj-key">"risk_level"</span>: <span class="tj-str">"high"</span>,`,
      `<span class="tj-key">"flagged_spans"</span>: [`,
      `  {`,
      `    <span class="tj-key">"start"</span>: <span class="tj-num">42</span>, <span class="tj-key">"end"</span>: <span class="tj-num">98</span>,`,
      `    <span class="tj-key">"text"</span>: <span class="tj-str">"Aspirin 1200mg is the standard..."</span>,`,
      `    <span class="tj-key">"category"</span>: <span class="tj-cat">"numerical"</span>,`,
      `    <span class="tj-key">"confidence"</span>: <span class="tj-num">0.94</span>,`,
      `    <span class="tj-key">"evidence"</span>: <span class="tj-str">"Standard adult dose is 325–650mg"</span>`,
      `  }`,
      `],`,
      `<span class="tj-key">"processing_time_ms"</span>: <span class="tj-num">138</span>,`,
      `<span class="tj-key">"model_version"</span>: <span class="tj-str">"ahds-v1.0.4"</span>`,
    ];

    const cursor = '<span class="cursor-blink"></span>';
    let current = '';
    teaserEl.innerHTML = '{\n' + cursor;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          obs.disconnect();
          let lineIdx = 0;
          function typeLine() {
            if (lineIdx >= lines.length) {
              teaserEl.innerHTML = '{\n' + lines.map(l => '  ' + l).join('\n') + '\n}';
              return;
            }
            current += '  ' + lines[lineIdx] + '\n';
            teaserEl.innerHTML = '{\n' + current + cursor + '}';
            lineIdx++;
            setTimeout(typeLine, 180);
          }
          setTimeout(typeLine, 400);
        }
      });
    }, { threshold: 0.4 });
    obs.observe(teaserEl);
  }
});
