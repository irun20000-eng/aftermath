/* ============================================================
   aftermath floating widgets — 공통 동작 (타이머)
   - 정적 HTML이 학습지에 inline 작성된 후 호출됨
   - innerHTML 사용 X (갤럭시탭 Samsung Internet 호환성)
   - getElementById + addEventListener (메인 페이지와 동일 패턴)
   - 함수명에 aft prefix (ID와 충돌 차단)
   ============================================================ */
(function () {
  'use strict';

  // ====== 타이머 ======
  var aftTimer = { total: 60, remaining: 60, running: false, intervalId: null };
  var aftAudioCtx = null;

  function aftGetAudio() {
    if (!aftAudioCtx) {
      try { aftAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    return aftAudioCtx;
  }
  function aftPlayTick(freq, dur) {
    var ctx = aftGetAudio();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }
  function aftPlayEnd() {
    [880, 660, 880, 660].forEach(function (f, i) {
      setTimeout(function () { aftPlayTick(f, 0.2); }, i * 200);
    });
  }

  function aftFormat(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  }

  function aftUpdateDisplay() {
    var el = document.getElementById('aft-timer-display');
    if (!el) return;
    el.textContent = aftFormat(aftTimer.remaining);
    el.classList.remove('aft-warn', 'aft-danger');
    if (aftTimer.remaining <= 10 && aftTimer.remaining > 0) el.classList.add('aft-danger');
    else if (aftTimer.remaining <= 30 && aftTimer.remaining > 0) el.classList.add('aft-warn');
  }

  function aftStart(seconds) {
    if (typeof seconds === 'number') {
      aftTimer.total = seconds;
      aftTimer.remaining = seconds;
    }
    if (aftTimer.remaining <= 0) return;
    if (aftTimer.intervalId) clearInterval(aftTimer.intervalId);
    aftTimer.running = true;
    aftUpdateDisplay();
    aftTimer.intervalId = setInterval(function () {
      aftTimer.remaining--;
      aftUpdateDisplay();
      if (aftTimer.remaining <= 5 && aftTimer.remaining > 0) aftPlayTick(880, 0.1);
      if (aftTimer.remaining <= 0) {
        clearInterval(aftTimer.intervalId);
        aftTimer.intervalId = null;
        aftTimer.running = false;
        aftPlayEnd();
      }
    }, 1000);
  }
  function aftPause() {
    if (aftTimer.intervalId) {
      clearInterval(aftTimer.intervalId);
      aftTimer.intervalId = null;
    }
    aftTimer.running = false;
  }
  function aftReset() {
    aftPause();
    aftTimer.remaining = aftTimer.total;
    aftUpdateDisplay();
  }

  // ====== 위치/크기/접힘 영속화 ======
  var STORAGE_KEY = 'aft-widget-timer-state';

  function aftSaveState(widget) {
    try {
      var rect = widget.getBoundingClientRect();
      var state = {
        x: parseInt(widget.dataset.x || '0', 10),
        y: parseInt(widget.dataset.y || '0', 10),
        w: widget.style.width || '',
        h: widget.style.height || '',
        collapsed: widget.classList.contains('aft-collapsed')
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* localStorage 실패 무시 */ }
  }

  function aftLoadState(widget) {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (typeof s.x === 'number' && typeof s.y === 'number') {
        widget.dataset.x = s.x;
        widget.dataset.y = s.y;
        widget.style.transform = 'translate3d(' + s.x + 'px, ' + s.y + 'px, 0)';
      }
      if (s.w) widget.style.width = s.w;
      if (s.h) widget.style.height = s.h;
      if (s.collapsed) widget.classList.add('aft-collapsed');
    } catch (e) { /* 무시 */ }
  }

  // ====== 드래그 (헤더) ======
  function aftSetupDrag(widget) {
    var head = widget.querySelector('.aft-widget-head');
    if (!head) return;

    var dragging = false;
    var startX = 0, startY = 0, baseX = 0, baseY = 0;

    head.addEventListener('pointerdown', function (e) {
      // 접기 버튼 등 다른 인터랙티브 요소면 무시
      if (e.target.closest('.aft-widget-collapse')) return;
      dragging = true;
      try { head.setPointerCapture(e.pointerId); } catch (err) {}
      startX = e.clientX;
      startY = e.clientY;
      baseX = parseInt(widget.dataset.x || '0', 10);
      baseY = parseInt(widget.dataset.y || '0', 10);
      e.preventDefault();
    });
    head.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var nx = baseX + (e.clientX - startX);
      var ny = baseY + (e.clientY - startY);
      widget.dataset.x = nx;
      widget.dataset.y = ny;
      widget.style.transform = 'translate3d(' + nx + 'px, ' + ny + 'px, 0)';
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      try { head.releasePointerCapture(e.pointerId); } catch (err) {}
      aftSaveState(widget);
    }
    head.addEventListener('pointerup', endDrag);
    head.addEventListener('pointercancel', endDrag);
  }

  // ====== 리사이즈 (우하단 corner) ======
  function aftSetupResize(widget) {
    var grip = widget.querySelector('.aft-widget-resize');
    if (!grip) return;

    var resizing = false;
    var startX = 0, startY = 0, startW = 0, startH = 0;

    grip.addEventListener('pointerdown', function (e) {
      resizing = true;
      try { grip.setPointerCapture(e.pointerId); } catch (err) {}
      startX = e.clientX;
      startY = e.clientY;
      var rect = widget.getBoundingClientRect();
      startW = rect.width;
      startH = rect.height;
      e.preventDefault();
      e.stopPropagation();
    });
    grip.addEventListener('pointermove', function (e) {
      if (!resizing) return;
      var nw = Math.max(220, startW + (e.clientX - startX));
      var nh = Math.max(120, startH + (e.clientY - startY));
      widget.style.width = nw + 'px';
      widget.style.height = nh + 'px';
    });
    function endResize(e) {
      if (!resizing) return;
      resizing = false;
      try { grip.releasePointerCapture(e.pointerId); } catch (err) {}
      aftSaveState(widget);
    }
    grip.addEventListener('pointerup', endResize);
    grip.addEventListener('pointercancel', endResize);
  }

  // ====== 접기/펼치기 ======
  function aftSetupCollapse(widget) {
    var btn = widget.querySelector('.aft-widget-collapse');
    if (!btn) return;
    btn.addEventListener('click', function () {
      widget.classList.toggle('aft-collapsed');
      aftSaveState(widget);
    });
  }

  // ====== 초기화 — DOMContentLoaded ======
  function aftInit() {
    var widget = document.getElementById('aft-timer-widget');
    if (!widget) return;

    // 상태 복원
    aftLoadState(widget);

    // 디스플레이 초기 표시
    aftUpdateDisplay();

    // 프리셋 버튼들
    var presets = widget.querySelectorAll('.aft-preset');
    presets.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sec = parseInt(btn.getAttribute('data-sec'), 10);
        if (!isNaN(sec) && sec > 0) {
          var input = document.getElementById('aft-timer-input');
          if (input) input.value = sec;
          aftStart(sec);
        }
      });
    });

    // 시작 버튼
    var startBtn = document.getElementById('aft-timer-start');
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        if (aftTimer.running) return;
        if (aftTimer.remaining > 0) { aftStart(); return; }
        var input = document.getElementById('aft-timer-input');
        var sec = input ? parseInt(input.value, 10) : 60;
        if (!isNaN(sec) && sec > 0) aftStart(sec);
      });
    }

    // 일시정지/리셋
    var pauseBtn = document.getElementById('aft-timer-pause');
    if (pauseBtn) pauseBtn.addEventListener('click', aftPause);
    var resetBtn = document.getElementById('aft-timer-reset');
    if (resetBtn) resetBtn.addEventListener('click', aftReset);

    // input 변경 시 total 동기화 (시작 누르기 전이면)
    var input = document.getElementById('aft-timer-input');
    if (input) {
      input.addEventListener('change', function () {
        var sec = parseInt(input.value, 10);
        if (!isNaN(sec) && sec > 0 && !aftTimer.running) {
          aftTimer.total = sec;
          aftTimer.remaining = sec;
          aftUpdateDisplay();
        }
      });
    }

    // 드래그·리사이즈·접기
    aftSetupDrag(widget);
    aftSetupResize(widget);
    aftSetupCollapse(widget);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aftInit);
  } else {
    aftInit();
  }
})();
