/**
 * Aftermath Floating Timer Widget
 * 우측 하단 floating 카운트다운 타이머. 학습지/해설지에서 한 줄로 사용.
 *   <script src="timer-widget.js" defer></script>
 *
 * 메인 페이지(index.html) 타이머와 동일한 작동 패턴:
 * - inline onclick으로 직접 호출 (위임/캐시 우회)
 * - ES5 호환 문법 (Optional Chaining 등 제거)
 */
(function () {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    if (document.getElementById('aftermathTimer')) return;
    injectCSS();
    injectDOM();
    update();
  }

  /* ──────────────────────────────────────────────
     상태 + 글로벌 함수 노출 (inline onclick에서 호출)
  ────────────────────────────────────────────── */
  var timer = { total: 0, remaining: 0, running: false, intervalId: null };
  var audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    return audioCtx;
  }
  function playTick(freq, dur) {
    var ctx = getAudioCtx(); if (!ctx) return;
    var osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'square'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + dur);
  }
  function playEnd() {
    [880, 660, 880, 660].forEach(function (f, i) {
      setTimeout(function () { playTick(f, 0.2); }, i * 200);
    });
  }
  function fmt(s) {
    s = Math.max(0, s);
    var m = Math.floor(s / 60), x = s % 60;
    return String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0');
  }

  function update() {
    var d = document.getElementById('aftermathTimerDisplay');
    var m = document.getElementById('aftermathTimerMini');
    var t = document.getElementById('aftermathTimerToggle');
    if (!d || !t) return;
    d.textContent = fmt(timer.remaining);
    d.classList.remove('warning', 'danger');
    if (timer.remaining <= 10 && timer.remaining > 0) d.classList.add('danger');
    else if (timer.remaining <= 30 && timer.remaining > 0) d.classList.add('warning');
    if (m) m.textContent = (timer.running || timer.remaining > 0) ? fmt(timer.remaining) : '';
    t.classList.toggle('running', timer.running);
    t.classList.toggle('danger', timer.remaining <= 10 && timer.remaining > 0 && timer.running);
  }

  function startTimer(seconds) {
    if (seconds !== undefined) { timer.total = seconds; timer.remaining = seconds; }
    if (timer.remaining <= 0) return;
    if (timer.intervalId) clearInterval(timer.intervalId);
    timer.running = true;
    update();
    timer.intervalId = setInterval(function () {
      timer.remaining--;
      update();
      if (timer.remaining <= 5 && timer.remaining > 0) playTick(880, 0.1);
      if (timer.remaining <= 0) {
        clearInterval(timer.intervalId);
        timer.intervalId = null;
        timer.running = false;
        playEnd();
        update();
      }
    }, 1000);
  }
  function pauseTimer() {
    if (timer.intervalId) { clearInterval(timer.intervalId); timer.intervalId = null; }
    timer.running = false;
    update();
  }
  function resetTimer() {
    pauseTimer();
    timer.remaining = timer.total;
    update();
  }

  // inline onclick 핸들러 (window에 노출 — DOM에서 직접 호출)
  window.aftermathTimerToggle = function () {
    var panel = document.getElementById('aftermathTimerPanel');
    if (!panel) return;
    panel.hidden = !panel.hidden;
  };
  window.aftermathTimerClose = function () {
    var panel = document.getElementById('aftermathTimerPanel');
    if (panel) panel.hidden = true;
  };
  window.aftermathTimerPreset = function (sec) {
    var input = document.getElementById('aftermathTimerInput');
    if (input) input.value = sec;
    startTimer(sec);
  };
  window.aftermathTimerStart = function () {
    if (timer.running) return;
    if (timer.remaining > 0) { startTimer(); return; }
    var input = document.getElementById('aftermathTimerInput');
    var sec = input ? parseInt(input.value, 10) : NaN;
    if (!isFinite(sec) || sec <= 0) {
      sec = 60;
      if (input) input.value = sec;
    }
    startTimer(sec);
  };
  window.aftermathTimerPause = pauseTimer;
  window.aftermathTimerReset = resetTimer;

  /* ──────────────────────────────────────────────
     스타일
  ────────────────────────────────────────────── */
  function injectCSS() {
    var css = '\
.aftermath-timer { position:fixed; right:16px; bottom:16px; z-index:9000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", "Noto Sans KR", sans-serif; }\
.aftermath-timer-toggle { width:56px; height:56px; border-radius:50%; background:#4f46e5; color:#fff; border:none; cursor:pointer; padding:0; box-shadow:0 4px 16px rgba(79,70,229,0.4); display:flex; align-items:center; justify-content:center; flex-direction:column; transition:transform .15s, background .2s; }\
.aftermath-timer-toggle:hover { transform:scale(1.06); }\
.aftermath-timer-toggle.running { background:#dc2626; }\
.aftermath-timer-toggle.danger { animation:aftermath-timer-blink .5s infinite; }\
.aftermath-timer-icon { font-size:22px; line-height:1; }\
.aftermath-timer-mini { font-size:10px; font-weight:800; line-height:1; font-variant-numeric:tabular-nums; margin-top:1px; letter-spacing:.5px; }\
.aftermath-timer-mini:empty { display:none; }\
.aftermath-timer-panel { position:absolute; right:0; bottom:64px; width:248px; padding:14px; background:#fff; color:#1e293b; border:1px solid #e2e8f0; border-radius:14px; box-shadow:0 8px 24px rgba(0,0,0,0.15); animation:aftermath-timer-pop 180ms cubic-bezier(0.16,1,0.3,1); }\
.aftermath-timer-panel[hidden] { display:none; }\
@keyframes aftermath-timer-pop { from{opacity:0;transform:translateY(8px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }\
@keyframes aftermath-timer-blink { 50% { opacity:.45; } }\
.aftermath-timer-header { display:flex; justify-content:space-between; align-items:center; font-size:12px; font-weight:700; color:#475569; letter-spacing:.05em; text-transform:uppercase; margin-bottom:8px; }\
.aftermath-timer-close { background:none; border:none; font-size:20px; cursor:pointer; color:#94a3b8; padding:0; line-height:1; width:24px; height:24px; }\
.aftermath-timer-close:hover { color:#475569; }\
.aftermath-timer-display { font-size:36px; font-weight:800; text-align:center; font-variant-numeric:tabular-nums; color:#1e293b; margin-bottom:10px; letter-spacing:1.5px; line-height:1.1; }\
.aftermath-timer-display.warning { color:#f59e0b; }\
.aftermath-timer-display.danger { color:#dc2626; animation:aftermath-timer-blink .5s infinite; }\
.aftermath-timer-presets { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; margin-bottom:8px; }\
.aftermath-timer-presets button { padding:7px 0; font-size:12px; font-weight:700; background:#f1f5f9; border:1px solid #e2e8f0; color:#475569; border-radius:7px; cursor:pointer; font-family:inherit; transition:all .12s; }\
.aftermath-timer-presets button:hover { background:#4f46e5; color:#fff; border-color:#4f46e5; }\
.aftermath-timer-controls { display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px; }\
.aftermath-timer-controls input { grid-column:1/-1; padding:7px 10px; font-size:13px; border:1px solid #e2e8f0; border-radius:6px; text-align:center; margin-bottom:6px; font-family:inherit; color:#1e293b; background:#f8fafc; -moz-appearance:textfield; }\
.aftermath-timer-controls input::-webkit-outer-spin-button, .aftermath-timer-controls input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }\
.aftermath-timer-controls button { padding:7px 0; font-size:12px; font-weight:700; background:#fff; border:1px solid #cbd5e1; color:#475569; border-radius:6px; cursor:pointer; font-family:inherit; transition:all .12s; }\
.aftermath-timer-controls button:hover { background:#f1f5f9; }\
.aftermath-timer-controls button.primary { background:#4f46e5; color:#fff; border-color:#4f46e5; }\
.aftermath-timer-controls button.primary:hover { background:#4338ca; }\
@media (max-width:600px) { .aftermath-timer { right:12px; bottom:12px; } .aftermath-timer-toggle { width:48px; height:48px; } .aftermath-timer-icon { font-size:18px; } .aftermath-timer-panel { width:228px; padding:12px; } .aftermath-timer-display { font-size:30px; } }\
@media print { .aftermath-timer { display:none !important; } }\
@media (prefers-color-scheme: dark) { .aftermath-timer-panel { background:#1e293b; color:#f1f5f9; border-color:#475569; } .aftermath-timer-header { color:#cbd5e1; } .aftermath-timer-display { color:#f1f5f9; } .aftermath-timer-presets button { background:#334155; border-color:#475569; color:#cbd5e1; } .aftermath-timer-presets button:hover { background:#6366f1; color:#fff; border-color:#6366f1; } .aftermath-timer-controls input { background:#0f172a; border-color:#475569; color:#f1f5f9; } .aftermath-timer-controls button { background:#334155; border-color:#475569; color:#f1f5f9; } .aftermath-timer-controls button:hover { background:#475569; } }\
';
    var style = document.createElement('style');
    style.id = 'aftermath-timer-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ──────────────────────────────────────────────
     마크업 — 모든 button에 inline onclick (위임/이벤트 우회)
  ────────────────────────────────────────────── */
  function injectDOM() {
    var wrap = document.createElement('div');
    wrap.className = 'aftermath-timer';
    wrap.id = 'aftermathTimer';
    wrap.innerHTML = ''
      + '<button class="aftermath-timer-toggle" id="aftermathTimerToggle" aria-label="타이머 열기/닫기" title="타이머" onclick="window.aftermathTimerToggle()">'
      +   '<span class="aftermath-timer-icon">⏱</span>'
      +   '<span class="aftermath-timer-mini" id="aftermathTimerMini"></span>'
      + '</button>'
      + '<div class="aftermath-timer-panel" id="aftermathTimerPanel" hidden>'
      +   '<div class="aftermath-timer-header">'
      +     '<span>⏱ 타이머</span>'
      +     '<button class="aftermath-timer-close" id="aftermathTimerClose" aria-label="닫기" onclick="window.aftermathTimerClose()">×</button>'
      +   '</div>'
      +   '<div class="aftermath-timer-display" id="aftermathTimerDisplay">00:00</div>'
      +   '<div class="aftermath-timer-presets">'
      +     '<button type="button" onclick="window.aftermathTimerPreset(60)">1분</button>'
      +     '<button type="button" onclick="window.aftermathTimerPreset(180)">3분</button>'
      +     '<button type="button" onclick="window.aftermathTimerPreset(300)">5분</button>'
      +     '<button type="button" onclick="window.aftermathTimerPreset(600)">10분</button>'
      +   '</div>'
      +   '<div class="aftermath-timer-controls">'
      +     '<input type="number" id="aftermathTimerInput" placeholder="초" min="1" inputmode="numeric">'
      +     '<button type="button" class="primary" id="aftermathTimerStart" onclick="window.aftermathTimerStart()">시작</button>'
      +     '<button type="button" id="aftermathTimerPause" onclick="window.aftermathTimerPause()">일시정지</button>'
      +     '<button type="button" id="aftermathTimerReset" onclick="window.aftermathTimerReset()">리셋</button>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(wrap);
  }
})();
