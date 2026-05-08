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

  // ====== 시간 포맷·파싱 ======
  function aftFormat(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  }
  // "1:30" / "01:30" / "90" (단순 초) / "5:" → 모두 파싱
  function aftParseTime(str) {
    if (typeof str !== 'string') return NaN;
    str = str.trim();
    if (!str) return NaN;
    var m = str.match(/^(\d{1,3}):(\d{1,2})$/);
    if (m) {
      var min = parseInt(m[1], 10);
      var sec = parseInt(m[2], 10);
      if (isNaN(min) || isNaN(sec) || sec >= 60) return NaN;
      return min * 60 + sec;
    }
    // 콜론 없으면 분 단위로 해석 (사용자 직관)
    var n = parseInt(str, 10);
    if (isNaN(n) || n < 0) return NaN;
    return n * 60;
  }

  function aftUpdateDisplay() {
    var el = document.getElementById('aft-timer-display');
    if (!el) return;
    el.textContent = aftFormat(aftTimer.remaining);
    el.classList.remove('aft-warn', 'aft-danger');
    if (aftTimer.remaining <= 10 && aftTimer.remaining > 0) el.classList.add('aft-danger');
    else if (aftTimer.remaining <= 30 && aftTimer.remaining > 0) el.classList.add('aft-warn');
  }

  function aftSyncInput() {
    var input = document.getElementById('aft-timer-input');
    if (input) input.value = aftFormat(aftTimer.total);
  }

  function aftStart(seconds) {
    if (typeof seconds === 'number') {
      aftTimer.total = seconds;
      aftTimer.remaining = seconds;
      aftSyncInput();
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
      var state = {
        x: parseInt(widget.dataset.x || '0', 10),
        y: parseInt(widget.dataset.y || '0', 10),
        w: widget.style.width || '',
        h: widget.style.height || '',
        collapsed: widget.classList.contains('aft-collapsed')
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* 무시 */ }
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

  // ====== 초기화 ======
  function aftInit() {
    var widget = document.getElementById('aft-timer-widget');
    if (!widget) return;

    aftLoadState(widget);
    aftUpdateDisplay();
    aftSyncInput();

    // 프리셋
    widget.querySelectorAll('.aft-preset').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sec = parseInt(btn.getAttribute('data-sec'), 10);
        if (!isNaN(sec) && sec > 0) aftStart(sec);
      });
    });

    // 시작 — input.value를 항상 우선시 (단 변경 없으면 재개)
    var startBtn = document.getElementById('aft-timer-start');
    var input = document.getElementById('aft-timer-input');
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        if (aftTimer.running) return;
        var sec = input ? aftParseTime(input.value) : 60;
        if (isNaN(sec) || sec <= 0) {
          // 잘못된 입력이면 시각 피드백
          if (input) {
            input.classList.add('aft-input-error');
            setTimeout(function () { input.classList.remove('aft-input-error'); }, 1200);
            input.focus();
          }
          return;
        }
        if (sec !== aftTimer.total) {
          // input 변경됨 → 그 값으로 새로 시작
          aftStart(sec);
        } else if (aftTimer.remaining > 0) {
          // 일시정지 상태 → 재개
          aftStart();
        } else {
          // 끝남 + 변경 없음 → input 값으로 새로 시작
          aftStart(sec);
        }
      });
    }

    // 일시정지/리셋
    var pauseBtn = document.getElementById('aft-timer-pause');
    if (pauseBtn) pauseBtn.addEventListener('click', aftPause);
    var resetBtn = document.getElementById('aft-timer-reset');
    if (resetBtn) resetBtn.addEventListener('click', aftReset);

    // input 변경 — running 아닐 때만 total/remaining 동기화
    if (input) {
      input.addEventListener('change', function () {
        var sec = aftParseTime(input.value);
        if (!isNaN(sec) && sec > 0 && !aftTimer.running) {
          aftTimer.total = sec;
          aftTimer.remaining = sec;
          aftUpdateDisplay();
          input.value = aftFormat(sec); // 정규화 (e.g. "5" → "05:00")
        }
      });
      // 엔터 키로 시작
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.blur();
          if (startBtn) startBtn.click();
        }
      });
    }

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
