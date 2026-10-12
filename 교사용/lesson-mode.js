/* ============================================================
   aftermath 수업 모드 (전자칠판용) — lesson-mode.js
   ------------------------------------------------------------
   학습지 본문은 건드리지 않는다. 켜면 섹션을 탭으로, 섹션 안 단위
   (개념 블록·문항)를 한 화면씩 왼쪽에 옮겨 보여 주고, 오른쪽은
   전자칠판 필기모드로 쓰는 빈 판서 공간으로 둔다. 끄면 원위치.

   켜는 법  : 상단 [수업 모드] 버튼 · 주소 ?mode=class
   바로가기 : #lm=<탭키>.<번호>  (예: #lm=concept.3)
   키보드   : ←/→ · PageUp/PageDown(프레젠터) 이전/다음, 1~9 탭
   판서 구역: window.LM_BOARD_PLAN (boardplans/<차시>.js) 이 있으면
              페이지별 구역 틀(①②③ 제목)을 그린다. 없으면 빈 칠판.
   ============================================================ */
(function () {
  'use strict';

  // 통합본(여러 학습지를 합친 문서)에서는 동작하지 않는다
  if (document.querySelectorAll('header h1').length > 1) return;

  // 번호가 아니라 제목 낱말로 판단한다 (마무리 차시는 '02. 중단원 성찰' 처럼 번호가 다르다)
  var TAB_RULES = [
    { re: /성찰/, key: 'reflect', name: '성찰', split: 'none' },
    { re: /생각\s*열기/, key: 'warmup', name: '생각 열기', split: 'none' },
    { re: /개념\s*구성/, key: 'concept', name: '개념 구성', split: 'blocks' },
    { re: /수준별/, key: 'level', name: '수준별 훈련', split: 'problems' },
    { re: /형성평가/, key: 'check', name: '형성평가', split: 'none' },
    { re: /도전\s*문제/, key: 'challenge', name: '도전', split: 'none', merge: true },
    { re: /실전/, key: 'practice', name: '실전 훈련', split: 'problems' }
  ];
  var ZONE_NUM = ['①', '②', '③', '④', '⑤', '⑥'];

  var state = { on: false, tab: 0, page: 0, bg: null, zones: true, wide: false, cls: null };
  var tabs = [];          // [{key,name,pages:[{el,sub}]}]
  var homes = [];         // 원위치 복원용 [{el, marker}]
  var app, ui = {};
  var rootFontBefore = '';
  var timer = { left: 0, total: 0, id: null };

  /* ---------- 유틸 ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function plan() { return window.LM_BOARD_PLAN || null; }
  function lessonLabel() {
    var p = plan();
    if (p && p.title) return p.title;
    var s = $all('header span').map(txt).filter(function (t) { return /차시/.test(t); })[0];
    return s || document.title;
  }

  /* ---------- 섹션 → 탭/페이지 수집 ---------- */
  function collect() {
    tabs = [];
    var sections = $all('section.card');
    sections.forEach(function (sec, i) {
      var h2 = $('h2', sec);
      var title = txt(h2).replace(/\s*\(.*\)\s*$/, '');
      var rule = TAB_RULES.filter(function (r) { return r.re.test(title); })[0] ||
        { key: 'sec' + i, name: title, split: 'none' };
      var tab = tabs[tabs.length - 1];
      if (!(rule.merge && tab && tab.key === rule.key)) {
        tab = { key: rule.key, name: rule.name, pages: [] };
        tabs.push(tab);
      }
      var units = [];
      if (rule.split === 'blocks') {
        var wrap = $('.space-y-8', sec);
        if (wrap) units = Array.prototype.slice.call(wrap.children).map(function (el) {
          var t = $('h3', el);
          var sub = txt(t).replace(/^\d+\s*/, '');
          // 제목 안 수식은 조판된 모양 그대로 보이도록 노드를 복제해 둔다
          var subNode = null;
          if (t) {
            subNode = document.createDocumentFragment();
            Array.prototype.forEach.call(t.childNodes, function (n, k) {
              if (k === 1 && n.nodeType === 1 && n.tagName === 'SPAN' && /^\d+$/.test(txt(n))) return; // 번호 동그라미
              subNode.appendChild(n.cloneNode(true));
            });
          }
          return { el: el, sub: sub, subNode: subNode };
        });
      } else if (rule.split === 'problems') {
        $all('.badge', sec).forEach(function (b) {
          var el = b.parentElement;
          var lvlHead = el.closest('.space-y-6');
          var lv = lvlHead ? txt($('h3', lvlHead)) : '';
          var q = txt(el).match(/(\d+)\.\s/);
          units.push({ el: el, sub: (lv ? lv + ' · ' : '') + (q ? q[1] + '번' : txt(b)) });
        });
      }
      if (!units.length) units = [{ el: sec, sub: rule.merge ? title.replace(/^⭐\s*/, '') : rule.name, whole: true }];
      units.forEach(function (u) { tab.pages.push(u); });
    });
  }

  /* ---------- 반 · 진도 기억 ---------- */
  function classes() { return window.LM_CLASSES || ['1', '4', '7', '10']; }
  function progKey() { return 'lm:prog:' + location.pathname; }
  function loadProg() {
    try { return JSON.parse(localStorage.getItem(progKey()) || 'null') || { cls: classes()[0], pos: {} }; }
    catch (e) { return { cls: classes()[0], pos: {} }; }
  }
  function saveProg() {
    if (!state.cls) return;
    var pr = loadProg();
    pr.cls = state.cls;
    pr.pos[state.cls] = { t: state.tab, p: state.page };
    try { localStorage.setItem(progKey(), JSON.stringify(pr)); } catch (e) { /* 무시 */ }
  }
  function setClass(c) {
    if (c === state.cls) return;
    saveProg();
    state.cls = c;
    var pos = loadProg().pos[c];
    go(pos ? pos.t : 0, pos ? pos.p : 0);
    openPickerSilently(function (api) { api.setClass(c); });
  }

  /* ---------- 탭 시간 (판서 계획의 minutes) ---------- */
  function tabMinutes(i) {
    var p = plan(), t = tabs[i];
    return (p && p.minutes && t && p.minutes[t.key]) || 0;
  }

  /* ---------- 팝업 메뉴 ---------- */
  function closePops() {
    if (!app) return;
    $all('.lm-pop.is-open', app).forEach(function (x) { x.classList.remove('is-open'); });
  }
  function togglePop(menu, btn) {
    var open = !menu.classList.contains('is-open');
    closePops();
    if (!open) return;
    var r = btn.getBoundingClientRect();
    menu.style.top = Math.round(r.bottom + 6) + 'px';
    menu.style.right = Math.max(8, Math.round(window.innerWidth - r.right)) + 'px';
    menu.classList.add('is-open');
  }

  /* ---------- 학생 뽑기 연동 (같은 사이트의 뽑기 창 iframe 에 직접 명령) ---------- */
  function pickerApi() {
    var f = document.querySelector('#aft-picker-modal iframe');
    try { return f && f.contentWindow && f.contentWindow.aftPicker; } catch (e) { return null; }
  }
  function withPicker(fn) {
    var tries = 0;
    (function wait() {
      var api = pickerApi();
      if (api) { fn(api); return; }
      if (++tries < 60) setTimeout(wait, 120);
    })();
  }
  function openPicker(fn) {
    var fab = document.getElementById('aft-picker-fab');
    if (!fab) { window.open('뽑기_미적분I.html#class=' + (state.cls || ''), 'aftermath_picker_calc'); return; }
    var modal = document.getElementById('aft-picker-modal');
    if (!modal || !modal.classList.contains('is-open')) fab.click();
    withPicker(fn);
  }
  // 창을 열지 않고 (이미 만들어진 경우에만) 반만 맞춘다
  function openPickerSilently(fn) { var api = pickerApi(); if (api) fn(api); }

  /* ---------- 정답·풀이 한 번에 열기/닫기 ---------- */
  function revealTargets() {
    return { boxes: $all('.reveal-box', ui.page), dets: $all('details', ui.page) };
  }
  function anyClosed(r) {
    return r.boxes.some(function (b) { return !b.classList.contains('active'); }) ||
      r.dets.some(function (d) { return !d.open; });
  }
  function updateReveal() {
    var r = revealTargets();
    ui.reveal.style.display = (r.boxes.length + r.dets.length) ? '' : 'none';
    var closed = anyClosed(r);
    ui.reveal.textContent = closed ? '정답·풀이 열기' : '정답·풀이 닫기';
    ui.reveal.classList.toggle('is-on', !closed);
  }
  function revealAll() {
    var r = revealTargets(), open = anyClosed(r);
    r.boxes.forEach(function (b) {
      if (open) {
        if (!b.classList.contains('active')) {
          if (typeof window.toggleReveal === 'function') window.toggleReveal(b); else b.classList.add('active');
        }
      } else b.classList.remove('active');
    });
    r.dets.forEach(function (d) { d.open = open; });
    updateReveal();
    setTimeout(fit, 400);
  }

  /* ---------- 화면 만들기 ---------- */
  function build() {
    app = h('div', 'lm-app');
    app.setAttribute('role', 'application');
    app.setAttribute('aria-label', '수업 모드');

    // 상단 바
    var bar = h('div', 'lm-bar');
    var title = h('div', 'lm-title');
    title.appendChild(h('small', null, '수업 모드'));
    title.appendChild(document.createTextNode(lessonLabel()));
    ui.tabs = h('div', 'lm-tabs');
    tabs.forEach(function (t, i) {
      var b = h('button', 'lm-tab');
      b.type = 'button';
      b.appendChild(h('span', 'lm-k', String(i + 1)));
      b.appendChild(document.createTextNode(t.name));
      var mm = tabMinutes(i);
      if (mm) b.appendChild(h('span', 'lm-min', mm + '′'));
      b.addEventListener('click', function () { go(i, 0); });
      ui.tabs.appendChild(b);
    });

    var tools = h('div', 'lm-tools');

    // 반 선택 — 반마다 진도를 따로 기억하고, 학생 뽑기도 이 반으로 연다
    ui.clsBtn = h('button', 'lm-btn lm-cls');
    ui.clsBtn.type = 'button';
    ui.clsBtn.title = '반 바꾸기 (반마다 진도를 따로 기억)';
    ui.clsMenu = h('div', 'lm-pop lm-cls-pop');
    classes().forEach(function (c) {
      var b = h('button', 'lm-btn', c + '반');
      b.type = 'button';
      b.setAttribute('data-cls', c);
      b.addEventListener('click', function () { setClass(c); closePops(); });
      ui.clsMenu.appendChild(b);
    });
    ui.clsBtn.addEventListener('click', function (e) { e.stopPropagation(); togglePop(ui.clsMenu, ui.clsBtn); });
    tools.appendChild(ui.clsBtn);

    // 타이머 — [이 단계 N′] 는 지금 탭의 타임라인 시간
    var tm = h('div', 'lm-timer');
    ui.time = h('button', 'lm-time', '00:00');
    ui.time.type = 'button';
    ui.time.title = '눌러서 시작/일시정지';
    ui.time.addEventListener('click', timerToggle);
    tm.appendChild(ui.time);
    ui.stepBtn = h('button', 'lm-btn lm-step');
    ui.stepBtn.type = 'button';
    ui.stepBtn.title = '이 단계 시간으로 타이머 시작';
    ui.stepBtn.addEventListener('click', function () { var m = tabMinutes(state.tab); if (m) timerSet(m * 60, true); });
    tm.appendChild(ui.stepBtn);
    [1, 3, 5].forEach(function (m) {
      var b = h('button', 'lm-btn', m + '분');
      b.type = 'button';
      b.addEventListener('click', function () { timerSet(m * 60, true); });
      tm.appendChild(b);
    });
    var rs = h('button', 'lm-btn', '↺');
    rs.type = 'button'; rs.title = '타이머 초기화';
    rs.addEventListener('click', function () { timerSet(0, false); });
    tm.appendChild(rs);
    tools.appendChild(tm);
    tools.appendChild(h('span', 'lm-sep'));

    // 학생 뽑기 — [1명] 은 창을 거치지 않고 바로 뽑는다 (누를 때마다 한 명씩 추가)
    var pk = h('div', 'lm-seg lm-pick');
    var one = h('button', 'lm-btn is-on', '🎲 1명');
    one.type = 'button';
    one.title = '지금 반에서 바로 1명 뽑기 (누를 때마다 한 명 추가)';
    one.addEventListener('click', function () {
      openPicker(function (api) {
        // 결과 [확인] 을 누르면 뽑기 창도 닫고 수업 화면으로 돌아온다
        Promise.resolve(api.quick(1, state.cls)).then(function () {
          var c = document.querySelector('#aft-picker-modal button[data-picker-close]');
          var m = document.getElementById('aft-picker-modal');
          if (c && m && m.classList.contains('is-open')) c.click();
        });
      });
    });
    var full = h('button', 'lm-btn', '뽑기 창');
    full.type = 'button';
    full.title = '모둠 뽑기 · 인원 설정 · 결석 표시';
    full.addEventListener('click', function () { openPicker(function (api) { api.setClass(state.cls); }); });
    pk.appendChild(one); pk.appendChild(full);
    tools.appendChild(pk);
    tools.appendChild(h('span', 'lm-sep'));

    // 판서 메뉴 — 배경 · 구역 틀 · 판서 넓게
    ui.boardBtn = h('button', 'lm-btn', '판서 ▾');
    ui.boardBtn.type = 'button';
    ui.boardMenu = h('div', 'lm-pop lm-board-pop');
    var seg = h('div', 'lm-seg');
    ui.bgBtns = {};
    [['blank', '빈칸'], ['grid', '모눈'], ['axes', '좌표']].forEach(function (p) {
      var b = h('button', 'lm-btn', p[1]);
      b.type = 'button';
      b.addEventListener('click', function () { state.bg = p[0]; renderBoard(); });
      ui.bgBtns[p[0]] = b;
      seg.appendChild(b);
    });
    ui.boardMenu.appendChild(seg);
    ui.zoneBtn = h('button', 'lm-btn', '구역 틀');
    ui.zoneBtn.type = 'button';
    ui.zoneBtn.addEventListener('click', function () { state.zones = !state.zones; renderBoard(); });
    ui.boardMenu.appendChild(ui.zoneBtn);
    ui.wideBtn = h('button', 'lm-btn', '판서 넓게');
    ui.wideBtn.type = 'button';
    ui.wideBtn.addEventListener('click', function () {
      state.wide = !state.wide;
      app.classList.toggle('is-wide', state.wide);
      ui.wideBtn.classList.toggle('is-on', state.wide);
      fit();
    });
    ui.boardMenu.appendChild(ui.wideBtn);
    ui.boardBtn.addEventListener('click', function (e) { e.stopPropagation(); togglePop(ui.boardMenu, ui.boardBtn); });
    ui.boardMenu.addEventListener('click', function (e) { e.stopPropagation(); });
    tools.appendChild(ui.boardBtn);

    var ex = h('button', 'lm-btn lm-exit', '나가기');
    ex.type = 'button';
    ex.addEventListener('click', exit);
    tools.appendChild(ex);

    bar.appendChild(title); bar.appendChild(ui.tabs); bar.appendChild(tools);

    // 본문
    var main = h('div', 'lm-main');
    var left = h('div', 'lm-left');
    var head = h('div', 'lm-head');
    ui.tabname = h('span', 'lm-tabname');
    ui.sub = h('span', 'lm-sub');
    ui.count = h('span', 'lm-count');
    ui.reveal = h('button', 'lm-reveal', '정답·풀이 열기');
    ui.reveal.type = 'button';
    ui.reveal.addEventListener('click', revealAll);
    head.appendChild(ui.tabname); head.appendChild(ui.sub); head.appendChild(ui.reveal); head.appendChild(ui.count);
    ui.body = h('div', 'lm-body');
    ui.page = h('div', 'lm-page');
    ui.body.appendChild(ui.page);
    var foot = h('div', 'lm-foot');
    ui.prev = h('button', 'lm-nav', '◀ 이전');
    ui.prev.type = 'button';
    ui.prev.addEventListener('click', function () { step(-1); });
    ui.dots = h('div', 'lm-dots');
    ui.next = h('button', 'lm-nav lm-next', '다음 ▶');
    ui.next.type = 'button';
    ui.next.addEventListener('click', function () { step(1); });
    foot.appendChild(ui.prev); foot.appendChild(ui.dots); foot.appendChild(ui.next);
    left.appendChild(head); left.appendChild(ui.body); left.appendChild(foot);

    ui.board = h('div', 'lm-board');
    main.appendChild(left); main.appendChild(ui.board);

    app.appendChild(bar); app.appendChild(main);
    app.appendChild(ui.clsMenu); app.appendChild(ui.boardMenu);
    document.body.appendChild(app);
    app.addEventListener('click', closePops);

    // 본문 안 정답 상자·힌트를 열면 다시 맞춤
    ui.page.addEventListener('click', function () { setTimeout(function () { fit(); updateReveal(); }, 350); });
    ui.page.addEventListener('toggle', function () { setTimeout(fit, 50); }, true);
  }

  /* ---------- 페이지 이동 ---------- */
  function go(t, p) {
    if (t < 0 || t >= tabs.length) return;
    var pages = tabs[t].pages;
    if (p < 0) p = pages.length - 1;
    if (p >= pages.length) p = pages.length - 1;
    // 이전 페이지 내용을 원위치로
    while (ui.page.firstChild) restoreOne(ui.page.firstChild);
    if (t !== state.tab || p !== state.page) state.bg = null;   // 배경 수동 선택은 그 화면에서만
    state.tab = t; state.page = p;
    var u = pages[p];
    park(u.el);
    ui.page.appendChild(u.el);
    renderChrome();
    renderBoard();
    fit();
    try {
      history.replaceState(null, '', location.pathname + location.search + '#lm=' + tabs[t].key + '.' + (p + 1));
      sessionStorage.setItem('lm:' + location.pathname, JSON.stringify({ t: t, p: p, bg: state.bg, z: state.zones, w: state.wide }));
      saveProg();
    } catch (e) { /* 무시 */ }
  }
  function step(d) {
    var t = state.tab, p = state.page + d;
    if (p >= tabs[t].pages.length) { if (t + 1 < tabs.length) go(t + 1, 0); return; }
    if (p < 0) { if (t > 0) go(t - 1, tabs[t - 1].pages.length - 1); return; }
    go(t, p);
  }

  // 원위치 표식을 남기고 옮긴다
  function park(el) {
    if (homes.some(function (x) { return x.el === el; })) return;
    var m = document.createComment('lm-home');
    el.parentNode.insertBefore(m, el);
    homes.push({ el: el, marker: m });
  }
  function restoreOne(el) {
    for (var i = 0; i < homes.length; i++) {
      if (homes[i].el === el) {
        homes[i].marker.parentNode.insertBefore(el, homes[i].marker);
        homes[i].marker.parentNode.removeChild(homes[i].marker);
        homes.splice(i, 1);
        return;
      }
    }
    el.parentNode.removeChild(el);
  }

  function renderChrome() {
    var t = tabs[state.tab], u = t.pages[state.page];
    $all('.lm-tab', ui.tabs).forEach(function (b, i) { b.classList.toggle('is-on', i === state.tab); });
    ui.tabname.textContent = t.name;
    ui.sub.textContent = '';
    if (u.subNode) ui.sub.appendChild(u.subNode.cloneNode(true));
    else ui.sub.textContent = u.sub || '';
    ui.page.setAttribute('data-tab', t.key);
    var total = 0, idx = 0;
    tabs.forEach(function (x, i) { if (i < state.tab) idx += x.pages.length; total += x.pages.length; });
    idx += state.page + 1;
    ui.count.textContent = (t.pages.length > 1 ? (state.page + 1) + '/' + t.pages.length + ' · ' : '') + '전체 ' + idx + '/' + total;
    var mm = tabMinutes(state.tab);
    ui.stepBtn.textContent = mm ? '이 단계 ' + mm + '′' : '';
    ui.stepBtn.style.display = mm ? '' : 'none';
    ui.clsBtn.textContent = (state.cls || '') + '반 ▾';
    $all('[data-cls]', ui.clsMenu).forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-cls') === state.cls); });
    updateReveal();
    ui.dots.innerHTML = '';
    if (t.pages.length > 1) {
      t.pages.forEach(function (_, i) {
        var d = h('button', 'lm-dot' + (i === state.page ? ' is-on' : ''), String(i + 1));
        d.type = 'button';
        d.addEventListener('click', function () { go(state.tab, i); });
        ui.dots.appendChild(d);
      });
    }
    var last = state.tab === tabs.length - 1 && state.page === t.pages.length - 1;
    ui.prev.disabled = state.tab === 0 && state.page === 0;
    ui.next.disabled = last;
    var a = tabs[state.tab + 1];
    ui.next.textContent = (state.page === t.pages.length - 1 && a) ? a.name + ' ▶' : '다음 ▶';
    var ae = ui.tabs.children[state.tab];
    if (ae && ae.scrollIntoView) ae.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  /* ---------- 판서 공간 ---------- */
  function pagePlan() {
    var p = plan();
    if (!p || !p.pages) return null;
    return p.pages[tabs[state.tab].key + '.' + (state.page + 1)] || null;
  }
  function axesSVG(lbl, small) {
    var x = (lbl && lbl.x) || 'x', y = (lbl && lbl.y) || 'y';
    var ns = 'http://www.w3.org/2000/svg';
    var s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 1000 600');
    s.setAttribute('preserveAspectRatio', 'none');
    var c = small ? '#94a3b8' : '#64748b';
    s.innerHTML =
      '<defs><marker id="lmArr' + (small ? 's' : 'b') + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="' + c + '"/></marker></defs>' +
      '<line x1="40" y1="' + (small ? 540 : 420) + '" x2="975" y2="' + (small ? 540 : 420) + '" stroke="' + c + '" stroke-width="3" vector-effect="non-scaling-stroke" marker-end="url(#lmArr' + (small ? 's' : 'b') + ')"/>' +
      '<line x1="90" y1="585" x2="90" y2="20" stroke="' + c + '" stroke-width="3" vector-effect="non-scaling-stroke" marker-end="url(#lmArr' + (small ? 's' : 'b') + ')"/>';
    var lx = document.createElementNS(ns, 'text');
    lx.setAttribute('x', '950'); lx.setAttribute('y', small ? '585' : '465');
    lx.setAttribute('fill', c); lx.setAttribute('font-size', '34'); lx.setAttribute('font-style', 'italic');
    lx.textContent = x;
    var ly = document.createElementNS(ns, 'text');
    ly.setAttribute('x', '110'); ly.setAttribute('y', '45');
    ly.setAttribute('fill', c); ly.setAttribute('font-size', '34'); ly.setAttribute('font-style', 'italic');
    ly.textContent = y;
    s.appendChild(lx); s.appendChild(ly);
    return s;
  }
  function renderBoard() {
    var pp = pagePlan();
    var bg = state.bg || (pp && pp.bg) || 'grid';
    ui.board.innerHTML = '';
    ui.board.className = 'lm-board' + (bg === 'grid' ? ' bg-grid' : '');
    Object.keys(ui.bgBtns).forEach(function (k) { ui.bgBtns[k].classList.toggle('is-on', k === bg); });
    ui.zoneBtn.classList.toggle('is-on', state.zones);
    if (bg === 'axes') {
      var ax = h('div', 'lm-board-axes');
      ax.appendChild(axesSVG(pp && pp.axes, false));
      ui.board.appendChild(ax);
    }
    var zones = h('div', 'lm-zones' + (state.zones ? '' : ' is-hidden'));
    if (pp && pp.zones && pp.zones.length) {
      pp.zones.forEach(function (z, i) {
        var d = h('div', 'lm-zone');
        d.style.flexGrow = String(z.h || 1);
        d.appendChild(h('span', 'lm-zone-label', ZONE_NUM[i] + ' ' + String(z.t).replace(/^\s*[①-⑩]\s*/, '')));
        if (z.axes) d.appendChild(axesSVG(z.axes === true ? null : z.axes, true));
        zones.appendChild(d);
      });
      ui.board.appendChild(zones);
    }
    ui.board.appendChild(h('span', 'lm-board-note', '전자칠판 필기모드로 이 공간에 판서'));
  }

  /* ---------- 한 화면 맞춤: 글자 크기로 줄인다 (transform 금지 — PITFALLS C-9) ---------- */
  function fit() {
    if (!state.on) return;
    var root = document.documentElement;
    var vw = window.innerWidth;
    var max = Math.max(16, Math.min(32, Math.round(vw / 1920 * 28)));   // 짧은 문항은 크게 (교실 뒤에서도 읽히게)
    var min = 12;
    var size = max;
    ui.body.classList.remove('is-scroll');
    root.style.fontSize = size + 'px';
    while (size > min && ui.body.scrollHeight > ui.body.clientHeight + 1) {
      size -= 1;
      root.style.fontSize = size + 'px';
    }
    // 하한에서도 넘치면 그 화면만 스크롤 허용 (내용을 잃지 않는다)
    if (ui.body.scrollHeight > ui.body.clientHeight + 1) ui.body.classList.add('is-scroll');
    ui.body.scrollTop = 0;
  }

  /* ---------- 타이머 ---------- */
  function fmt(s) { var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r; }
  function timerDraw() {
    ui.time.textContent = fmt(timer.left);
    ui.time.classList.toggle('is-run', !!timer.id);
  }
  function timerSet(sec, start) {
    clearInterval(timer.id); timer.id = null;
    timer.left = sec; timer.total = sec;
    ui.time.classList.remove('is-done');
    timerDraw();
    if (start && sec > 0) timerToggle();
  }
  function timerToggle() {
    if (timer.id) { clearInterval(timer.id); timer.id = null; timerDraw(); return; }
    if (timer.left <= 0) return;
    ui.time.classList.remove('is-done');
    timer.id = setInterval(function () {
      timer.left -= 1;
      if (timer.left <= 0) {
        timer.left = 0; clearInterval(timer.id); timer.id = null;
        ui.time.classList.remove('is-done'); void ui.time.offsetWidth; ui.time.classList.add('is-done');
      }
      timerDraw();
    }, 1000);
    timerDraw();
  }

  /* ---------- 키보드 ---------- */
  function onKey(e) {
    if (!state.on || e.isComposing) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    var picker = document.getElementById('aft-picker-modal');
    if (picker && picker.classList.contains('is-open')) return;    // 뽑기 창은 자기 키 처리
    var k = e.key, handled = true;
    if (k === 'ArrowRight' || k === 'PageDown') step(1);
    else if (k === 'ArrowLeft' || k === 'PageUp') step(-1);
    else if (/^[1-9]$/.test(k) && +k <= tabs.length) go(+k - 1, 0);
    else if (k === 'Escape' || k === 'h' || k === 'H') { closePops(); /* 수업 중 실수로 메인으로 나가지 않게 막는다 */ }
    else handled = false;
    if (handled) { e.preventDefault(); e.stopImmediatePropagation(); }
  }

  /* ---------- 켜기 / 끄기 ---------- */
  function enter(opts) {
    if (state.on) return;
    collect();
    if (!tabs.length) return;
    rootFontBefore = document.documentElement.style.fontSize;
    state.on = true;
    document.documentElement.classList.add('lm-on');
    if (!app) build(); else { app.style.display = ''; }
    var o = opts || {};
    if (o.bg) state.bg = o.bg;
    if (typeof o.z === 'boolean') state.zones = o.z;
    if (o.w) { state.wide = true; app.classList.add('is-wide'); ui.wideBtn.classList.add('is-on'); }
    var pr = loadProg();
    state.cls = (pr.cls && classes().indexOf(pr.cls) >= 0) ? pr.cls : classes()[0];
    var t = 0, p = 0;
    if (pr.pos[state.cls]) { t = pr.pos[state.cls].t; p = pr.pos[state.cls].p; }
    var m = /#lm=([\w-]+)\.(\d+)/.exec(location.hash);
    if (m) {
      tabs.forEach(function (x, i) { if (x.key === m[1]) { t = i; p = +m[2] - 1; } });
    } else if (typeof o.t === 'number') { t = Math.min(o.t, tabs.length - 1); p = o.p || 0; }
    if (t >= tabs.length) { t = 0; p = 0; }
    go(t, p);
    timerDraw();
  }
  function exit() {
    if (!state.on) return;
    while (ui.page.firstChild) restoreOne(ui.page.firstChild);
    state.on = false;
    clearInterval(timer.id); timer.id = null;
    document.documentElement.classList.remove('lm-on');
    document.documentElement.style.fontSize = rootFontBefore;
    app.style.display = 'none';
    try {
      history.replaceState(null, '', location.pathname + location.search.replace(/([?&])mode=class(&|$)/, '$1').replace(/[?&]$/, ''));
      sessionStorage.removeItem('lm:' + location.pathname);
    } catch (e) { /* 무시 */ }
    if (window.aftFitMath) window.aftFitMath();
  }

  /* ---------- 시작 ---------- */
  function addEnterButton() {
    var nav = $('nav.no-print');
    if (!nav || $('.lm-enter', nav)) return;
    var b = h('button', 'lm-enter', '수업 모드 ▶');
    b.type = 'button';
    b.title = '전자칠판 수업 화면으로 전환 (왼쪽 본문 · 오른쪽 판서)';
    b.addEventListener('click', function () { enter(); });
    var right = nav.children[1] || nav;
    right.insertBefore(b, right.firstChild);
  }
  function whenReady(fn) {
    // MathJax 조판이 끝난 뒤에 옮겨야 크기 측정이 맞다
    var tries = 0;
    (function wait() {
      if (document.body.classList.contains('mathjax-ready') || tries++ > 40) {
        (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(fn);
      } else setTimeout(wait, 150);
    })();
  }
  function init() {
    addEnterButton();
    window.addEventListener('keydown', onKey, true);
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fit, 150); });
    window.addEventListener('beforeprint', exit);
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem('lm:' + location.pathname) || 'null'); } catch (e) { /* 무시 */ }
    if (/[?&]mode=class\b/.test(location.search) || /#lm=/.test(location.hash) || saved) {
      whenReady(function () {
        enter(saved ? { t: saved.t, p: saved.p, bg: saved.bg, z: saved.z, w: saved.w } : null);
      });
    }
  }
  window.aftLessonMode = { enter: enter, exit: exit, go: go, tabs: function () { return tabs; } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
