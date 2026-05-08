/**
 * Aftermath Challenge Problem Popup
 *
 * 학습지에 도전 문제(고난도)를 floating 패널로 표시.
 * timer-widget과 동일한 자유 위치·크기 시스템.
 *
 * 사용:
 *   1. <script src="challenge-popup.js" defer></script>
 *   2. window.AFTERMATH_CHALLENGE 객체 정의 (있을 때만 토글 버튼 표시)
 *      {
 *        source, question, choices, answer, steps[]
 *      }
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'aftermath_challenge_widget_state';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    const data = window.AFTERMATH_CHALLENGE;
    if (!data || !data.question) return;          // 데이터 없으면 비활성
    if (document.getElementById('aftermathChallenge')) return; // 중복 방지

    injectCSS();
    injectDOM(data);
    bindEvents(data);
  }

  /* ──────────────────────────────────────
     CSS
  ────────────────────────────────────── */
  function injectCSS() {
    const css = `
.aftermath-challenge {
  position:fixed; right:16px; bottom:84px; z-index:8500;
  font-family:'Noto Sans KR', sans-serif;
}
@media (max-width:600px) { .aftermath-challenge { bottom:72px; right:12px; } }

.aftermath-challenge-toggle {
  width:56px; height:56px; border-radius:50%;
  background:linear-gradient(135deg, #7c3aed 0%, #c026d3 100%);
  color:#fff; border:none; cursor:pointer; padding:0;
  box-shadow:0 4px 16px rgba(124, 58, 237, 0.45);
  display:flex; align-items:center; justify-content:center;
  font-size:22px; line-height:1;
  transition:transform .15s, box-shadow .15s;
  font-family:inherit;
}
.aftermath-challenge-toggle:hover { transform:scale(1.06); box-shadow:0 6px 20px rgba(124, 58, 237, 0.55); }
.aftermath-challenge-toggle:active { transform:scale(0.98); }
@media (max-width:600px) {
  .aftermath-challenge-toggle { width:48px; height:48px; font-size:18px; }
}

/* 패널 — 자유 위치/크기 */
.aftermath-challenge-panel {
  position:fixed;
  right:84px; top:96px;          /* 기본 위치 (저장값 있으면 JS로 덮어씀) */
  width:480px;
  background:#fff; color:#1e293b;
  border:1px solid #e2e8f0; border-radius:14px;
  box-shadow:0 12px 32px rgba(0,0,0,0.22);
  animation:ac-pop 200ms cubic-bezier(0.16, 1, 0.3, 1);
  resize:both; overflow:auto;
  min-width:320px; min-height:280px;
  max-width:95vw; max-height:90vh;
  height:540px;
  z-index:9001;
  display:flex; flex-direction:column;
}
.aftermath-challenge-panel[hidden] { display:none; }
@keyframes ac-pop { from{opacity:0;transform:translateY(8px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
@media (max-width:600px) {
  .aftermath-challenge-panel {
    right:8px; top:auto; bottom:140px;
    width:calc(100vw - 16px);
    height:60vh;
  }
}

.aftermath-challenge-header {
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 16px;
  background:linear-gradient(135deg, #7c3aed 0%, #c026d3 100%);
  color:#fff; flex-shrink:0;
  cursor:move; user-select:none;
  border-radius:14px 14px 0 0;
}
.aftermath-challenge-header::before {
  content:'⠿'; margin-right:8px; opacity:0.6; font-size:14px; cursor:move;
}
.aftermath-challenge-title { font-size:14px; font-weight:800; letter-spacing:.03em; flex:1; }
.aftermath-challenge-close {
  background:rgba(255,255,255,0.2); border:none; color:#fff;
  width:28px; height:28px; border-radius:50%; cursor:pointer;
  font-size:16px; line-height:1; display:flex; align-items:center; justify-content:center;
  transition:background .15s;
  flex-shrink:0;
}
.aftermath-challenge-close:hover { background:rgba(255,255,255,0.35); }

.aftermath-challenge-body {
  flex:1; min-height:0; overflow-y:auto;
  padding:16px 18px;
  -webkit-overflow-scrolling:touch;
}

.aftermath-challenge-source {
  display:inline-flex; align-items:center; gap:4px;
  font-size:11px; font-weight:700;
  padding:3px 10px; border-radius:999px;
  background:#f1f5f9; color:#475569; border:1px solid #e2e8f0;
  margin-bottom:10px;
}

.aftermath-challenge-question {
  font-size:15px; line-height:1.8; color:#0f172a;
  margin-bottom:14px;
}

.aftermath-challenge-choices {
  list-style:none; padding:0; margin:0 0 14px 0;
  display:grid; grid-template-columns:repeat(5, 1fr); gap:5px;
}
@media (max-width:768px) { .aftermath-challenge-choices { grid-template-columns:repeat(2, 1fr); } }
.aftermath-challenge-choices li {
  padding:9px 6px; font-size:13px; text-align:center;
  background:#f8fafc; border:1.5px solid #e2e8f0; color:#475569;
  border-radius:7px; transition:all .15s;
}
.aftermath-challenge-choices li.correct {
  background:#f0fdf4; border-color:#86efac; color:#166534; font-weight:700;
}

.aftermath-challenge-steps-bar {
  display:flex; flex-wrap:wrap; gap:5px; margin-bottom:12px;
  padding-top:10px; border-top:1px solid #e2e8f0;
}
.aftermath-challenge-step-btn {
  padding:6px 12px; font-size:12px; font-weight:700;
  background:#fff; border:1.5px solid #cbd5e1; color:#475569;
  border-radius:999px; cursor:pointer; min-height:32px;
  font-family:inherit; transition:all .15s;
}
.aftermath-challenge-step-btn:hover { background:#eff6ff; border-color:#7c3aed; color:#7c3aed; }
.aftermath-challenge-step-btn.active { background:#7c3aed; border-color:#7c3aed; color:#fff; }
.aftermath-challenge-step-btn.answer-btn { color:#166534; border-color:#86efac; }
.aftermath-challenge-step-btn.answer-btn:hover { background:#f0fdf4; color:#15803d; border-color:#16a34a; }
.aftermath-challenge-step-btn.answer-btn.active { background:#16a34a; border-color:#16a34a; color:#fff; }
.aftermath-challenge-step-btn.reset-btn { color:#94a3b8; border-style:dashed; }
.aftermath-challenge-step-btn.reset-btn:hover { background:#fef2f2; color:#b91c1c; border-color:#fca5a5; border-style:solid; }

.aftermath-challenge-steps-container {
  display:flex; flex-direction:column; gap:12px;
}
.aftermath-challenge-step {
  background:#f8fafc; border:1px solid #e2e8f0;
  border-left:4px solid #7c3aed;
  border-radius:8px; padding:10px 14px;
  animation:ac-step-reveal 240ms cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes ac-step-reveal { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
.aftermath-challenge-step-tag {
  display:inline-block; font-size:11px; font-weight:800;
  padding:2px 8px; border-radius:999px;
  background:#7c3aed; color:#fff; letter-spacing:.04em; margin-right:8px;
}
.aftermath-challenge-step-title { font-size:13px; font-weight:700; color:#1e293b; }
.aftermath-challenge-step-body { font-size:13px; line-height:1.75; color:#334155; margin-top:6px; }
.aftermath-challenge-step-body p { margin:5px 0; }

@media print { .aftermath-challenge, .aftermath-challenge-panel { display:none !important; } }

/* 다크 — 시스템 환경설정 따라 */
@media (prefers-color-scheme: dark) {
  .aftermath-challenge-panel { background:#1e293b; color:#f1f5f9; border-color:#475569; }
  .aftermath-challenge-source { background:#334155; color:#cbd5e1; border-color:#475569; }
  .aftermath-challenge-question { color:#f1f5f9; }
  .aftermath-challenge-choices li { background:#0f172a; border-color:#475569; color:#cbd5e1; }
  .aftermath-challenge-step { background:#0f172a; border-color:#475569; }
  .aftermath-challenge-step-title { color:#f1f5f9; }
  .aftermath-challenge-step-body { color:#cbd5e1; }
  .aftermath-challenge-step-btn { background:#334155; border-color:#475569; color:#cbd5e1; }
  .aftermath-challenge-step-btn:hover { background:#1e1b4b; color:#c4b5fd; border-color:#7c3aed; }
}
`;
    const style = document.createElement('style');
    style.id = 'aftermath-challenge-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ──────────────────────────────────────
     마크업 주입
  ────────────────────────────────────── */
  function injectDOM(data) {
    const wrap = document.createElement('div');
    wrap.className = 'aftermath-challenge';
    wrap.id = 'aftermathChallenge';

    const toggle = document.createElement('button');
    toggle.className = 'aftermath-challenge-toggle';
    toggle.id = 'aftermathChallengeToggle';
    toggle.setAttribute('aria-label', '도전 문제 열기/닫기');
    toggle.title = '도전 문제';
    toggle.textContent = '🚀';
    wrap.appendChild(toggle);

    document.body.appendChild(wrap);

    // 패널은 body 직접 자식
    const panel = document.createElement('div');
    panel.className = 'aftermath-challenge-panel';
    panel.id = 'aftermathChallengePanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.hidden = true;

    // 헤더
    const header = document.createElement('div');
    header.className = 'aftermath-challenge-header';
    header.id = 'aftermathChallengeHeader';
    header.innerHTML = `
      <span class="aftermath-challenge-title">🚀 도전 문제 — 상위 학습자용</span>
      <button class="aftermath-challenge-close" id="aftermathChallengeClose" aria-label="닫기">×</button>
    `;
    panel.appendChild(header);

    // 본문
    const body = document.createElement('div');
    body.className = 'aftermath-challenge-body';

    if (data.source) {
      const src = document.createElement('span');
      src.className = 'aftermath-challenge-source';
      src.textContent = data.source;
      body.appendChild(src);
    }

    const q = document.createElement('div');
    q.className = 'aftermath-challenge-question';
    q.innerHTML = data.question;
    body.appendChild(q);

    if (Array.isArray(data.choices) && data.choices.length > 0) {
      const ol = document.createElement('ol');
      ol.className = 'aftermath-challenge-choices';
      const nums = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];
      data.choices.forEach((c, i) => {
        const li = document.createElement('li');
        li.dataset.idx = i;
        li.innerHTML = `${nums[i] || (i+1)} ${c}`;
        if (i === data.answer) li.dataset.correct = 'true';
        ol.appendChild(li);
      });
      body.appendChild(ol);
    }

    const stepsBar = document.createElement('div');
    stepsBar.className = 'aftermath-challenge-steps-bar';
    if (Array.isArray(data.steps)) {
      data.steps.forEach((s, i) => {
        const btn = document.createElement('button');
        btn.className = 'aftermath-challenge-step-btn';
        btn.dataset.step = String(i + 1);
        btn.textContent = `STEP ${i + 1}`;
        stepsBar.appendChild(btn);
      });
    }
    if (data.answer !== undefined && Array.isArray(data.choices)) {
      const ansBtn = document.createElement('button');
      ansBtn.className = 'aftermath-challenge-step-btn answer-btn';
      ansBtn.dataset.action = 'answer';
      ansBtn.textContent = '정답';
      stepsBar.appendChild(ansBtn);
    }
    const resetBtn = document.createElement('button');
    resetBtn.className = 'aftermath-challenge-step-btn reset-btn';
    resetBtn.dataset.action = 'reset';
    resetBtn.textContent = '초기화';
    stepsBar.appendChild(resetBtn);
    body.appendChild(stepsBar);

    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'aftermath-challenge-steps-container';
    stepsContainer.id = 'aftermathChallengeSteps';
    body.appendChild(stepsContainer);

    panel.appendChild(body);
    document.body.appendChild(panel);
  }

  /* ──────────────────────────────────────
     상태 저장/복원
  ────────────────────────────────────── */
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
    catch (e) { return null; }
  }
  function saveState() {
    const panel = document.getElementById('aftermathChallengePanel');
    if (!panel || panel.hidden) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        left: parseInt(panel.style.left, 10) || 0,
        top: parseInt(panel.style.top, 10) || 0,
        width: panel.offsetWidth,
        height: panel.offsetHeight
      }));
    } catch (e) {}
  }
  function applyState() {
    const s = loadState();
    const panel = document.getElementById('aftermathChallengePanel');
    if (!panel || !s) return;
    const w = window.innerWidth, h = window.innerHeight;
    const W = Math.min(s.width || 480, w * 0.95);
    const H = Math.min(s.height || 540, h * 0.9);
    const L = Math.max(0, Math.min(s.left, w - W));
    const T = Math.max(0, Math.min(s.top, h - 60));
    panel.style.left = L + 'px';
    panel.style.top = T + 'px';
    panel.style.right = 'auto'; panel.style.bottom = 'auto';
    panel.style.width = W + 'px';
    panel.style.height = H + 'px';
  }

  /* ──────────────────────────────────────
     드래그·리사이즈
  ────────────────────────────────────── */
  function setupDrag() {
    const panel = document.getElementById('aftermathChallengePanel');
    const header = document.getElementById('aftermathChallengeHeader');
    if (!panel || !header) return;

    let dragging = false;
    let startX = 0, startY = 0, startL = 0, startT = 0;

    function onDown(e) {
      if (e.target.closest('.aftermath-challenge-close')) return;
      const pt = (e.touches && e.touches[0]) || e;
      e.preventDefault();
      const rect = panel.getBoundingClientRect();
      panel.style.left = rect.left + 'px';
      panel.style.top = rect.top + 'px';
      panel.style.right = 'auto'; panel.style.bottom = 'auto';
      dragging = true;
      startX = pt.clientX; startY = pt.clientY;
      startL = rect.left; startT = rect.top;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
    }
    function onMove(e) {
      if (!dragging) return;
      const pt = (e.touches && e.touches[0]) || e;
      if (e.cancelable) e.preventDefault();
      const dx = pt.clientX - startX;
      const dy = pt.clientY - startY;
      const newL = Math.max(0, Math.min(startL + dx, window.innerWidth - panel.offsetWidth));
      const newT = Math.max(0, Math.min(startT + dy, window.innerHeight - 40));
      panel.style.left = newL + 'px';
      panel.style.top = newT + 'px';
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
      saveState();
    }

    header.addEventListener('mousedown', onDown);
    header.addEventListener('touchstart', onDown, { passive: false });
  }

  function setupResize() {
    const panel = document.getElementById('aftermathChallengePanel');
    if (!panel || !window.ResizeObserver) return;
    let timeoutId = null;
    const ro = new ResizeObserver(() => {
      if (panel.hidden) return;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(saveState, 200);
    });
    ro.observe(panel);
  }

  /* ──────────────────────────────────────
     이벤트 + STEP 토글 + 정답 토글
  ────────────────────────────────────── */
  function bindEvents(data) {
    const toggle = document.getElementById('aftermathChallengeToggle');
    const panel = document.getElementById('aftermathChallengePanel');
    const closeBtn = document.getElementById('aftermathChallengeClose');
    const stepsContainer = document.getElementById('aftermathChallengeSteps');
    const opened = new Set();

    function openPanel() {
      panel.hidden = false;
      applyState();
      renderMath(panel);
    }
    function closePanel() { panel.hidden = true; }

    toggle.addEventListener('click', () => {
      if (panel.hidden) openPanel(); else closePanel();
    });
    closeBtn.addEventListener('click', closePanel);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !panel.hidden) {
        e.stopPropagation();
        closePanel();
      }
    }, true);

    panel.addEventListener('click', e => {
      const btn = e.target.closest('.aftermath-challenge-step-btn');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'reset') { resetAll(); return; }
      if (action === 'answer') { toggleAnswer(); return; }
      const stepNum = parseInt(btn.dataset.step, 10);
      if (stepNum) toggleStep(stepNum);
    });

    function toggleStep(n) {
      if (opened.has(n)) {
        const el = stepsContainer.querySelector(`[data-step-num="${n}"]`);
        el?.remove();
        opened.delete(n);
      } else {
        const stepData = data.steps[n - 1];
        if (!stepData) return;
        const div = document.createElement('div');
        div.className = 'aftermath-challenge-step';
        div.dataset.stepNum = n;
        div.innerHTML = `
          <div>
            <span class="aftermath-challenge-step-tag">${stepData.tag || ('STEP ' + n)}</span>
            <span class="aftermath-challenge-step-title">${stepData.title || ''}</span>
          </div>
          <div class="aftermath-challenge-step-body">${stepData.body || ''}</div>
        `;
        const allSteps = Array.from(stepsContainer.querySelectorAll('.aftermath-challenge-step'));
        let inserted = false;
        for (const s of allSteps) {
          if (parseInt(s.dataset.stepNum, 10) > n) {
            stepsContainer.insertBefore(div, s);
            inserted = true; break;
          }
        }
        if (!inserted) stepsContainer.appendChild(div);
        opened.add(n);
        renderMath(div);
      }
      updateStepBtns();
    }

    function updateStepBtns() {
      panel.querySelectorAll('.aftermath-challenge-step-btn[data-step]').forEach(b => {
        const n = parseInt(b.dataset.step, 10);
        b.classList.toggle('active', opened.has(n));
      });
    }

    function toggleAnswer() {
      const btn = panel.querySelector('.aftermath-challenge-step-btn.answer-btn');
      if (!btn) return;
      const isActive = btn.classList.contains('active');
      panel.querySelectorAll('.aftermath-challenge-choices li').forEach(li => {
        if (li.dataset.correct === 'true') li.classList.toggle('correct', !isActive);
      });
      btn.classList.toggle('active', !isActive);
    }

    function resetAll() {
      stepsContainer.innerHTML = '';
      opened.clear();
      panel.querySelectorAll('.aftermath-challenge-choices li').forEach(li => li.classList.remove('correct'));
      panel.querySelectorAll('.aftermath-challenge-step-btn').forEach(b => b.classList.remove('active'));
    }

    // 드래그·리사이즈
    setupDrag();
    setupResize();
  }

  /* ──────────────────────────────────────
     수식 렌더링 (MathJax 우선, KaTeX 보조)
  ────────────────────────────────────── */
  function renderMath(el) {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([el]).catch(() => {});
    } else if (window.renderMathInElement) {
      window.renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$',  right: '$',  display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }
  }
})();
