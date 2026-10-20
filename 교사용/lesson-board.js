/* ============================================================
   교사용 Nav — 탭 전환 + 판서 예시 칠판 그리기 (lesson-board.js)
   · .nv-tab[data-key] ↔ .nv-panel[data-key]   (#tab=<키> 로 바로가기)
   · .nv-board[data-key="concept.2"] 자리에 boardplans/<차시>.js 의
     구역(zones)과 판서 예시(ex)를 미니 칠판으로 그린다.
   · [수업 화면 열기] → 학습지 수업 모드의 같은 화면 (#lm=<키>)
   ============================================================ */
(function () {
  'use strict';
  var NUM = ['①', '②', '③', '④', '⑤', '⑥'];

  function line(src) {
    var cls = '';
    var m = /^([bgr]):/.exec(src);
    if (m) { cls = ' c-' + m[1]; src = src.slice(2); }
    // 계획 문장은 글자 그대로 — < > & 가 태그로 먹히지 않게 (PITFALLS A-3: -4<k<0 이 사라졌던 문제)
    src = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // 줄 중간 색: [[b:…]]
    src = src.replace(/\[\[([bgr]):([\s\S]*?)\]\]/g, function (_, c, t) { return '<span class="c-' + c + '">' + t + '</span>'; });
    var d = document.createElement('div');
    d.className = 'nvb-line' + cls;
    d.innerHTML = src;
    return d;
  }

  function axes(lbl, plot) {
    var x = (lbl && lbl.x) || 'x', y = (lbl && lbl.y) || 'y';
    var ns = 'http://www.w3.org/2000/svg';
    var W = 400, H = 200, L = 40, R = 385, T = 14, B = 186;
    var s = document.createElementNS(ns, 'svg');
    s.setAttribute('class', 'nvb-axes' + (plot ? ' has-plot' : ''));
    s.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    s.setAttribute('preserveAspectRatio', 'none');
    var ox = L, oy = B, body = '';
    if (plot) {
      // 판서 예시용 개형 — 계획 파일의 식을 표본점으로 그린다 (눈금 없음, 개형만)
      var f = new Function('t', 'return ' + plot.f);
      var a = plot.t[0], b = plot.t[1], n = 80, pts = [], lo = 0, hi = 0, i, tt, v;
      for (i = 0; i <= n; i++) { tt = a + (b - a) * i / n; v = f(tt); pts.push([tt, v]); if (!isFinite(v)) continue; if (v < lo) lo = v; if (v > hi) hi = v; }
      if (hi === lo) hi = lo + 1;
      var sx = function (t) { return L + (R - L) * (t - a) / (b - a); };
      var sy = function (v) { return B - (B - T) * (v - lo) / (hi - lo); };
      ox = sx(Math.max(a, Math.min(b, 0))); oy = sy(0);
      // 불연속 함수: f 가 NaN·null·±Infinity 를 돌려주는 곳에서 선을 끊는다 (점프가 세로선으로 이어지지 않게)
      var segs = [[]];
      pts.forEach(function (p) {
        if (isFinite(p[1])) segs[segs.length - 1].push(sx(p[0]).toFixed(1) + ',' + sy(p[1]).toFixed(1));
        else if (segs[segs.length - 1].length) segs.push([]);
      });
      segs.forEach(function (sg) {
        if (sg.length > 1) body += '<polyline fill="none" stroke="#1e293b" stroke-width="2.2" vector-effect="non-scaling-stroke" points="' + sg.join(' ') + '"/>';
      });
      (plot.marks || []).forEach(function (m) {
        var px = sx(m[0]), py = sy(f(m[0]));
        body += '<line x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + oy + '" stroke="#94a3b8" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>' +
          '<circle cx="' + px + '" cy="' + py + '" r="3.2" fill="' + (m[2] || '#1d4ed8') + '"/>' +
          '<text x="' + (px + 5) + '" y="' + (py - 6) + '" fill="' + (m[2] || '#1d4ed8') + '" font-size="12" font-weight="700">' + m[1] + '</text>';
      });
    }
    s.innerHTML = '<line x1="20" y1="' + oy + '" x2="392" y2="' + oy + '" stroke="#94a3b8" stroke-width="1.5" vector-effect="non-scaling-stroke"/>' +
      '<line x1="' + ox + '" y1="196" x2="' + ox + '" y2="4" stroke="#94a3b8" stroke-width="1.5" vector-effect="non-scaling-stroke"/>' +
      '<text x="384" y="' + Math.min(196, oy + 14) + '" fill="#64748b" font-size="12" font-style="italic">' + x + '</text>' +
      '<text x="' + (ox + 6) + '" y="14" fill="#64748b" font-size="12" font-style="italic">' + y + '</text>' + body;
    return s;
  }

  // 통합본(여러 차시를 한 파일에)은 window.LM_BOARD_PLANS['NN'] 에 차시별 계획을 모은다.
  // 칠판은 가장 가까운 [data-lesson] 의 계획을 쓴다. LM_BOARD_PLANS 가 없으면 기존처럼 LM_BOARD_PLAN 하나.
  function planFor(b) {
    var all = window.LM_BOARD_PLANS;
    if (all) {
      var host = b.closest ? b.closest('[data-lesson]') : null;
      return host ? all[host.getAttribute('data-lesson')] : null;
    }
    return window.LM_BOARD_PLAN;
  }
  function wsFor(b) {
    var host = b.closest ? b.closest('[data-lm-ws]') : null;
    if (!host) host = document.querySelector('[data-lm-ws]');
    return host ? host.getAttribute('data-lm-ws') : '';
  }

  function renderBoards() {
    var boards = Array.prototype.slice.call(document.querySelectorAll('.nv-board[data-key]'));
    boards.forEach(function (b) {
      var key = b.getAttribute('data-key');
      var plan = planFor(b);
      var ws = wsFor(b);
      var pp = plan && plan.pages && plan.pages[key];
      b.innerHTML = '';
      var head = document.createElement('div');
      head.className = 'nvb-head';
      var tag = document.createElement('span');
      tag.className = 'nvb-tag'; tag.textContent = '판서 예시';
      var title = document.createElement('span');
      title.className = 'nvb-title'; title.textContent = b.getAttribute('data-label') || key;
      head.appendChild(tag); head.appendChild(title);
      var srcLabel = b.getAttribute('data-src-label');       // 출처 — 학습지 칩과 같은 이름 (수업 모드 판서 공간 오른쪽 위와 같은 정보)
      if (srcLabel) {
        var chip = document.createElement('span');
        chip.className = 'src-chip';
        var rel = b.getAttribute('data-src-rel') || '';
        chip.setAttribute('data-src-rel', rel);
        chip.textContent = srcLabel;
        if (rel) {
          var badge = document.createElement('span');
          badge.className = 'src-rel'; badge.textContent = rel;
          chip.appendChild(document.createTextNode(' ')); chip.appendChild(badge);
        }
        head.appendChild(chip);
      }
      if (ws) {
        var a = document.createElement('a');
        a.className = 'nvb-open';
        a.href = ws + '?mode=class#lm=' + key;
        a.target = 'aftermath_ws_calc';
        a.textContent = '수업 화면 열기 ↗';
        head.appendChild(a);
      }
      b.appendChild(head);
      var sheet = document.createElement('div');
      sheet.className = 'nvb-sheet' + (pp && pp.bg === 'blank' ? ' bg-blank' : '');
      if (!pp) {
        var miss = document.createElement('div');
        miss.className = 'nvb-missing';
        miss.textContent = '판서 계획이 아직 없습니다 (boardplans 파일 확인).';
        sheet.appendChild(miss);
      } else {
        pp.zones.forEach(function (z, i) {
          var zone = document.createElement('div');
          zone.className = 'nvb-zone';
          zone.style.flexGrow = String(z.h || 1);
          var lb = document.createElement('span');
          lb.className = 'nvb-zlabel'; lb.textContent = NUM[i] + ' ' + String(z.t).replace(/^\s*[①-⑩]\s*/, '');
          zone.appendChild(lb);
          if (z.axes) { zone.classList.add('has-axes'); zone.appendChild(axes(z.axes === true ? null : z.axes, z.plot)); }
          var box = zone;
          if (z.axes) { box = document.createElement('div'); box.className = 'nvb-text'; zone.insertBefore(box, zone.lastChild); }
          (z.ex || []).forEach(function (src) { box.appendChild(line(src)); });
          sheet.appendChild(zone);
        });
      }
      b.appendChild(sheet);
    });
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) {
      MathJax.startup.promise.then(function () { return MathJax.typesetPromise(boards); })
        .then(function () { if (window.aftFitMath) window.aftFitMath(); })
        .catch(function () { /* 수식 조판 실패해도 원문은 보인다 */ });
    }
  }

  function initTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.nv-tab[data-key]'));
    var panels = Array.prototype.slice.call(document.querySelectorAll('.nv-panel[data-key]'));
    if (!tabs.length) return;
    function show(key, push) {
      var ok = panels.some(function (p) { return p.getAttribute('data-key') === key; });
      if (!ok) key = panels[0].getAttribute('data-key');
      tabs.forEach(function (t) { t.classList.toggle('is-on', t.getAttribute('data-key') === key); });
      panels.forEach(function (p) { p.classList.toggle('is-on', p.getAttribute('data-key') === key); });
      if (push) { try { history.replaceState(null, '', '#tab=' + key); } catch (e) { /* 무시 */ } }
      if (window.aftFitMath) setTimeout(window.aftFitMath, 30);
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        show(t.getAttribute('data-key'), true);
        var bar = document.querySelector('.nv-tabs');
        if (bar && bar.getBoundingClientRect().top < 0) bar.scrollIntoView();
      });
    });
    var m = /#tab=([\w-]+)/.exec(location.hash);
    show(m ? m[1] : tabs[0].getAttribute('data-key'), false);
  }

  // 수업 중 보기 — 판서 예시·타임라인만 크게 (태블릿·보조 화면)
  function initLive() {
    var btn = document.querySelector('.nv-live-btn');
    if (!btn) return;
    function set(on) {
      document.body.classList.toggle('nv-live', on);
      btn.classList.toggle('is-on', on);
      btn.textContent = on ? '전체 가이드 보기' : '수업 중 보기';
      try { localStorage.setItem('nv-live', on ? '1' : '0'); } catch (e) { /* 무시 */ }
      if (window.aftFitMath) setTimeout(window.aftFitMath, 30);
    }
    btn.addEventListener('click', function () { set(!document.body.classList.contains('nv-live')); });
    var saved = null;
    try { saved = localStorage.getItem('nv-live'); } catch (e) { /* 무시 */ }
    if (saved === '1') set(true);
  }

  function init() { renderBoards(); initTabs(); initLive(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
