/**
 * Aftermath Floating Timer Widget
 *
 * 학습지/해설지 우측 하단 floating 타이머. 한 줄로 사용:
 *   <script src="timer-widget.js" defer></script>
 *
 * 메인 페이지(index.html)의 검증된 타이머 코드를 floating 패턴으로 적용.
 * - 표준 DOM API (createElement, addEventListener)
 * - ID와 함수명 분리 (충돌 방지)
 * - innerHTML/inline onclick 사용 안 함
 */
(function () {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    if (document.getElementById('aftermathTimerWrap')) return;
    injectCSS();
    var nodes = injectDOM();
    bindEvents(nodes);
    updateDisplay(nodes);
  }

  // 상태 (IIFE 클로저)
  var timer = { total: 0, remaining: 0, running: false, intervalId: null };
  var audioCtx = null;

  /* ──────────────────────────────────────
     사운드
  ────────────────────────────────────── */
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
    var freqs = [880, 660, 880, 660];
    for (var i = 0; i < freqs.length; i++) {
      (function (f, idx) {
        setTimeout(function () { playTick(f, 0.2); }, idx * 200);
      })(freqs[i], i);
    }
  }

  /* ──────────────────────────────────────
     포맷 + 화면 갱신
  ────────────────────────────────────── */
  function formatTime(s) {
    s = Math.max(0, s | 0);
    var m = Math.floor(s / 60), x = s % 60;
    return (m < 10 ? '0' + m : '' + m) + ':' + (x < 10 ? '0' + x : '' + x);
  }

  function updateDisplay(nodes) {
    if (!nodes || !nodes.display) {
      nodes = currentNodes();
      if (!nodes.display) return;
    }
    nodes.display.textContent = formatTime(timer.remaining);
    nodes.display.classList.remove('aftermath-timer-warn', 'aftermath-timer-danger');
    if (timer.remaining > 0 && timer.remaining <= 10) {
      nodes.display.classList.add('aftermath-timer-danger');
    } else if (timer.remaining > 0 && timer.remaining <= 30) {
      nodes.display.classList.add('aftermath-timer-warn');
    }
    if (nodes.mini) {
      nodes.mini.textContent = (timer.running || timer.remaining > 0) ? formatTime(timer.remaining) : '';
    }
    if (nodes.toggleBtn) {
      if (timer.running) nodes.toggleBtn.classList.add('aftermath-timer-running');
      else nodes.toggleBtn.classList.remove('aftermath-timer-running');
    }
  }

  function currentNodes() {
    return {
      display: document.getElementById('aftermathTimerDisplay'),
      mini: document.getElementById('aftermathTimerMini'),
      toggleBtn: document.getElementById('aftermathTimerToggleBtn'),
      panel: document.getElementById('aftermathTimerPanel'),
      input: document.getElementById('aftermathTimerInput')
    };
  }

  /* ──────────────────────────────────────
     타이머 동작
  ────────────────────────────────────── */
  function startTimer(seconds) {
    if (typeof seconds === 'number' && seconds > 0) {
      timer.total = seconds;
      timer.remaining = seconds;
    }
    if (timer.remaining <= 0) return;
    if (timer.intervalId) clearInterval(timer.intervalId);
    timer.running = true;
    updateDisplay();
    timer.intervalId = setInterval(function () {
      timer.remaining--;
      updateDisplay();
      if (timer.remaining <= 5 && timer.remaining > 0) playTick(880, 0.1);
      if (timer.remaining <= 0) {
        clearInterval(timer.intervalId);
        timer.intervalId = null;
        timer.running = false;
        playEnd();
        updateDisplay();
      }
    }, 1000);
  }
  function pauseTimer() {
    if (timer.intervalId) {
      clearInterval(timer.intervalId);
      timer.intervalId = null;
    }
    timer.running = false;
    updateDisplay();
  }
  function resetTimer() {
    pauseTimer();
    timer.remaining = timer.total;
    updateDisplay();
  }

  /* ──────────────────────────────────────
     CSS
  ────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('aftermathTimerStyle')) return;
    var css = [
      '.aftermath-timer-wrap { position:fixed; right:16px; bottom:16px; z-index:9000; font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", "Noto Sans KR", sans-serif; }',
      '.aftermath-timer-toggle-btn { width:56px; height:56px; border-radius:50%; background:#4f46e5; color:#fff; border:none; cursor:pointer; padding:0; box-shadow:0 4px 16px rgba(79,70,229,0.4); display:flex; align-items:center; justify-content:center; flex-direction:column; transition:transform .15s, background .2s; }',
      '.aftermath-timer-toggle-btn:hover { transform:scale(1.06); }',
      '.aftermath-timer-toggle-btn.aftermath-timer-running { background:#dc2626; }',
      '.aftermath-timer-icon { font-size:22px; line-height:1; }',
      '.aftermath-timer-mini { font-size:10px; font-weight:800; line-height:1; font-variant-numeric:tabular-nums; margin-top:1px; letter-spacing:.5px; }',
      '.aftermath-timer-mini:empty { display:none; }',
      '.aftermath-timer-panel { position:absolute; right:0; bottom:64px; width:248px; padding:14px; background:#fff; color:#1e293b; border:1px solid #e2e8f0; border-radius:14px; box-shadow:0 8px 24px rgba(0,0,0,0.18); }',
      '.aftermath-timer-panel[hidden] { display:none; }',
      '.aftermath-timer-header { display:flex; justify-content:space-between; align-items:center; font-size:12px; font-weight:700; color:#475569; letter-spacing:.05em; text-transform:uppercase; margin-bottom:8px; }',
      '.aftermath-timer-close-btn { background:none; border:none; font-size:20px; cursor:pointer; color:#94a3b8; padding:0; line-height:1; width:24px; height:24px; }',
      '.aftermath-timer-close-btn:hover { color:#475569; }',
      '.aftermath-timer-display { font-size:36px; font-weight:800; text-align:center; font-variant-numeric:tabular-nums; color:#1e293b; margin-bottom:10px; letter-spacing:1.5px; line-height:1.1; }',
      '.aftermath-timer-display.aftermath-timer-warn { color:#f59e0b; }',
      '.aftermath-timer-display.aftermath-timer-danger { color:#dc2626; }',
      '.aftermath-timer-presets { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; margin-bottom:8px; }',
      '.aftermath-timer-preset-btn { padding:7px 0; font-size:12px; font-weight:700; background:#f1f5f9; border:1px solid #e2e8f0; color:#475569; border-radius:7px; cursor:pointer; font-family:inherit; }',
      '.aftermath-timer-preset-btn:hover { background:#4f46e5; color:#fff; border-color:#4f46e5; }',
      '.aftermath-timer-controls { display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px; }',
      '.aftermath-timer-input { grid-column:1/-1; padding:7px 10px; font-size:13px; border:1px solid #e2e8f0; border-radius:6px; text-align:center; margin-bottom:6px; font-family:inherit; color:#1e293b; background:#f8fafc; -moz-appearance:textfield; }',
      '.aftermath-timer-input::-webkit-outer-spin-button, .aftermath-timer-input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }',
      '.aftermath-timer-ctrl-btn { padding:7px 0; font-size:12px; font-weight:700; background:#fff; border:1px solid #cbd5e1; color:#475569; border-radius:6px; cursor:pointer; font-family:inherit; }',
      '.aftermath-timer-ctrl-btn:hover { background:#f1f5f9; }',
      '.aftermath-timer-ctrl-btn.aftermath-timer-primary { background:#4f46e5; color:#fff; border-color:#4f46e5; }',
      '.aftermath-timer-ctrl-btn.aftermath-timer-primary:hover { background:#4338ca; }',
      '@media (max-width:600px) { .aftermath-timer-wrap { right:12px; bottom:12px; } .aftermath-timer-toggle-btn { width:48px; height:48px; } .aftermath-timer-icon { font-size:18px; } .aftermath-timer-panel { width:228px; padding:12px; } .aftermath-timer-display { font-size:30px; } }',
      '@media print { .aftermath-timer-wrap { display:none !important; } }'
    ].join(' ');
    var style = document.createElement('style');
    style.id = 'aftermathTimerStyle';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ──────────────────────────────────────
     마크업 — createElement 100%
  ────────────────────────────────────── */
  function injectDOM() {
    var wrap = document.createElement('div');
    wrap.className = 'aftermath-timer-wrap';
    wrap.id = 'aftermathTimerWrap';

    // toggle (floating circle button)
    var toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'aftermath-timer-toggle-btn';
    toggleBtn.id = 'aftermathTimerToggleBtn';
    toggleBtn.setAttribute('aria-label', '타이머 열기/닫기');
    var icon = document.createElement('span');
    icon.className = 'aftermath-timer-icon';
    icon.textContent = '⏱';
    toggleBtn.appendChild(icon);
    var mini = document.createElement('span');
    mini.className = 'aftermath-timer-mini';
    mini.id = 'aftermathTimerMini';
    toggleBtn.appendChild(mini);
    wrap.appendChild(toggleBtn);

    // panel
    var panel = document.createElement('div');
    panel.className = 'aftermath-timer-panel';
    panel.id = 'aftermathTimerPanel';
    panel.hidden = true;

    // header (title + close)
    var header = document.createElement('div');
    header.className = 'aftermath-timer-header';
    var title = document.createElement('span');
    title.textContent = '⏱ 타이머';
    header.appendChild(title);
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'aftermath-timer-close-btn';
    closeBtn.id = 'aftermathTimerCloseBtn';
    closeBtn.setAttribute('aria-label', '닫기');
    closeBtn.textContent = '×';
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // display
    var display = document.createElement('div');
    display.className = 'aftermath-timer-display';
    display.id = 'aftermathTimerDisplay';
    display.textContent = '00:00';
    panel.appendChild(display);

    // preset buttons (1, 3, 5, 10분)
    var presets = document.createElement('div');
    presets.className = 'aftermath-timer-presets';
    var presetVals = [60, 180, 300, 600];
    var presetBtns = [];
    for (var i = 0; i < presetVals.length; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'aftermath-timer-preset-btn';
      b.setAttribute('data-sec', String(presetVals[i]));
      b.textContent = (presetVals[i] / 60) + '분';
      presets.appendChild(b);
      presetBtns.push(b);
    }
    panel.appendChild(presets);

    // controls (input + start + pause + reset)
    var controls = document.createElement('div');
    controls.className = 'aftermath-timer-controls';
    var input = document.createElement('input');
    input.type = 'number';
    input.id = 'aftermathTimerInput';
    input.className = 'aftermath-timer-input';
    input.placeholder = '초';
    input.min = '1';
    input.setAttribute('inputmode', 'numeric');
    controls.appendChild(input);
    var startBtn = document.createElement('button');
    startBtn.type = 'button';
    startBtn.className = 'aftermath-timer-ctrl-btn aftermath-timer-primary';
    startBtn.id = 'aftermathTimerStartBtn';
    startBtn.textContent = '시작';
    controls.appendChild(startBtn);
    var pauseBtn = document.createElement('button');
    pauseBtn.type = 'button';
    pauseBtn.className = 'aftermath-timer-ctrl-btn';
    pauseBtn.id = 'aftermathTimerPauseBtn';
    pauseBtn.textContent = '일시정지';
    controls.appendChild(pauseBtn);
    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'aftermath-timer-ctrl-btn';
    resetBtn.id = 'aftermathTimerResetBtn';
    resetBtn.textContent = '리셋';
    controls.appendChild(resetBtn);
    panel.appendChild(controls);

    wrap.appendChild(panel);
    document.body.appendChild(wrap);

    return {
      wrap: wrap,
      toggleBtn: toggleBtn,
      mini: mini,
      panel: panel,
      closeBtn: closeBtn,
      display: display,
      presetBtns: presetBtns,
      input: input,
      startBtn: startBtn,
      pauseBtn: pauseBtn,
      resetBtn: resetBtn
    };
  }

  /* ──────────────────────────────────────
     이벤트 바인딩 — 메인 페이지 패턴 (addEventListener)
  ────────────────────────────────────── */
  function bindEvents(nodes) {
    // toggle (펼침/접기)
    nodes.toggleBtn.addEventListener('click', function () {
      nodes.panel.hidden = !nodes.panel.hidden;
    });

    // close
    nodes.closeBtn.addEventListener('click', function () {
      nodes.panel.hidden = true;
    });

    // preset (1, 3, 5, 10분)
    for (var i = 0; i < nodes.presetBtns.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var sec = parseInt(btn.getAttribute('data-sec'), 10);
          if (!isFinite(sec) || sec <= 0) return;
          nodes.input.value = sec;
          startTimer(sec);
        });
      })(nodes.presetBtns[i]);
    }

    // start
    nodes.startBtn.addEventListener('click', function () {
      if (timer.running) return;
      if (timer.remaining > 0) { startTimer(); return; }
      var sec = parseInt(nodes.input.value, 10);
      if (!isFinite(sec) || sec <= 0) {
        sec = 60;
        nodes.input.value = sec;
      }
      startTimer(sec);
    });

    // pause
    nodes.pauseBtn.addEventListener('click', function () {
      pauseTimer();
    });

    // reset
    nodes.resetBtn.addEventListener('click', function () {
      resetTimer();
    });

    // Esc — 패널 열린 동안만 닫기
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !nodes.panel.hidden) {
        e.stopPropagation();
        nodes.panel.hidden = true;
      }
    }, true);
  }
})();
