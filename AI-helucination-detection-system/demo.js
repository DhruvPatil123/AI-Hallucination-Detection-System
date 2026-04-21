// ==================== DEMO DATA ====================
const EXAMPLES = {
  medical: {
    domain: 'medical',
    text: `The recommended dosage of aspirin for acute myocardial infarction is 1200mg administered intravenously, according to the 2019 ACC/AHA guidelines published in the New England Journal of Medicine by Dr. Harold Simmons et al. Patients with aspirin hypersensitivity should be given clopidogrel 150mg as a substitute. Ibuprofen is also a suitable first-line antiplatelet agent in this context. The treatment window is 48 hours from symptom onset, and beta-blockers should always be administered concurrently within the first 30 minutes.`,
    spans: [
      { start: 53, end: 73, text: '1200mg administered intravenously', category: 'numerical', confidence: 0.96, evidence: 'Standard acute MI dose is 162–325mg chewed orally, not 1200mg IV.' },
      { start: 110, end: 148, text: 'published in the New England Journal of Medicine by Dr. Harold Simmons et al', category: 'citation', confidence: 0.89, evidence: 'No such publication by Dr. Harold Simmons found in NEJM or ACC/AHA 2019 guidelines.' },
      { start: 215, end: 262, text: 'Ibuprofen is also a suitable first-line antiplatelet agent', category: 'factual', confidence: 0.97, evidence: 'Ibuprofen is an NSAID, not an antiplatelet agent, and is contraindicated in MI due to increased cardiovascular risk.' },
      { start: 330, end: 363, text: 'treatment window is 48 hours from symptom onset', category: 'temporal', confidence: 0.82, evidence: 'Reperfusion is most effective within 12 hours; 48 hours is not the standard treatment window.' },
    ]
  },
  legal: {
    domain: 'legal',
    text: `In Johnson v. Microsoft Corp. (2021), the Supreme Court unanimously ruled that software algorithms are not patentable under 35 U.S.C. § 101, effectively overturning Alice Corp. v. CLS Bank (2014). The ruling was authored by Justice Sandra Day O'Connor and cited the Bilski framework extensively. This decision means all software patents filed after January 2022 are automatically invalidated. Furthermore, the Court confirmed that open-source licenses constitute binding contracts under federal law in all 52 U.S. states.`,
    spans: [
      { start: 3, end: 35, text: 'Johnson v. Microsoft Corp. (2021)', category: 'citation', confidence: 0.98, evidence: 'No such Supreme Court case exists. Johnson v. Microsoft Corp. is not found in SCOTUS records.' },
      { start: 99, end: 143, text: 'effectively overturning Alice Corp. v. CLS Bank (2014)', category: 'factual', confidence: 0.91, evidence: 'Alice Corp. v. CLS Bank has not been overturned; it remains controlling precedent as of 2024.' },
      { start: 160, end: 187, text: 'Justice Sandra Day O\'Connor', category: 'factual', confidence: 0.99, evidence: 'Sandra Day O\'Connor retired in 2006 and passed away in 2023. She could not author a 2021 opinion.' },
      { start: 290, end: 342, text: 'all software patents filed after January 2022 are automatically invalidated', category: 'logical', confidence: 0.88, evidence: 'No blanket invalidation of software patents occurred; each patent is subject to individual review.' },
      { start: 400, end: 430, text: 'all 52 U.S. states', category: 'numerical', confidence: 0.99, evidence: 'The United States has 50 states, not 52.' },
    ]
  },
  financial: {
    domain: 'financial',
    text: `Apple Inc. reported Q3 2023 revenue of $89.5 billion, representing a 28% year-over-year increase, driven primarily by iPhone sales growth of 45%. The company's net income for the quarter was $24.2 billion. CEO Tim Cook announced a $120 billion share buyback program, the largest in corporate history, surpassing Saudi Aramco's 2022 buyback of $90 billion. Apple's market capitalization briefly exceeded $4.2 trillion during after-hours trading on August 15th, 2023, making it the first company to reach this milestone.`,
    spans: [
      { start: 60, end: 81, text: '28% year-over-year increase', category: 'numerical', confidence: 0.85, evidence: 'Apple Q3 2023 revenue declined approximately 1% YoY; a 28% increase is not supported by filings.' },
      { start: 120, end: 143, text: 'iPhone sales growth of 45%', category: 'numerical', confidence: 0.87, evidence: 'iPhone revenue grew approximately 2.4% in Q3 2023, not 45%.' },
      { start: 232, end: 273, text: 'the largest in corporate history, surpassing Saudi Aramco\'s 2022 buyback of $90 billion', category: 'factual', confidence: 0.79, evidence: 'Apple has previously announced larger buybacks. Saudi Aramco $90B comparison is unverified.' },
      { start: 330, end: 365, text: 'exceeded $4.2 trillion during after-hours trading', category: 'numerical', confidence: 0.93, evidence: 'Apple\'s market cap has not exceeded $4.2 trillion; peak was approximately $3 trillion.' },
    ]
  },
  technical: {
    domain: 'technical',
    text: `React 19 introduced the new useComputed hook, which automatically memoizes expensive computations without the need for useMemo. The hook was co-authored by Dan Abramov and Sophie Albers-Brown in RFC-0047. In React 19, the virtual DOM was completely removed and replaced with a direct DOM diffing algorithm called FastPatch, reducing bundle size by 60%. Additionally, React now natively supports WebAssembly components via the import wasm syntax, allowing Rust functions to be called directly from JSX.`,
    spans: [
      { start: 17, end: 34, text: 'useComputed hook', category: 'factual', confidence: 0.91, evidence: 'React 19 does not include a useComputed hook. React 19 introduced use(), useFormStatus(), and compiler optimizations.' },
      { start: 110, end: 150, text: 'co-authored by Dan Abramov and Sophie Albers-Brown in RFC-0047', category: 'citation', confidence: 0.88, evidence: 'RFC-0047 does not exist in the React RFC repository. Sophie Albers-Brown is not a known React team member.' },
      { start: 183, end: 255, text: 'virtual DOM was completely removed and replaced with a direct DOM diffing algorithm called FastPatch', category: 'factual', confidence: 0.95, evidence: 'React 19 did not remove the virtual DOM. The React compiler optimizes rendering but VDOM remains.' },
      { start: 360, end: 420, text: 'natively supports WebAssembly components via the import wasm syntax', category: 'factual', confidence: 0.92, evidence: 'React does not have native WASM component support. WASM integration requires separate tooling.' },
    ]
  },
  factual: {
    domain: 'general',
    text: `The Great Wall of China was built in 221 BC by Emperor Qin Shi Huang and was completed in just 15 years using a workforce of 300,000 soldiers. It stretches exactly 13,170 miles in total length. The wall is visible from space with the naked eye, a fact confirmed by NASA astronauts during the Apollo 11 mission in 1969. Christopher Columbus was the first European to set foot on the American mainland in 1488, and he named the continent "Columbia" after himself before his death in 1510.`,
    spans: [
      { start: 67, end: 112, text: 'completed in just 15 years using a workforce of 300,000 soldiers', category: 'factual', confidence: 0.82, evidence: 'The wall took centuries of construction across multiple dynasties; workforce estimates vary 500k–1M including laborers and prisoners.' },
      { start: 131, end: 152, text: 'exactly 13,170 miles in total length', category: 'numerical', confidence: 0.78, evidence: 'Official Chinese survey (2012) measured 13,171 miles, but precision varies; claiming "exactly" is misleading.' },
      { start: 165, end: 220, text: 'visible from space with the naked eye, a fact confirmed by NASA astronauts during the Apollo 11 mission', category: 'factual', confidence: 0.97, evidence: 'NASA and multiple astronauts confirm the wall is NOT visible from space unaided. Apollo 11 did not orbit Earth.' },
      { start: 260, end: 310, text: 'Christopher Columbus was the first European to set foot on the American mainland in 1488', category: 'factual', confidence: 0.95, evidence: 'Columbus first reached the Americas in 1492 (Caribbean islands, not mainland). Leif Erikson reached North America c. 1000 AD.' },
    ]
  }
};

// ==================== UTILITIES ====================
function riskLevel(score) {
  if (score < 0.3) return 'low';
  if (score < 0.6) return 'medium';
  if (score < 0.8) return 'high';
  return 'critical';
}

function riskColor(level) {
  return { low: '#22d3a0', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }[level];
}

function catColor(cat) {
  return { factual: '#ef4444', citation: '#f97316', logical: '#eab308', numerical: '#a855f7', temporal: '#3b82f6' }[cat] || '#888';
}

function truncate(text, max = 60) {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function syntaxHL(json) {
  return JSON.stringify(json, null, 2)
    .replace(/("[\w_]+")\s*:/g, '<span class="key">$1</span>:')
    .replace(/:\s*(".*?")/g, ': <span class="str">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="num">$1</span>')
    .replace(/:\s*(true|false|null)/g, ': <span class="bool">$1</span>');
}

// ==================== MAIN LOGIC ====================
let currentVerificationId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check auth only if Supabase is configured and will be used for live detection
  if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
    const session = typeof requireAuth === 'function' ? await requireAuth() : null;
    if (!session) return;
  }

  const inputEl      = document.getElementById('input-text');
  const charCount    = document.getElementById('char-count');
  const threshSlider = document.getElementById('threshold-slider');
  const threshVal    = document.getElementById('threshold-val');
  const domainSel    = document.getElementById('domain-select');
  const analyzeBtn   = document.getElementById('analyze-btn');
  const btnText      = document.getElementById('btn-text');
  const pipelineCard = document.getElementById('pipeline-card');
  const resultsPanel = document.getElementById('results-panel');
  const annotatedOut = document.getElementById('annotated-output');
  const spansCard    = document.getElementById('spans-card');
  const spansTbody   = document.getElementById('spans-tbody');
  const rawJson      = document.getElementById('raw-json');
  const copyJsonBtn  = document.getElementById('copy-json-btn');
  const tooltip      = document.getElementById('span-tooltip');
  const gaugeFill    = document.getElementById('gauge-fill');
  const gaugeLabel   = document.getElementById('gauge-label');
  const riskBadge    = document.getElementById('risk-badge');
  const spanCount    = document.getElementById('span-count');
  const procTime     = document.getElementById('processing-time');

  // Char counter
  inputEl.addEventListener('input', () => { charCount.textContent = inputEl.value.length + ' chars'; });

  // Threshold slider
  threshSlider.addEventListener('input', () => { threshVal.textContent = (threshSlider.value / 100).toFixed(2); });

  // Example chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const key = chip.dataset.example;
      const ex = EXAMPLES[key];
      if (ex) {
        inputEl.value = ex.text;
        charCount.textContent = ex.text.length + ' chars';
        domainSel.value = ex.domain;
      }
    });
  });

  // Animate pipeline step
  function setPipeline(active) {
    for (let i = 0; i < 5; i++) {
      const dot = document.getElementById(`pd-${i}`);
      const con = document.getElementById(`pc-${i}`);
      dot.classList.remove('active', 'done');
      if (con) con.classList.remove('done');
      if (i < active) { dot.classList.add('done'); if (con) con.classList.add('done'); }
      else if (i === active) dot.classList.add('active');
    }
  }

  // Animate gauge
  function setGauge(score) {
    const circ = 2 * Math.PI * 55; // 345.6
    const offset = circ * (1 - score);
    const level = riskLevel(score);
    const color = riskColor(level);
    gaugeFill.style.strokeDashoffset = offset;
    gaugeFill.style.stroke = color;
    // animate label
    let cur = 0;
    const target = score;
    const step = () => {
      cur = Math.min(cur + 0.02, target);
      gaugeLabel.textContent = cur.toFixed(2);
      if (cur < target) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Build annotated HTML
  function buildAnnotated(text, spans, threshold) {
    const filtered = spans.filter(s => s.confidence >= threshold);
    if (filtered.length === 0) return `<p style="color:var(--text-muted);">${text}</p>`;

    // sort by start
    filtered.sort((a, b) => a.start - b.start);

    let html = '';
    let cursor = 0;
    for (const span of filtered) {
      if (span.start > cursor) html += escapeHTML(text.slice(cursor, span.start));
      const enc = encodeURIComponent(JSON.stringify({ cat: span.category, conf: span.confidence, ev: span.evidence }));
      html += `<span class="span-highlight span-${span.category}" data-info="${enc}">${escapeHTML(span.text)}</span>`;
      cursor = span.end;
    }
    if (cursor < text.length) html += escapeHTML(text.slice(cursor));
    return `<p style="line-height:1.9;">${html}</p>`;
  }

  function escapeHTML(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // Tooltip logic
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('.span-highlight');
    if (!el) { tooltip.classList.remove('visible'); return; }
    try {
      const info = JSON.parse(decodeURIComponent(el.dataset.info));
      document.getElementById('tt-cat').textContent = info.cat.toUpperCase();
      document.getElementById('tt-cat').style.color = catColor(info.cat);
      document.getElementById('tt-conf').textContent = `Confidence: ${(info.conf * 100).toFixed(0)}%`;
      document.getElementById('tt-ev').textContent = info.ev || 'No evidence available.';
      tooltip.classList.add('visible');
    } catch(_) {}
  });

  document.addEventListener('mousemove', (e) => {
    tooltip.style.left = (e.clientX + 15) + 'px';
    tooltip.style.top  = (e.clientY - 10) + 'px';
  });

  document.addEventListener('mouseout', (e) => {
    if (!e.target.closest('.span-highlight')) tooltip.classList.remove('visible');
  });

  // Copy JSON
  copyJsonBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(rawJson.innerText || rawJson.textContent).then(() => {
      copyJsonBtn.textContent = 'Copied!';
      copyJsonBtn.classList.add('copied');
      setTimeout(() => { copyJsonBtn.textContent = 'Copy'; copyJsonBtn.classList.remove('copied'); }, 2000);
    });
  });

  // ===== Main analysis flow =====
  analyzeBtn.addEventListener('click', async () => {
    const text = inputEl.value.trim();
    if (!text) { inputEl.focus(); return; }

    const threshold = threshSlider.value / 100;

    // Disable button, show pipeline
    analyzeBtn.disabled = true;
    btnText.textContent = 'Analyzing…';
    pipelineCard.style.display = 'block';
    resultsPanel.style.display = 'none';
    spansCard.style.display = 'none';
    annotatedOut.innerHTML = '<div class="placeholder-msg"><p>Running verification pipeline…</p></div>';

    // Start pipeline animation
    let pipelineInterval = setInterval(() => {
        const currentActive = Array.from(document.querySelectorAll('.pipeline-dot')).findIndex(d => d.classList.contains('active'));
        if (currentActive < 4) setPipeline(Math.max(0, currentActive + 1));
    }, 800);
    setPipeline(0);
    
    let response = null;
    let exData = null;
    const startTime = Date.now();

    try {
        if (typeof supabase !== 'undefined' && isSupabaseConfigured()) {
            // Call actual Edge Function
            const { data, error } = await supabase.functions.invoke('detect-hallucination', {
                body: { text, domain: domainSel.value, threshold }
            });

            if (error) throw error;
            response = data;
            currentVerificationId = data.verification_id; // Save for feedback
            
            // Format for UI
            exData = {
                text: text,
                spans: data.flagged_spans.map(s => ({
                    id: s.id,  // Include database ID for feedback
                    start: s.start_offset,
                    end: s.end_offset,
                    text: s.flagged_text,
                    category: s.category,
                    confidence: s.confidence,
                    evidence: s.evidence
                }))
            };
        } else {
            throw new Error("Supabase not configured, falling back to mock");
        }
    } catch (err) {
        console.warn("AI detection error, using mock data:", err);
        currentVerificationId = null;
        if (typeof showToast === 'function') {
          showToast('Live Supabase detection is unavailable right now. Showing mock analysis instead.', 'error');
        }
        // Fallback to mock data
        let mockData = null;
        for (const key of Object.keys(EXAMPLES)) {
          if (EXAMPLES[key].text === text) { mockData = EXAMPLES[key]; break; }
        }
        if (!mockData) mockData = { text, spans: generateMockSpans(text), domain: domainSel.value };
        
        exData = mockData;
        const filtered = mockData.spans.filter(s => s.confidence >= threshold);
        const score = filtered.length === 0 ? 0.04 : Math.min(0.98, filtered.reduce((acc, s) => acc + s.confidence, 0) / filtered.length * (filtered.length / 3));
        const level = riskLevel(score);
        
        response = {
          request_id: `req_${Math.random().toString(36).slice(2, 10)}`,
          hallucination_score: parseFloat(score.toFixed(3)),
          risk_level: level,
          flagged_spans: filtered.map((s, idx) => ({
            span_id: idx,
            start_offset: s.start,
            end_offset: s.end,
            flagged_text: s.text,
            category: s.category,
            confidence: s.confidence,
            evidence: s.evidence
          })),
          processing_time_ms: Date.now() - startTime,
          model_version: 'mock-v1'
        };
    }

    clearInterval(pipelineInterval);
    setPipeline(5); // all done

    const filtered = exData.spans.filter(s => s.confidence >= threshold);
    const score = response.hallucination_score;
    const level = response.risk_level;
    const ptMs = response.processing_time_ms;

    // Render annotated text
    annotatedOut.innerHTML = '<div class="annotated-text">' + buildAnnotated(text, exData.spans, threshold) + '</div>';

    // Update gauge & badges
    resultsPanel.style.display = 'flex';
    setGauge(score);
    riskBadge.className = `risk-badge ${level}`;
    riskBadge.textContent = level.toUpperCase();
    spanCount.textContent = filtered.length;
    procTime.textContent = `${ptMs}ms`;

    // Spans table
    if (filtered.length > 0) {
      spansCard.style.display = 'block';
      spansTbody.innerHTML = filtered.map((s, i) => `
        <tr>
          <td><span style="display:flex;align-items:center;gap:.4rem;"><span class="cat-dot ${s.category}"></span><span style="font-size:.78rem;font-weight:600;color:var(--text-white);">${s.category}</span></span></td>
          <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHTML(s.text)}">${escapeHTML(truncate(s.text, 45))}</td>
          <td><div class="progress-bar-wrap" style="width:80px;"><div class="progress-bar-fill" style="width:${s.confidence*100}%; background:${catColor(s.category)};"></div></div><span style="font-size:.72rem; color:var(--text-muted); margin-left:.4rem;">${(s.confidence*100).toFixed(0)}%</span></td>
          <td style="font-size:.75rem; color:var(--text-muted); max-width:200px;">${escapeHTML(truncate(s.evidence, 55))}</td>
          <td>
            <div style="display:flex;gap:.35rem;">
              <button class="feedback-btn positive" onclick="sendFeedback(this,'correct','${s.id || s.span_id || ''}')" title="Mark correct">👍</button>
              <button class="feedback-btn negative" onclick="sendFeedback(this,'incorrect','${s.id || s.span_id || ''}')" title="Mark incorrect">👎</button>
            </div>
          </td>
        </tr>`).join('');
    }

    // Raw JSON
    rawJson.innerHTML = syntaxHL(response);

    analyzeBtn.disabled = false;
    btnText.textContent = 'Analyze';
  });

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function generateMockSpans(text) {
    // For custom text, generate 1–2 plausible mock spans
    const mid = Math.floor(text.length / 2);
    return [{
      start: Math.max(0, mid - 30),
      end: Math.min(text.length, mid + 30),
      text: text.slice(Math.max(0, mid - 30), Math.min(text.length, mid + 30)),
      category: 'factual',
      confidence: 0.62 + Math.random() * 0.25,
      evidence: 'Unable to verify claim against available knowledge bases.'
    }];
  }
});

async function sendFeedback(btn, type, spanId) {
  btn.style.color = type === 'correct' ? 'var(--risk-low)' : 'var(--risk-critical)';
  btn.style.borderColor = type === 'correct' ? 'var(--risk-low)' : 'var(--risk-critical)';
  btn.closest('td').querySelectorAll('.feedback-btn').forEach(b => { b.disabled = true; });

  if (spanId && spanId !== 'undefined' && currentVerificationId && typeof supabase !== 'undefined') {
    try {
        const session = await getSession();
        if(!session) return;
        
        await supabase.from('feedback').insert({
            user_id: session.user.id,
            verification_id: currentVerificationId,
            span_id: spanId,
            feedback_type: type
        });
        
        if (typeof showToast === 'function') showToast('Feedback recorded. Thank you!', 'success');
    } catch (err) {
        console.error("Feedback error", err);
    }
  }
}
