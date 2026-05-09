/* ============================================================
   aftermath floating widgets — 공통 동작 (타이머 + 도전 문제)
   - 정적 HTML이 학습지에 inline 작성된 후 호출됨
   - innerHTML 사용 X (위젯 outer markup은 정적, 내부 콘텐츠는 cloneNode)
   - getElementById + addEventListener (메인 페이지와 동일 패턴)
   - 함수명·ID 모두 aft prefix (충돌 차단)
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     공통 — localStorage / 드래그 / 리사이즈 / 접기
     widget마다 storage key 다르게 받음
     ============================================================ */

  function aftSaveState(widget, key) {
    try {
      var state = {
        x: parseInt(widget.dataset.x || '0', 10),
        y: parseInt(widget.dataset.y || '0', 10),
        w: widget.style.width || '',
        h: widget.style.height || '',
        collapsed: widget.classList.contains('aft-collapsed')
      };
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) { /* 무시 */ }
  }

  function aftLoadState(widget, key) {
    try {
      var raw = localStorage.getItem(key);
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

  function aftSetupDrag(widget, key) {
    var head = widget.querySelector('.aft-widget-head');
    if (!head) return;
    var dragging = false;
    var startX = 0, startY = 0, baseX = 0, baseY = 0;

    head.addEventListener('pointerdown', function (e) {
      // 헤더 안의 인터랙티브 element면 드래그 무시
      if (e.target.closest('.aft-widget-collapse, .aft-nav-btn')) return;
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
      aftSaveState(widget, key);
    }
    head.addEventListener('pointerup', endDrag);
    head.addEventListener('pointercancel', endDrag);
  }

  function aftSetupResize(widget, key) {
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
      aftSaveState(widget, key);
    }
    grip.addEventListener('pointerup', endResize);
    grip.addEventListener('pointercancel', endResize);
  }

  function aftSetupCollapse(widget, key) {
    var btn = widget.querySelector('.aft-widget-collapse');
    if (!btn) return;
    btn.addEventListener('click', function () {
      widget.classList.toggle('aft-collapsed');
      aftSaveState(widget, key);
    });
  }

  /* ============================================================
     타이머 위젯
     ============================================================ */

  var aftTimer = { total: 60, remaining: 60, running: false, intervalId: null };
  var aftAudioCtx = null;
  var TIMER_KEY = 'aft-widget-timer-state';

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

  function aftInitTimer() {
    var widget = document.getElementById('aft-timer-widget');
    if (!widget) return;

    aftLoadState(widget, TIMER_KEY);
    aftUpdateDisplay();

    widget.querySelectorAll('.aft-preset').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sec = parseInt(btn.getAttribute('data-sec'), 10);
        if (!isNaN(sec) && sec > 0) {
          var input = document.getElementById('aft-timer-input');
          if (input) input.value = sec;
          aftStart(sec);
        }
      });
    });

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
    var pauseBtn = document.getElementById('aft-timer-pause');
    if (pauseBtn) pauseBtn.addEventListener('click', aftPause);
    var resetBtn = document.getElementById('aft-timer-reset');
    if (resetBtn) resetBtn.addEventListener('click', aftReset);

    aftSetupDrag(widget, TIMER_KEY);
    aftSetupResize(widget, TIMER_KEY);
    aftSetupCollapse(widget, TIMER_KEY);
  }

  /* ============================================================
     도전 문제 위젯
     - 학습지의 <template id="aft-challenge-data">에서 콘텐츠 추출
     - 페이지네이션 (이전/다음)
     - 정답·해설 토글 (다시 누르면 숨김)
     - 콘텐츠 0개면 위젯 자체 숨김
     ============================================================ */

  var CHALLENGE_KEY = 'aft-widget-challenge-state';

  function aftInitChallenge() {
    var widget = document.getElementById('aft-challenge-widget');
    var template = document.getElementById('aft-challenge-data');
    if (!widget || !template) return;

    var items = template.content.querySelectorAll('.aft-challenge-item');
    if (!items || items.length === 0) {
      // 도전 문제 없는 학습지 → 위젯 숨김
      widget.style.display = 'none';
      return;
    }

    var contentEl = document.getElementById('aft-challenge-content');
    var counterEl = document.getElementById('aft-challenge-counter');
    var prevBtn = document.getElementById('aft-challenge-prev');
    var nextBtn = document.getElementById('aft-challenge-next');
    if (!contentEl) return;

    // 모든 문제를 한 번에 DOM에 렌더 (radio 선택 상태 유지·MathJax 1번 typeset)
    items.forEach(function (item, i) {
      var clone = item.cloneNode(true);
      clone.classList.add('aft-challenge-item');
      if (i !== 0) clone.classList.add('aft-hidden');
      contentEl.appendChild(clone);
    });

    var idx = 0;
    var pages = contentEl.querySelectorAll('.aft-challenge-item');
    var total = pages.length;

    function updateNav() {
      if (counterEl) counterEl.textContent = (idx + 1) + ' / ' + total;
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (nextBtn) nextBtn.disabled = idx === total - 1;
    }

    function show(i) {
      pages.forEach(function (el, j) {
        el.classList.toggle('aft-hidden', j !== i);
      });
      idx = i;
      updateNav();
    }

    if (prevBtn) prevBtn.addEventListener('click', function () {
      if (idx > 0) show(idx - 1);
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      if (idx < total - 1) show(idx + 1);
    });

    // 정답·해설 토글 (모든 페이지에 binding)
    pages.forEach(function (page) {
      var ansBtn = page.querySelector('.aft-challenge-answer');
      var ansText = page.querySelector('.aft-challenge-answer-text');
      if (ansBtn && ansText) {
        ansBtn.addEventListener('click', function () {
          if (ansText.hasAttribute('hidden')) {
            ansText.removeAttribute('hidden');
            ansBtn.classList.add('active');
          } else {
            ansText.setAttribute('hidden', '');
            ansBtn.classList.remove('active');
          }
        });
      }
      var expBtn = page.querySelector('.aft-challenge-explain');
      var expText = page.querySelector('.aft-challenge-explain-text');
      if (expBtn && expText) {
        expBtn.addEventListener('click', function () {
          if (expText.hasAttribute('hidden')) {
            expText.removeAttribute('hidden');
            expBtn.classList.add('active');
          } else {
            expText.setAttribute('hidden', '');
            expBtn.classList.remove('active');
          }
        });
      }
    });

    updateNav();

    // MathJax 콘텐츠 typeset
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([contentEl]).catch(function () {});
    }

    aftLoadState(widget, CHALLENGE_KEY);
    aftSetupDrag(widget, CHALLENGE_KEY);
    aftSetupResize(widget, CHALLENGE_KEY);
    aftSetupCollapse(widget, CHALLENGE_KEY);
  }

  /* ============================================================
     초기화
     ============================================================ */

  function aftInit() {
    aftInitTimer();
    aftInitChallenge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aftInit);
  } else {
    aftInit();
  }
})();
