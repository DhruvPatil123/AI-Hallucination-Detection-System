document.addEventListener('DOMContentLoaded', () => {

  // --- Tab switching (generic) ---
  function initTabs(barId, copyBtnId) {
    const bar = document.getElementById(barId);
    if (!bar) return;
    bar.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        bar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.tab;
        // find sibling tab panes in parent container
        const container = bar.closest('[style]') || bar.parentElement;
        container.querySelectorAll('.tab-pane').forEach(p => {
          p.classList.toggle('active', p.id === target);
        });
      });
    });
  }

  initTabs('sdk-tabs');
  initTabs('verify-tabs');

  // --- Copy buttons ---
  function setupCopyBtn(btn) {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.copy;
      let text = '';
      if (targetId) {
        const el = document.getElementById(targetId);
        text = el ? (el.innerText || el.textContent) : '';
      } else {
        // find nearest code-block sibling
        const block = btn.parentElement.querySelector('.code-block, .tab-pane.active .code-block');
        text = block ? (block.innerText || block.textContent) : '';
      }
      if (!text) return;
      navigator.clipboard.writeText(text.trim()).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
      });
    });
  }

  document.querySelectorAll('.copy-btn').forEach(setupCopyBtn);

  // --- Scroll spy for sidebar ---
  const sidebarLinks = document.querySelectorAll('.docs-sidebar-link[data-target]');
  const sections = [];
  sidebarLinks.forEach(link => {
    const el = document.getElementById(link.dataset.target);
    if (el) sections.push({ el, link });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const match = sections.find(s => s.el === entry.target);
        if (match) match.link.classList.add('active');
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s.el));

  // --- Smooth scroll for sidebar clicks ---
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});
