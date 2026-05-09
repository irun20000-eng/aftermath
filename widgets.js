/* ============================================================
   aftermath floating widgets — 공통 동작
   - 타이머 위젯 (floating)
   - 문제 모아보기 (FAB + 풀스크린 모달, DOM 자동 수집)
   - innerHTML 사용 X (위젯 outer markup은 정적, 모달 콘텐츠만 cloneNode)
   - getElementById + addEventListener (메인 페이지와 동일 패턴)
   - 모든 ID 접두 aft- (충돌 차단)
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     공통 — 위젯 영속화 / 드래그 / 리사이즈 / 접기
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
    var dragging = false, startX = 0, startY = 0, baseX = 0, baseY = 0;

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
      aftSaveState(widget, key);
    }
    head.addEventListener('pointerup', endDrag);
    head.addEventListener('pointercancel', endDrag);
  }

  function aftSetupResize(widget, key) {
    var grip = widget.querySelector('.aft-widget-resize');
    if (!grip) return;
    var resizing = false, startX = 0, startY = 0, startW = 0, startH = 0;

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
     문제 모아보기 (FAB + 풀스크린 모달)
     - 학습지 본문에서 [data-aft-problem-level] 마킹된 카드 자동 수집
     - 난이도별 그룹화 (l1·l2·l3·challenge)
     - 도전 카드는 출처 배지 표시
     - 마킹된 카드 0개면 FAB 숨김
     ============================================================ */

  var GROUPS = [
    { key: 'l1',        label: '기초', icon: '🟢' },
    { key: 'l2',        label: '기본', icon: '🟡' },
    { key: 'l3',        label: '심화', icon: '🔴' },
    { key: 'challenge', label: '도전', icon: '⭐' }
  ];

  function aftInitProblemViewer() {
    var fab = document.getElementById('aft-problems-fab');
    var modal = document.getElementById('aft-problems-modal');
    var overlay = modal && modal.querySelector('.aft-modal-overlay');
    var closeBtn = document.getElementById('aft-problems-close');
    var content = document.getElementById('aft-problems-content');
    if (!fab || !modal || !content) return;

    var problems = document.querySelectorAll('[data-aft-problem-level]');
    if (problems.length === 0) {
      fab.style.display = 'none';
      return;
    }

    var rendered = false;

    function buildClone(item) {
      var clone = item.cloneNode(true);
      if (clone.id) clone.id = 'aft-clone-' + clone.id;
      clone.querySelectorAll('[id]').forEach(function (el) {
        el.id = 'aft-clone-' + el.id;
      });
      clone.classList.add('aft-problem-clone');

      var sourceLabel = item.getAttribute('data-aft-source-label');
      if (sourceLabel) {
        var badge = document.createElement('div');
        badge.className = 'aft-source-badge';
        badge.textContent = '📖 ' + sourceLabel;
        clone.insertBefore(badge, clone.firstChild);
      }
      return clone;
    }

    function buildGroupSection(g, items) {
      var section = document.createElement('section');
      section.className = 'aft-problem-group';
      section.setAttribute('data-level', g.key);

      var header = document.createElement('h4');
      header.className = 'aft-problem-group-title';
      header.textContent = g.icon + ' ' + g.label;
      section.appendChild(header);

      items.forEach(function (item) {
        section.appendChild(buildClone(item));
      });
      return section;
    }

    function renderProblems() {
      if (rendered) return;

      var byLevel = {};
      GROUPS.forEach(function (g) { byLevel[g.key] = []; });

      problems.forEach(function (problem) {
        var level = problem.getAttribute('data-aft-problem-level');
        if (byLevel[level]) byLevel[level].push(problem);
      });

      // 2-pane: 좌(학습지 l1·l2·l3) / 우(도전 challenge)
      var paneWrap = document.createElement('div');
      paneWrap.className = 'aft-problems-pane-wrap';

      var leftPane = document.createElement('div');
      leftPane.className = 'aft-problems-pane aft-problems-pane-left';
      var leftTitle = document.createElement('h3');
      leftTitle.className = 'aft-problems-pane-title';
      leftTitle.textContent = '📖 학습지 문제';
      leftPane.appendChild(leftTitle);

      var rightPane = document.createElement('div');
      rightPane.className = 'aft-problems-pane aft-problems-pane-right';
      var rightTitle = document.createElement('h3');
      rightTitle.className = 'aft-problems-pane-title';
      rightTitle.textContent = '⭐ 도전 문제';
      rightPane.appendChild(rightTitle);

      GROUPS.forEach(function (g) {
        var items = byLevel[g.key];
        if (!items || items.length === 0) return;
        var section = buildGroupSection(g, items);
        if (g.key === 'challenge') rightPane.appendChild(section);
        else leftPane.appendChild(section);
      });

      // 빈 pane이면 안내 문구
      if (leftPane.children.length === 1) {
        var emptyL = document.createElement('p');
        emptyL.className = 'aft-pane-empty';
        emptyL.textContent = '학습지 문제가 없습니다.';
        leftPane.appendChild(emptyL);
      }
      if (rightPane.children.length === 1) {
        var emptyR = document.createElement('p');
        emptyR.className = 'aft-pane-empty';
        emptyR.textContent = '도전 문제가 없습니다.';
        rightPane.appendChild(emptyR);
      }

      paneWrap.appendChild(leftPane);
      paneWrap.appendChild(rightPane);
      content.appendChild(paneWrap);

      if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([content]).catch(function () {});
      }

      rendered = true;
    }

    function openModal() {
      renderProblems();
      modal.classList.add('aft-modal-open');
      document.body.classList.add('aft-modal-locked');
    }
    function closeModal() {
      modal.classList.remove('aft-modal-open');
      document.body.classList.remove('aft-modal-locked');
    }

    fab.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('aft-modal-open')) {
        closeModal();
      }
    });
  }

  /* ============================================================
     초기화
     ============================================================ */

  function aftInit() {
    aftInitTimer();
    aftInitProblemViewer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aftInit);
  } else {
    aftInit();
  }
})();
