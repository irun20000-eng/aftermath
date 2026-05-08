/**
 * Aftermath Challenge Problem Popup
 *
 * 학습지에 도전 문제(고난도)를 사이드/하단 슬라이드 패널로 표시.
 * 본 학습지 영역은 가리지 않고 동시에 보이게.
 *   - PC (≥768px): 우측에서 슬라이드 인 (50% 폭)
 *   - 모바일 (<768px): 하단에서 슬라이드 업 (80% 높이)
 *
 * 사용:
 *   1. <script src="challenge-popup.js" defer></script>
 *   2. 다음 객체 정의(있을 때만 버튼 표시):
 *      <script>
 *        window.AFTERMATH_CHALLENGE = {
 *          source: '🏆 2025 수능 22번',  // 출처 배지 (선택)
 *          question: '...',              // MathJax `\(...\)` 가능
 *          choices: ['$1$','$2$',...],   // 5지선다 (선택, 단답이면 생략)
 *          answer: 2,                    // 0-based 인덱스
 *          steps: [
 *            { tag: 'STEP 1', title: '...', body: '...' },
 *            ...
 *          ]
 *        };
 *      </script>
 */
(function () {
  'use strict';

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
.aftermath-challenge { font-family: 'Noto Sans KR', sans-serif; }

.aftermath-challenge-toggle {
  position: fixed; top: 84px; right: 16px; z-index: 8500;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%);
  color: #fff; border: none; cursor: pointer;
  border-radius: 999px; font-weight: 800; font-size: 14px;
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.45);
  transition: transform .15s, box-shadow .15s;
  font-family: inherit;
}
.aftermath-challenge-toggle:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124, 58, 237, 0.55); }
.aftermath-challenge-toggle:active { transform: translateY(0); }
.aftermath-challenge-toggle .ac-icon { font-size: 18px; line-height: 1; }

/* 백드롭 (반투명, 패널 포커스 강조) */
.aftermath-challenge-backdrop {
  position: fixed; inset: 0; z-index: 8990;
  background: rgba(15, 23, 42, 0.35);
  opacity: 0; pointer-events: none;
  transition: opacity .25s;
}
.aftermath-challenge-backdrop.open { opacity: 1; pointer-events: auto; }

/* 슬라이드 패널 */
.aftermath-challenge-panel {
  position: fixed; z-index: 9000;
  background: #fff; color: #1e293b;
  box-shadow: -8px 0 32px rgba(0,0,0,0.18);
  display: flex; flex-direction: column;
  transition: transform .3s cubic-bezier(0.16, 1, 0.3, 1);
  font-size: 16px; line-height: 1.7;
}

/* PC: 우측 슬라이드 (50% 폭) */
@media (min-width: 768px) {
  .aftermath-challenge-panel {
    top: 0; right: 0; bottom: 0;
    width: min(640px, 50vw);
    transform: translateX(100%);
    border-left: 1px solid #e2e8f0;
  }
  .aftermath-challenge-panel.open { transform: translateX(0); }
}

/* 모바일: 하단 슬라이드 (80% 높이) */
@media (max-width: 767px) {
  .aftermath-challenge-panel {
    left: 0; right: 0; bottom: 0;
    height: 85vh; max-height: 85vh;
    transform: translateY(100%);
    border-top: 1px solid #e2e8f0;
    border-radius: 16px 16px 0 0;
  }
  .aftermath-challenge-panel.open { transform: translateY(0); }
  .aftermath-challenge-toggle { top: auto; bottom: 80px; right: 12px; padding: 8px 14px; font-size: 13px; }
}

.aftermath-challenge-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  background: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%);
  color: #fff; flex-shrink: 0;
}
.aftermath-challenge-title { font-size: 15px; font-weight: 800; letter-spacing: .03em; }
.aftermath-challenge-close {
  background: rgba(255,255,255,0.2); border: none; color: #fff;
  width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
  font-size: 18px; line-height: 1; display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.aftermath-challenge-close:hover { background: rgba(255,255,255,0.35); }

.aftermath-challenge-body {
  flex: 1; min-height: 0; overflow-y: auto;
  padding: 18px 20px;
  -webkit-overflow-scrolling: touch;
}

.aftermath-challenge-source {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 700;
  padding: 4px 10px; border-radius: 999px;
  background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;
  margin-bottom: 12px;
}

.aftermath-challenge-question {
  font-size: 16px; line-height: 1.85; color: #0f172a;
  margin-bottom: 16px;
}

.aftermath-challenge-choices {
  list-style: none; padding: 0; margin: 0 0 16px 0;
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;
}
@media (max-width: 768px) { .aftermath-challenge-choices { grid-template-columns: repeat(2, 1fr); } }
.aftermath-challenge-choices li {
  padding: 10px 6px; font-size: 14px; text-align: center;
  background: #f8fafc; border: 1.5px solid #e2e8f0; color: #475569;
  border-radius: 8px; transition: all .15s;
}
.aftermath-challenge-choices li.correct {
  background: #f0fdf4; border-color: #86efac; color: #166534; font-weight: 700;
}

.aftermath-challenge-steps-bar {
  display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px;
  padding-top: 12px; border-top: 1px solid #e2e8f0;
}
.aftermath-challenge-step-btn {
  padding: 7px 14px; font-size: 13px; font-weight: 700;
  background: #fff; border: 1.5px solid #cbd5e1; color: #475569;
  border-radius: 999px; cursor: pointer; min-height: 36px;
  font-family: inherit; transition: all .15s;
}
.aftermath-challenge-step-btn:hover { background: #eff6ff; border-color: #7c3aed; color: #7c3aed; }
.aftermath-challenge-step-btn.active { background: #7c3aed; border-color: #7c3aed; color: #fff; }
.aftermath-challenge-step-btn.answer-btn { color: #166534; border-color: #86efac; }
.aftermath-challenge-step-btn.answer-btn:hover { background: #f0fdf4; color: #15803d; border-color: #16a34a; }
.aftermath-challenge-step-btn.answer-btn.active { background: #16a34a; border-color: #16a34a; color: #fff; }
.aftermath-challenge-step-btn.reset-btn { color: #94a3b8; border-style: dashed; }
.aftermath-challenge-step-btn.reset-btn:hover { background: #fef2f2; color: #b91c1c; border-color: #fca5a5; border-style: solid; }

.aftermath-challenge-steps-container {
  display: flex; flex-direction: column; gap: 14px;
}
.aftermath-challenge-step {
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-left: 4px solid #7c3aed;
  border-radius: 8px; padding: 12px 16px;
  animation: ac-step-reveal 240ms cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes ac-step-reveal { from { opacity:0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.aftermath-challenge-step-tag {
  display: inline-block; font-size: 11px; font-weight: 800;
  padding: 2px 8px; border-radius: 999px;
  background: #7c3aed; color: #fff; letter-spacing: .04em; margin-right: 8px;
}
.aftermath-challenge-step-title { font-size: 14px; font-weight: 700; color: #1e293b; }
.aftermath-challenge-step-body { font-size: 14px; line-height: 1.75; color: #334155; margin-top: 8px; }
.aftermath-challenge-step-body p { margin: 6px 0; }

@media print { .aftermath-challenge { display: none !important; } }

/* 다크 — 시스템 환경설정 따라 */
@media (prefers-color-scheme: dark) {
  .aftermath-challenge-panel { background: #1e293b; color: #f1f5f9; }
  .aftermath-challenge-source { background: #334155; color: #cbd5e1; border-color: #475569; }
  .aftermath-challenge-question { color: #f1f5f9; }
  .aftermath-challenge-choices li { background: #0f172a; border-color: #475569; color: #cbd5e1; }
  .aftermath-challenge-step { background: #0f172a; border-color: #475569; }
  .aftermath-challenge-step-title { color: #f1f5f9; }
  .aftermath-challenge-step-body { color: #cbd5e1; }
  .aftermath-challenge-step-btn { background: #334155; border-color: #475569; color: #cbd5e1; }
  .aftermath-challenge-step-btn:hover { background: #1e1b4b; color: #c4b5fd; border-color: #7c3aed; }
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

    // 토글 버튼
    const toggle = document.createElement('button');
    toggle.className = 'aftermath-challenge-toggle';
    toggle.id = 'aftermathChallengeToggle';
    toggle.innerHTML = '<span class="ac-icon">🚀</span><span>도전 문제</span>';
    wrap.appendChild(toggle);

    // 백드롭
    const backdrop = document.createElement('div');
    backdrop.className = 'aftermath-challenge-backdrop';
    backdrop.id = 'aftermathChallengeBackdrop';
    wrap.appendChild(backdrop);

    // 패널
    const panel = document.createElement('div');
    panel.className = 'aftermath-challenge-panel';
    panel.id = 'aftermathChallengePanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');

    // 헤더
    const header = document.createElement('div');
    header.className = 'aftermath-challenge-header';
    header.innerHTML = `
      <span class="aftermath-challenge-title">🚀 도전 문제 — 상위 학습자용</span>
      <button class="aftermath-challenge-close" id="aftermathChallengeClose" aria-label="닫기">×</button>
    `;
    panel.appendChild(header);

    // 본문
    const body = document.createElement('div');
    body.className = 'aftermath-challenge-body';

    // 출처 (있을 때만)
    if (data.source) {
      const src = document.createElement('span');
      src.className = 'aftermath-challenge-source';
      src.textContent = data.source;
      body.appendChild(src);
    }

    // 문제
    const q = document.createElement('div');
    q.className = 'aftermath-challenge-question';
    q.innerHTML = data.question;
    body.appendChild(q);

    // 선지
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

    // STEP 버튼
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

    // STEP 본문 컨테이너
    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'aftermath-challenge-steps-container';
    stepsContainer.id = 'aftermathChallengeSteps';
    body.appendChild(stepsContainer);

    panel.appendChild(body);
    wrap.appendChild(panel);
    document.body.appendChild(wrap);
  }

  /* ──────────────────────────────────────
     이벤트 + 상태
  ────────────────────────────────────── */
  function bindEvents(data) {
    const toggle = document.getElementById('aftermathChallengeToggle');
    const backdrop = document.getElementById('aftermathChallengeBackdrop');
    const panel = document.getElementById('aftermathChallengePanel');
    const closeBtn = document.getElementById('aftermathChallengeClose');
    const stepsContainer = document.getElementById('aftermathChallengeSteps');
    const opened = new Set();   // 펼친 STEP 번호

    function openPanel() {
      panel.classList.add('open');
      backdrop.classList.add('open');
    }
    function closePanel() {
      panel.classList.remove('open');
      backdrop.classList.remove('open');
    }
    function isOpen() { return panel.classList.contains('open'); }

    toggle.addEventListener('click', () => {
      if (isOpen()) closePanel(); else openPanel();
    });
    closeBtn.addEventListener('click', closePanel);
    backdrop.addEventListener('click', closePanel);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen()) {
        e.stopPropagation();
        closePanel();
      }
    }, true);

    // STEP 토글
    panel.addEventListener('click', e => {
      const btn = e.target.closest('.aftermath-challenge-step-btn');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'reset') {
        resetAll();
        return;
      }
      if (action === 'answer') {
        revealAnswer();
        return;
      }
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
        // 정렬 위치 — opened를 정렬해서 적절한 위치에 삽입
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

    function revealAnswer() {
      panel.querySelectorAll('.aftermath-challenge-choices li').forEach(li => {
        if (li.dataset.correct === 'true') li.classList.add('correct');
      });
      const btn = panel.querySelector('.aftermath-challenge-step-btn.answer-btn');
      btn?.classList.add('active');
    }

    function resetAll() {
      stepsContainer.innerHTML = '';
      opened.clear();
      panel.querySelectorAll('.aftermath-challenge-choices li').forEach(li => li.classList.remove('correct'));
      panel.querySelectorAll('.aftermath-challenge-step-btn').forEach(b => b.classList.remove('active'));
    }

    // 첫 렌더 시 문제·선지 수식 처리
    renderMath(panel);
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
