// ==================== MOCK DATA ====================
const CATEGORIES = ['factual','citation','logical','numerical','temporal'];
const CAT_COLORS = { factual:'#ef4444', citation:'#f97316', logical:'#eab308', numerical:'#a855f7', temporal:'#3b82f6' };
const RISK_COLORS = { low:'#22d3a0', medium:'#f59e0b', high:'#f97316', critical:'#ef4444' };
const MODELS = ['gpt-4o','claude-3.5','gemini-pro','llama-3-70b','mistral-large','phi-3-medium'];
const INTEGRATIONS = [
  { name:'Legal Research Hub', status:'ok',  calls:'12,847', domain:'legal' },
  { name:'MedAssist AI',       status:'ok',  calls:'8,302',  domain:'medical' },
  { name:'FinReport Bot',      status:'warn',calls:'5,119',  domain:'financial' },
  { name:'CX Support Agent',   status:'ok',  calls:'19,443', domain:'general' },
  { name:'Dev Copilot',        status:'ok',  calls:'3,871',  domain:'technical' },
  { name:'Content Studio',     status:'err', calls:'741',    domain:'general' },
];

const WEEK_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const WEEK_DATA   = [18.2, 21.5, 19.8, 24.1, 22.7, 17.3, 20.6];

const CAT_PCT = { factual:38, citation:22, logical:15, numerical:17, temporal:8 };
const RISK_DIST = { low:41, medium:28, high:20, critical:11 };

function rnd(min, max) { return min + Math.random() * (max - min); }
function rndInt(min, max) { return Math.floor(rnd(min, max)); }
function riskFromScore(s) {
  if (s < 0.3) return 'low'; if (s < 0.6) return 'medium'; if (s < 0.8) return 'high'; return 'critical';
}
function fmtTime(d) {
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0') + ':' + d.getSeconds().toString().padStart(2,'0');
}

// ==================== STAT CARDS ====================
function animateCounter(el, target, decimals, suffix, delay) {
  if (!el) return;
  setTimeout(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1500, 1);
      const ease = 1 - Math.pow(2, -10 * p);
      el.textContent = (ease * target).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals) + suffix;
    };
    requestAnimationFrame(step);
  }, delay);
}

// ==================== LINE CHART ====================
function drawLineChart(canvasId, labels, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width  = rect.width  * dpr;
  canvas.height = (canvas.getAttribute('height') || 180) * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width, H = parseInt(canvas.getAttribute('height')) || 180;
  const pad = { top: 20, right: 20, bottom: 36, left: 44 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top  - pad.bottom;
  const minV = Math.min(...data) * 0.85;
  const maxV = Math.max(...data) * 1.1;
  const scaleX = i => pad.left + (i / (data.length - 1)) * cW;
  const scaleY = v => pad.top  + cH - ((v - minV) / (maxV - minV)) * cH;

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (cH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke();
    const val = maxV - ((maxV - minV) / 4) * i;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(1) + '%', pad.left - 6, y + 4);
  }

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
  grad.addColorStop(0,   'rgba(0,217,255,0.25)');
  grad.addColorStop(1,   'rgba(0,217,255,0)');
  ctx.beginPath();
  ctx.moveTo(scaleX(0), scaleY(data[0]));
  for (let i = 1; i < data.length; i++) {
    const mx = (scaleX(i-1) + scaleX(i)) / 2;
    ctx.bezierCurveTo(mx, scaleY(data[i-1]), mx, scaleY(data[i]), scaleX(i), scaleY(data[i]));
  }
  ctx.lineTo(scaleX(data.length - 1), pad.top + cH);
  ctx.lineTo(scaleX(0), pad.top + cH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#00d9ff';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.moveTo(scaleX(0), scaleY(data[0]));
  for (let i = 1; i < data.length; i++) {
    const mx = (scaleX(i-1) + scaleX(i)) / 2;
    ctx.bezierCurveTo(mx, scaleY(data[i-1]), mx, scaleY(data[i]), scaleX(i), scaleY(data[i]));
  }
  ctx.stroke();

  // Dots
  data.forEach((v, i) => {
    ctx.beginPath();
    ctx.arc(scaleX(i), scaleY(v), 4, 0, Math.PI * 2);
    ctx.fillStyle = '#00d9ff';
    ctx.fill();
    ctx.strokeStyle = '#01040a';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // X labels
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '11px Plus Jakarta Sans, sans-serif';
  ctx.textAlign = 'center';
  labels.forEach((l, i) => ctx.fillText(l, scaleX(i), H - 8));
}

// ==================== DONUT CHART ====================
function drawDonut(canvasId, data, legendId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 70, cy = 70, outerR = 60, innerR = 40;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = 140 * dpr;
  canvas.height = 140 * dpr;
  ctx.scale(dpr, dpr);

  const total = Object.values(data).reduce((a,b) => a+b, 0);
  let angle = -Math.PI / 2;
  Object.entries(data).forEach(([cat, val]) => {
    const sweep = (val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = CAT_COLORS[cat];
    ctx.fill();
    angle += sweep;
  });

  // Inner hole
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = '#01040a';
  ctx.fill();

  // Center text
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = 'bold 14px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(total + '%', cx, cy + 5);

  // Legend
  const legendEl = document.getElementById(legendId);
  if (!legendEl) return;
  legendEl.innerHTML = Object.entries(data).map(([cat, pct]) => `
    <div class="legend-item">
      <div class="cat-dot ${cat}"></div>
      <span style="flex:1; color:var(--text-muted); text-transform:capitalize;">${cat}</span>
      <div class="legend-bar-wrap"><div class="legend-bar" style="width:0%; background:${CAT_COLORS[cat]};" data-w="${pct}"></div></div>
      <span class="legend-pct">${pct}%</span>
    </div>`).join('');
  // Animate bars
  setTimeout(() => {
    legendEl.querySelectorAll('.legend-bar').forEach(b => { b.style.width = b.dataset.w + '%'; });
  }, 300);
}

// ==================== RISK DISTRIBUTION ====================
function renderRiskDist(elId, data) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = Object.entries(data).map(([level, pct]) => `
    <div>
      <div style="display:flex; justify-content:space-between; margin-bottom:.35rem;">
        <span class="risk-badge ${level}">${level.toUpperCase()}</span>
        <span style="font-family:'Outfit',sans-serif; font-weight:700; color:var(--text-white);">${pct}%</span>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width:0%; background:${RISK_COLORS[level]};" data-w="${pct}"></div>
      </div>
    </div>`).join('');
  setTimeout(() => {
    el.querySelectorAll('.progress-bar-fill').forEach(b => { b.style.width = b.dataset.w + '%'; });
  }, 300);
}

// ==================== INTEGRATIONS ====================
function renderIntegrations(elId, data) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = data.map(int => `
    <div class="integration-item">
      <div class="int-status ${int.status}"></div>
      <div class="int-name">${int.name}</div>
      <div class="int-calls">${int.calls} calls</div>
    </div>`).join('');
}

// ==================== AUDIT LOG ====================
function generateAuditRows(count = 30) {
  const rows = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const score = parseFloat(rnd(0.1, 0.99).toFixed(2));
    const risk = riskFromScore(score);
    const cat  = CATEGORIES[rndInt(0, CATEGORIES.length)];
    const d    = new Date(now - i * rnd(30000, 180000));
    rows.push({ ts: d, model: MODELS[rndInt(0, MODELS.length)], score, risk, cat });
  }
  return rows;
}

let auditRows = [];
let auditFilter = 'all';
let selectedRange = '7';

function setActiveChip(groupSelector, activeBtn) {
  document.querySelectorAll(groupSelector).forEach(chip => chip.classList.remove('active'));
  activeBtn.classList.add('active');
}

function renderAudit(tbody, rows, filter) {
  if (!tbody) return;
  const filtered = filter === 'all' ? rows
    : filter === 'high' ? rows.filter(r => r.risk_level === 'high' || r.risk_level === 'critical')
    : rows.filter(r => r.risk_level === 'critical');
  tbody.innerHTML = filtered.slice(0, 20).map(r => `
    <tr>
      <td class="mono">${new Date(r.created_at).toLocaleTimeString()}</td>
      <td class="mono">${r.model_id || 'ahds-v1.0.4'}</td>
      <td style="font-family:'Outfit',sans-serif; font-weight:700; color:${RISK_COLORS[r.risk_level] || '#fff'};">${(r.hallucination_score || 0).toFixed(2)}</td>
      <td><span class="risk-badge ${r.risk_level || 'low'}">${(r.risk_level || 'low').toUpperCase()}</span></td>
      <td><span style="display:inline-flex;align-items:center;gap:.3rem;"><span class="cat-dot ${r.primary_category || 'factual'}"></span><span style="font-size:.76rem; text-transform:capitalize;">${r.primary_category || '-'}</span></span></td>
    </tr>`).join('');
}

// ==================== LIVE FEED ====================
const feedEl = document.getElementById('live-feed');
let feedCount = 0;

function addRealtimeFeedItem(log) {
  if (!feedEl) return;
  const score = log.hallucination_score || 0;
  const risk  = log.risk_level || 'low';
  const model = log.model_id || 'ahds-v1.0.4';
  const color = RISK_COLORS[risk] || '#fff';
  const item  = document.createElement('div');
  item.className = 'feed-item';
  item.innerHTML = `
    <span class="feed-time">${fmtTime(new Date(log.created_at))}</span>
    <span class="feed-model">${model}</span>
    <span class="feed-score" style="color:${color};">${score.toFixed(2)}</span>
    <span class="risk-badge ${risk}">${risk}</span>`;
  feedEl.insertBefore(item, feedEl.firstChild);
  feedCount++;
  if (feedCount > 40) feedEl.removeChild(feedEl.lastChild);
}

  // ==================== SIDEBAR NAVIGATION ====================
  function setupSidebarNavigation() {
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active from all links, add to clicked
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const targetId = link.dataset.target;
        if (!targetId) return; // No target defined

        // Placeholder sections show a toast or could open modals later
        if (['export-section', 'alert-section'].includes(targetId)) {
          if (typeof showToast === 'function') {
            showToast(`${link.textContent.trim()} — coming soon`, 'info');
          }
          return;
        }

        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          const headerOffset = 90;
          const elTop = targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({ top: elTop, behavior: 'smooth' });
        }
      });
    });
  }

  // ==================== LIVE FEED AUTO-SCROLL ====================
  function scrollFeedToTop() {
    if (feedEl) feedEl.scrollTop = 0;
  }

  // ==================== INIT ====================
  document.addEventListener('DOMContentLoaded', async () => {
    setupSidebarNavigation();

    const auditTbody = document.getElementById('audit-tbody');

    // Audit filter chips
  ['all','high','crit'].forEach(f => {
    const btn = document.getElementById(`af-${f}`);
    if (!btn) return;
    btn.addEventListener('click', () => {
      setActiveChip('[id^="af-"]', btn);
      auditFilter = f;
      renderAudit(auditTbody, auditRows, f);
    });
  });

  // Range toggle redraws chart
  document.getElementById('range-7')?.addEventListener('click', (e) => {
    selectedRange = '7';
    setActiveChip('[id^="range-"]', e.currentTarget);
    drawLineChart('line-chart', WEEK_LABELS, WEEK_DATA);
  });
  document.getElementById('range-30')?.addEventListener('click', (e) => {
    selectedRange = '30';
    setActiveChip('[id^="range-"]', e.currentTarget);
    const labels30 = Array.from({length: 30}, (_, i) => i % 5 === 0 ? `D${i+1}` : '');
    const data30   = Array.from({length: 30}, () => parseFloat(rnd(14, 28).toFixed(1)));
    drawLineChart('line-chart', labels30, data30);
  });

  // Redraw on resize
  window.addEventListener('resize', () => {
    if (selectedRange === '30') {
      const labels30 = Array.from({length: 30}, (_, i) => i % 5 === 0 ? `D${i+1}` : '');
      const data30   = Array.from({length: 30}, () => parseFloat(rnd(14, 28).toFixed(1)));
      drawLineChart('line-chart', labels30, data30);
      return;
    }
    drawLineChart('line-chart', WEEK_LABELS, WEEK_DATA);
  });

  // Check auth before loading real data
  const session = typeof requireAuth === 'function' ? await requireAuth() : null;
  if (!session && typeof requireAuth === 'function') {
    console.warn('[Dashboard] No auth session — skipping data load');
    return;
  }

  if (typeof supabase === 'undefined' || !isSupabaseConfigured()) {
    console.warn('Supabase not configured. Dashboard will not load real data.');
    return;
  }

  const userId = session.user.id;

  try {
    // 1. Fetch aggregate stats
    const { data: stats } = await supabase.from('dashboard_stats').select('*').eq('user_id', userId).single();
    if (stats) {
      document.getElementById('s-rate').textContent = (stats.detection_rate || 0) + '%';
      document.getElementById('s-lat').textContent = (stats.avg_latency_ms || 0) + 'ms';
      document.getElementById('s-lat99').textContent = (stats.p99_latency_ms || 0) + 'ms';
    } else {
      document.getElementById('s-rate').textContent = '0%';
      document.getElementById('s-lat').textContent = '0ms';
      document.getElementById('s-lat99').textContent = '0ms';
    }
    // Hardcode some for now as they require more complex queries
    document.getElementById('s-fpr').textContent = '2.1%';
    document.getElementById('s-uptime').textContent = '99.98%';

    // 2. Fetch Category Breakdown
    const { data: catData } = await supabase.from('category_breakdown').select('*').eq('user_id', userId);
    let catObj = { factual:0, citation:0, logical:0, numerical:0, temporal:0 };
    if (catData && catData.length > 0) {
      catData.forEach(c => { catObj[c.category] = parseFloat(c.percentage); });
    }
    drawDonut('donut-chart', catObj, 'donut-legend');

    // 3. Fetch Risk Distribution
    const { data: riskData } = await supabase.from('risk_distribution').select('*').eq('user_id', userId);
    let riskObj = { low:0, medium:0, high:0, critical:0 };
    if (riskData && riskData.length > 0) {
      riskData.forEach(r => { riskObj[r.risk_level] = parseFloat(r.percentage); });
    }
    renderRiskDist('risk-dist', riskObj);

    // 4. Fetch Audit Logs
    const { data: logs } = await supabase.from('audit_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30);
    if (logs) {
       auditRows = logs;
       renderAudit(document.getElementById('audit-tbody'), auditRows, 'all');
       
       // Populate initial live feed
       const reversedLogs = [...logs].reverse().slice(0, 8);
       reversedLogs.forEach(log => addRealtimeFeedItem(log));
    }

    // 5. Line Chart (Mock for now until we have daily aggregation)
    drawLineChart('line-chart', WEEK_LABELS, WEEK_DATA);
    
    // 6. Integrations (Mock)
    renderIntegrations('integrations-list', INTEGRATIONS);

    // 7. Supabase Realtime Subscription
    supabase.channel('dashboard-audit')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs', filter: `user_id=eq.${userId}` }, payload => {
          addRealtimeFeedItem(payload.new);
          auditRows.unshift(payload.new);
          renderAudit(document.getElementById('audit-tbody'), auditRows, auditFilter);
      })
      .subscribe();

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  });
};
