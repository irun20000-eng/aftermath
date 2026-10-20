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
   판서 예시: 구역의 ex 줄을 숨겨 두고 누르면 한 줄씩 보인다 (두 번 누르면 그 구역 전체).
              판서 공간 아래 [◀ 이전 단계 · 다음 줄 ▶ · 모두 보이기 · 모두 숨기기].
              ↓/↑ 다음 줄·이전 단계. [판서 ▾ → 키로 한 줄씩] 을 켜면 →/PageDown 이
              먼저 다음 줄을 보이고 다 보이면 다음 화면 (←/PageUp 은 거꾸로).
              [그래프 개형] 을 켜면 plot 이 있는 구역은 마지막 단계에 개형이 나온다.
   판서 설정: 배경(빈칸·모눈·좌표) · 구역 틀 · 판서 넓게 — [판서 ▾] 에서 적용 범위를
              [이 화면 · 이 차시 · 모든 차시] 로 골라 바꾼다. 기본값은 빈칸 · 구역 틀 · 넓게.
              기본값 → 모든 차시 → 이 차시 → 이 화면 순으로 덮어쓴다. 모든 차시·이 차시는
              이 브라우저(localStorage)에 기억, 이 화면은 수업 중에만 (새로고침해도 유지).
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
  var BOARD_DEFAULT = { bg: 'blank', zones: true, wide: true };
  var SCOPES = [['screen', '이 화면', '지금 화면에만 (수업 중에만 기억)'],
                ['lesson', '이 차시', '이 차시의 모든 화면에 (이 브라우저에 기억)'],
                ['all', '모든 차시', '1~31차시 전체에 — 차시마다 따로 정한 같은 항목은 지운다']];
  var FROM = { 'default': '기본', all: '모든 차시', lesson: '이 차시', screen: '이 화면' };
  var LS_ALL = 'lm:board:all', LS_LESSON = 'lm:board:lesson:';

  var state = { on: false, tab: 0, page: 0, cls: null, scr: {}, scope: 'lesson',
    rev: {}, stepKeys: false, plot: false };
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
    state.rev = {};                // 반이 바뀌면 판서 예시는 다시 처음부터
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
    ui.boardMenu.appendChild(h('div', 'lm-pop-h', '적용 범위'));
    var sc = h('div', 'lm-seg lm-scope');
    ui.scopeBtns = {};
    SCOPES.forEach(function (p) {
      var b = h('button', 'lm-btn', p[1]);
      b.type = 'button';
      b.title = p[2];
      b.addEventListener('click', function () { state.scope = p[0]; savePref(); renderBoardMenu(); });
      ui.scopeBtns[p[0]] = b;
      sc.appendChild(b);
    });
    ui.boardMenu.appendChild(sc);
    var seg = h('div', 'lm-seg');
    ui.bgBtns = {};
    [['blank', '빈칸'], ['grid', '모눈'], ['axes', '좌표']].forEach(function (p) {
      var b = h('button', 'lm-btn', p[1]);
      b.type = 'button';
      b.addEventListener('click', function () { setBoard('bg', p[0]); });
      ui.bgBtns[p[0]] = b;
      seg.appendChild(b);
    });
    ui.boardMenu.appendChild(seg);
    ui.zoneBtn = h('button', 'lm-btn', '구역 틀');
    ui.zoneBtn.type = 'button';
    ui.zoneBtn.addEventListener('click', function () { setBoard('zones', !boardVal('zones').v); });
    ui.boardMenu.appendChild(ui.zoneBtn);
    ui.wideBtn = h('button', 'lm-btn', '판서 넓게');
    ui.wideBtn.type = 'button';
    ui.wideBtn.addEventListener('click', function () { setBoard('wide', !boardVal('wide').v); });
    ui.boardMenu.appendChild(ui.wideBtn);
    ui.boardWhere = h('div', 'lm-board-where');
    ui.boardMenu.appendChild(ui.boardWhere);
    var rs = h('button', 'lm-btn lm-board-reset', '처음 설정으로 (빈칸 · 구역 틀 · 넓게)');
    rs.type = 'button';
    rs.title = '모든 차시·이 차시·이 화면에서 바꾼 판서 설정을 지우고 기본값으로';
    rs.addEventListener('click', resetBoard);
    ui.boardMenu.appendChild(rs);
    // 판서 예시 — 프레젠터 키로 한 줄씩 · 그래프 개형 (브라우저에 기억)
    ui.boardMenu.appendChild(h('div', 'lm-pop-h', '판서 예시'));
    ui.stepKeyBtn = h('button', 'lm-btn', '→ 키로 한 줄씩');
    ui.stepKeyBtn.type = 'button';
    ui.stepKeyBtn.title = '켜면 →·PageDown(프레젠터)이 판서 예시를 한 줄씩 보이고, 다 보이면 다음 화면으로 (←·PageUp 은 거꾸로)';
    ui.stepKeyBtn.addEventListener('click', function () {
      state.stepKeys = !state.stepKeys; savePref();
      ui.stepKeyBtn.classList.toggle('is-on', state.stepKeys);
    });
    ui.boardMenu.appendChild(ui.stepKeyBtn);
    ui.plotBtn = h('button', 'lm-btn', '그래프 개형');
    ui.plotBtn.type = 'button';
    ui.plotBtn.title = '켜면 개형이 있는 구역은 마지막 단계에 그래프가 나온다 (끄면 선생님이 직접 그릴 빈 좌표축)';
    ui.plotBtn.addEventListener('click', function () { state.plot = !state.plot; savePref(); renderBoard(); });
    ui.boardMenu.appendChild(ui.plotBtn);
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
    ui.src = h('span', 'lm-src');
    ui.count = h('span', 'lm-count');
    ui.reveal = h('button', 'lm-reveal', '정답·풀이 열기');
    ui.reveal.type = 'button';
    ui.reveal.addEventListener('click', revealAll);
    var headMain = h('div', 'lm-headmain');          // 제목 + 그 아래 출처 칩 (제목이 출처에 밀려 꺾이지 않게)
    headMain.appendChild(ui.sub); headMain.appendChild(ui.src);
    head.appendChild(ui.tabname); head.appendChild(headMain); head.appendChild(ui.reveal); head.appendChild(ui.count);
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
    tap.zone = -1;
    state.tab = t; state.page = p;
    var u = pages[p];
    park(u.el);
    ui.page.appendChild(u.el);
    renderChrome();
    applyWide();
    renderBoard();
    fit();
    try {
      history.replaceState(null, '', location.pathname + location.search + '#lm=' + tabs[t].key + '.' + (p + 1));
      sessionStorage.setItem('lm:' + location.pathname, JSON.stringify({ t: t, p: p, scr: state.scr }));
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
    renderSource(u);
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

  /* ---------- 출처 (교과서 몇 쪽 몇 번) ---------- */
  function unitChip(u) {
    if (!u || !u.el) return null;
    return u.el.classList && u.el.classList.contains('src-chip') ? u.el : $('.src-chip', u.el);
  }
  function renderSource(u) {
    $all('.src-chip.lm-src-shown').forEach(function (c) { c.classList.remove('lm-src-shown'); });
    ui.src.textContent = '';
    state.src = null;
    var chip = unitChip(u), label = '', rel = '';
    if (chip) {
      chip.classList.add('lm-src-shown');           // 화면 안의 칩은 머리줄로 옮겨 보이므로 숨긴다
      label = chip.getAttribute('data-src-label') || txt(chip);
      rel = chip.getAttribute('data-src-rel') || '';
    } else if (u && u.el) {                         // 도전 문제 — 기존 '📖 출처' 줄의 이름표
      var s = u.el.hasAttribute && u.el.hasAttribute('data-aft-source-label') ? u.el : $('[data-aft-source-label]', u.el);
      if (s) label = s.getAttribute('data-aft-source-label');
    }
    if (!label) { ui.src.style.display = 'none'; return; }
    // 머리줄은 한 줄로 — 길면 말줄임, 전체는 마우스를 올리거나 판서 공간에서 본다
    var c = h('span', 'src-chip');
    c.setAttribute('data-src-rel', rel);
    c.title = label;
    c.appendChild(h('span', 'src-lab', label));
    if (rel) c.appendChild(h('span', 'src-rel', rel));
    ui.src.appendChild(c);
    ui.src.style.display = '';
    var n = (u.sub || '').match(/(\d+)번/);
    state.src = {
      where: n ? n[1] + '번' : (tabs[state.tab].key === 'concept' ? '개념 ' + (state.page + 1) : tabs[state.tab].name),
      label: label,
      rel: rel
    };
  }

  /* ---------- 판서 설정 (배경 · 구역 틀 · 판서 넓게) ---------- */
  // 기본값 → 모든 차시 → 이 차시 → 이 화면 순으로 덮어쓴다 (뒤가 이긴다).
  // 판서 계획의 bg 는 쓰지 않는다 — 선생님이 정한 기본(빈칸)이 화면마다 모눈으로 돌아가던 문제.
  function lessonId() {
    var f = decodeURIComponent(location.pathname.split('/').pop() || '');
    var m = /미적분I_(\d\d)_/.exec(f);
    return m ? 'calc-' + m[1] : f.replace(/^교사용_/, '');   // 학생용·교사용 사본이 같은 차시 설정을 쓴다
  }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || 'null') || {}; } catch (e) { return {}; } }
  function lsSet(k, v) {
    try { if (Object.keys(v).length) localStorage.setItem(k, JSON.stringify(v)); else localStorage.removeItem(k); } catch (e) { /* 무시 */ }
  }
  function lsKeys(prefix) {
    var out = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(prefix) === 0) out.push(k); } } catch (e) { /* 무시 */ }
    return out;
  }
  function pageKey() { return tabs[state.tab].key + '.' + (state.page + 1); }
  function boardVal(k) {              // { v: 값, from: 'default'|'all'|'lesson'|'screen' }
    var r = { v: BOARD_DEFAULT[k], from: 'default' };
    [['all', lsGet(LS_ALL)], ['lesson', lsGet(LS_LESSON + lessonId())], ['screen', state.scr[pageKey()] || {}]]
      .forEach(function (l) { if (l[1][k] !== undefined) r = { v: l[1][k], from: l[0] }; });
    return r;
  }
  function setBoard(k, v) {
    if (state.scope === 'screen') {
      var s = state.scr[pageKey()] = state.scr[pageKey()] || {};
      s[k] = v;
    } else {
      // 넓은 범위로 정하면 더 좁은 범위에 남은 같은 항목은 지운다 (정한 값이 바로 보이게)
      Object.keys(state.scr).forEach(function (pk) { delete state.scr[pk][k]; });
      if (state.scope === 'all') {
        var a = lsGet(LS_ALL); a[k] = v; lsSet(LS_ALL, a);
        lsKeys(LS_LESSON).forEach(function (key) { var o = lsGet(key); delete o[k]; lsSet(key, o); });
      } else {
        var lk = LS_LESSON + lessonId(), o = lsGet(lk); o[k] = v; lsSet(lk, o);
      }
    }
    saveSession();
    if (k === 'wide') { applyWide(); renderBoard(); fit(); } else renderBoard();
  }
  function resetBoard() {
    state.scr = {};
    lsSet(LS_ALL, {});
    lsKeys(LS_LESSON).forEach(function (key) { lsSet(key, {}); });
    saveSession();
    applyWide(); renderBoard(); fit();
  }
  function applyWide() {
    var w = !!boardVal('wide').v;
    app.classList.toggle('is-wide', w);
  }
  function renderBoardMenu() {
    var bg = boardVal('bg'), z = boardVal('zones'), w = boardVal('wide');
    Object.keys(ui.scopeBtns).forEach(function (k) { ui.scopeBtns[k].classList.toggle('is-on', k === state.scope); });
    Object.keys(ui.bgBtns).forEach(function (k) { ui.bgBtns[k].classList.toggle('is-on', k === bg.v); });
    ui.zoneBtn.classList.toggle('is-on', !!z.v);
    ui.wideBtn.classList.toggle('is-on', !!w.v);
    var BGN = { blank: '빈칸', grid: '모눈', axes: '좌표' };
    ui.boardWhere.textContent = '지금: ' + BGN[bg.v] + '(' + FROM[bg.from] + ') · 구역 틀 ' + (z.v ? '켬' : '끔') + '(' + FROM[z.from] + ') · 넓게 '
      + (w.v ? '켬' : '끔') + '(' + FROM[w.from] + ')';
  }
  function saveSession() {
    try { sessionStorage.setItem('lm:' + location.pathname, JSON.stringify({ t: state.tab, p: state.page, scr: state.scr })); } catch (e) { /* 무시 */ }
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
  // 판서 계획의 개형 — 교사용 Nav(lesson-board.js) 와 같은 방식 (눈금 없음, 개형만)
  function plotSVG(lbl, plot) {
    var f;
    try { f = new Function('t', 'return ' + plot.f); } catch (e) { return null; }
    var x = (lbl && lbl.x) || 'x', y = (lbl && lbl.y) || 'y';
    var ns = 'http://www.w3.org/2000/svg';
    var L = 90, R = 960, T = 50, B = 560;
    var a = plot.t[0], b = plot.t[1], n = 120, pts = [], lo = 0, hi = 0, i, tt, v;
    for (i = 0; i <= n; i++) {
      tt = a + (b - a) * i / n;
      try { v = f(tt); } catch (e) { v = NaN; }
      pts.push([tt, v]);
      if (!isFinite(v)) continue;
      if (v < lo) lo = v; if (v > hi) hi = v;
    }
    if (hi === lo) hi = lo + 1;
    var sx = function (t) { return L + (R - L) * (t - a) / (b - a); };
    var sy = function (v) { return B - (B - T) * (v - lo) / (hi - lo); };
    var ox = sx(Math.max(a, Math.min(b, 0))), oy = sy(0), body = '';
    var segs = [[]];      // f 가 NaN·±Infinity 인 곳에서 선을 끊는다 (점프가 세로선으로 이어지지 않게)
    pts.forEach(function (p) {
      if (isFinite(p[1])) segs[segs.length - 1].push(sx(p[0]).toFixed(1) + ',' + sy(p[1]).toFixed(1));
      else if (segs[segs.length - 1].length) segs.push([]);
    });
    segs.forEach(function (sg) {
      if (sg.length > 1) body += '<polyline fill="none" stroke="#1e293b" stroke-width="3" vector-effect="non-scaling-stroke" points="' + sg.join(' ') + '"/>';
    });
    (plot.marks || []).forEach(function (m) {
      var mv; try { mv = f(m[0]); } catch (e) { mv = NaN; }
      if (!isFinite(mv)) return;
      var px = sx(m[0]), py = sy(mv), c = m[2] || '#1d4ed8';
      body += '<line x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + oy + '" stroke="#94a3b8" stroke-dasharray="6 6" vector-effect="non-scaling-stroke"/>' +
        '<circle cx="' + px + '" cy="' + py + '" r="9" fill="' + c + '"/>' +
        '<text x="' + (px + 14) + '" y="' + (py - 16) + '" fill="' + c + '" font-size="34" font-weight="700"></text>';
    });
    var s = document.createElementNS(ns, 'svg');
    s.setAttribute('class', 'lm-plot');
    s.setAttribute('viewBox', '0 0 1000 600');
    s.setAttribute('preserveAspectRatio', 'none');
    s.innerHTML = '<line x1="30" y1="' + oy + '" x2="985" y2="' + oy + '" stroke="#94a3b8" stroke-width="2" vector-effect="non-scaling-stroke"/>' +
      '<line x1="' + ox + '" y1="590" x2="' + ox + '" y2="10" stroke="#94a3b8" stroke-width="2" vector-effect="non-scaling-stroke"/>' +
      '<text x="955" y="' + Math.min(590, oy + 40) + '" fill="#64748b" font-size="34" font-style="italic"></text>' +
      '<text x="' + (ox + 16) + '" y="40" fill="#64748b" font-size="34" font-style="italic"></text>' + body;
    // 글자는 textContent 로 — 계획 문장의 < > 가 태그로 먹히지 않게
    var texts = s.querySelectorAll('text');
    texts[0].textContent = x; texts[1].textContent = y;
    var mi = 2;
    (plot.marks || []).forEach(function (m) {
      var mv; try { mv = f(m[0]); } catch (e) { mv = NaN; }
      if (isFinite(mv) && texts[mi]) texts[mi++].textContent = m[1];
    });
    return s;
  }

  /* ---------- 판서 예시 단계 공개 ---------- */
  // 화면마다 공개 상태(구역별 몇 단계)와 되돌리기 기록을 기억한다.
  // 다른 화면에 갔다 와도 그대로, 반을 바꾸면 처음부터. 숨긴 줄도 자리는 차지한다(공개할 때 글이 밀리지 않게).
  var tap = { zone: -1, t: 0, before: null, histLen: 0 };
  var mjChain = Promise.resolve();
  function loadPref() {
    try { return JSON.parse(localStorage.getItem('lm:pref') || 'null') || {}; } catch (e) { return {}; }
  }
  function savePref() {
    try { localStorage.setItem('lm:pref', JSON.stringify({ step: state.stepKeys, plot: state.plot, scope: state.scope })); } catch (e) { /* 무시 */ }
  }
  function zoneSteps(z) {
    return (z && z.ex ? z.ex.length : 0) + (state.plot && z && z.plot && z.axes ? 1 : 0);
  }
  function revState() {
    var pp = pagePlan(), zs = (pp && pp.zones) || [];
    var k = tabs[state.tab].key + '.' + (state.page + 1);
    var r = state.rev[k];
    if (!r || r.n.length !== zs.length) r = state.rev[k] = { n: zs.map(function () { return 0; }), hist: [] };
    r.n = r.n.map(function (v, i) { return Math.min(v, zoneSteps(zs[i])); });   // 그래프를 끄면 단계가 줄어든다
    return { r: r, zs: zs };
  }
  function revTotals() {
    var s = revState(), shown = 0, all = 0;
    s.zs.forEach(function (z, i) { all += zoneSteps(z); shown += s.r.n[i]; });
    return { shown: shown, all: all };
  }
  function revSet(n) {
    var s = revState();
    if (n.join() === s.r.n.join()) return false;
    s.r.hist.push(s.r.n.slice());
    if (s.r.hist.length > 300) s.r.hist.shift();
    s.r.n = n;
    applyReveal();
    return true;
  }
  // 다음 한 줄 — 아직 덜 보인 첫 구역에서
  function revNext() {
    var s = revState(), n = s.r.n.slice();
    for (var i = 0; i < s.zs.length; i++) {
      if (n[i] < zoneSteps(s.zs[i])) { n[i]++; return revSet(n); }
    }
    return false;
  }
  // 이전 단계 — 마지막으로 한 일을 되돌린다 (두 번 눌러 구역 전체를 연 것도 한 번에)
  function revUndo() {
    var s = revState();
    if (!s.r.hist.length) return false;
    s.r.n = s.r.hist.pop();
    applyReveal();
    return true;
  }
  // 키보드 ←/↑ — 보이는 줄이 있을 때만 되돌리고, 없으면 false (→ 이전 화면)
  function revBack() {
    var s = revState();
    if (!revTotals().shown) return false;
    if (revUndo()) return true;
    var n = s.r.n.slice();
    for (var i = n.length - 1; i >= 0; i--) if (n[i] > 0) { n[i]--; s.r.n = n; applyReveal(); return true; }
    return false;
  }
  function revAll(show) {
    var s = revState();
    return revSet(s.zs.map(function (z) { return show ? zoneSteps(z) : 0; }));
  }
  function onZoneTap(i) {
    var s = revState(), now = Date.now();
    if (tap.zone === i && now - tap.t < 450 && tap.before) {
      // 두 번 누름 → 그 구역 전체. 앞의 한 번 누름은 기록에서 지워 [이전 단계] 한 번에 원래대로
      s.r.hist.length = tap.histLen;
      var all = tap.before.slice();
      all[i] = zoneSteps(s.zs[i]);
      s.r.n = tap.before.slice();
      tap.zone = -1;
      revSet(all);
      return;
    }
    tap = { zone: i, t: now, before: s.r.n.slice(), histLen: s.r.hist.length };
    if (s.r.n[i] < zoneSteps(s.zs[i])) { var n = s.r.n.slice(); n[i]++; revSet(n); }
  }
  function applyReveal() {
    if (!ui.zoneEls || !ui.zoneEls.length) return;
    var s = revState(), tot = 0, all = 0;
    ui.zoneEls.forEach(function (ze, i) {
      var z = s.zs[i], n = s.r.n[i], m = zoneSteps(z), exn = (z.ex || []).length;
      tot += n; all += m;
      ze.lines.forEach(function (ln, j) { ln.classList.toggle('is-shown', j < n); });
      var pon = !!ze.pl && n > exn;
      if (ze.pl) ze.pl.classList.toggle('is-shown', pon);
      if (ze.ax) ze.ax.classList.toggle('is-off', pon);
      ze.el.classList.toggle('is-split', !!(ze.ax || ze.pl) && n > 0 && exn > 0);
      ze.cnt.textContent = m ? n + '/' + m : '';
      ze.cnt.classList.toggle('is-done', m > 0 && n >= m);
    });
    if (ui.exCnt) {
      ui.exCnt.textContent = tot + '/' + all;
      ui.exPrev.disabled = !s.r.hist.length;
      ui.exNext.disabled = tot >= all;
      ui.exAll.disabled = tot >= all;
      ui.exNone.disabled = tot === 0;
    }
  }
  function exLine(src) {
    var cls = '';
    src = String(src);
    var m = /^([bgr]):/.exec(src);
    if (m) { cls = ' c-' + m[1]; src = src.slice(2); }
    // 계획 문장은 글자 그대로 — < > & 가 태그로 먹히지 않게 (PITFALLS A-3)
    src = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    src = src.replace(/\[\[([bgr]):([\s\S]*?)\]\]/g, function (_, c, t) { return '<span class="c-' + c + '">' + t + '</span>'; });
    var d = h('div', 'lm-ex-line' + cls);
    d.innerHTML = src;
    return d;
  }
  // 판서 예시 글자 크기 — 구역마다 넘치지 않는 가장 큰 크기로 (숨긴 줄 포함해 미리 맞춘다)
  // 한 구역의 긴 줄 때문에 다른 구역까지 작아지지 않게 따로 맞춘다. transform 아닌 font-size (PITFALLS C-9)
  function fitBoard() {
    if (!state.on || !ui.zoneEls || !ui.zoneEls.length) return;
    var w = ui.board.clientWidth || 960;
    var max = Math.max(18, Math.min(44, Math.round(w / 960 * 34)));   // 교실 뒤에서도 읽히게 크게 시작해 줄인다
    var chip = ui.board.querySelector('.lm-board-src');
    ui.zoneEls.forEach(function (z, i) {
      var b = z.box;
      if (!b.children.length) return;
      z.el.classList.remove('is-stack');
      b.style.top = '';
      // 오른쪽 위 출처 표시가 첫 구역의 첫 줄을 가리지 않게 아래로 내린다
      if (i === 0 && chip) {
        var need = Math.ceil(chip.getBoundingClientRect().bottom - z.el.getBoundingClientRect().top + 6);
        if (need > 22) b.style.top = need + 'px';
      }
      var s = fitBox(b, max);
      // 좌표 구역: 옆에 두면 너무 작아지는 긴 식은 그래프 위로 올린다 (더 크게 보이는 쪽)
      if ((z.ax || z.pl) && s < max * 0.8) {
        z.el.classList.add('is-stack');
        var s2 = fitBox(b, max);
        if (s2 > s) {
          var last = b.lastElementChild;
          z.el.style.setProperty('--lm-svg-top', (b.offsetTop + last.offsetTop + last.offsetHeight + 6) + 'px');
        } else {
          z.el.classList.remove('is-stack');
          fitBox(b, max);
        }
      }
    });
  }
  function fitBox(b, max) {
    var size = max;
    b.style.setProperty('--lm-ex', size + 'px');
    while (size > 11 && (b.scrollHeight > b.clientHeight + 1 || b.scrollWidth > b.clientWidth + 1)) {
      size -= 1;
      b.style.setProperty('--lm-ex', size + 'px');
    }
    return size;
  }
  function exBtn(label, cls, title, fn) {
    var b = h('button', 'lm-exb' + (cls ? ' ' + cls : ''), label);
    b.type = 'button';
    b.title = title;
    b.addEventListener('click', function (e) { e.stopPropagation(); closePops(); fn(); });
    return b;
  }

  function renderBoard() {
    var pp = pagePlan();
    var bg = boardVal('bg').v;
    if (window.MathJax && MathJax.typesetClear) { try { MathJax.typesetClear([ui.board]); } catch (e) { /* 무시 */ } }
    ui.board.innerHTML = '';
    ui.zoneEls = [];
    ui.exCnt = null;
    ui.stepKeyBtn.classList.toggle('is-on', state.stepKeys);
    ui.plotBtn.classList.toggle('is-on', state.plot);
    ui.board.className = 'lm-board' + (bg === 'grid' ? ' bg-grid' : '');
    renderBoardMenu();
    if (bg === 'axes') {
      var ax = h('div', 'lm-board-axes');
      ax.appendChild(axesSVG(pp && pp.axes, false));
      ui.board.appendChild(ax);
    }
    var zones = h('div', 'lm-zones' + (boardVal('zones').v ? '' : ' is-hidden'));
    var anyEx = false;
    if (pp && pp.zones && pp.zones.length) {
      pp.zones.forEach(function (z, i) {
        var d = h('div', 'lm-zone');
        d.style.flexGrow = String(z.h || 1);
        var lab = h('span', 'lm-zone-label', ZONE_NUM[i] + ' ' + String(z.t).replace(/^\s*[①-⑩]\s*/, ''));
        var cnt = h('span', 'lm-zone-cnt');
        lab.appendChild(cnt);
        d.appendChild(lab);
        var ax = null, pl = null;
        if (z.axes) {
          ax = axesSVG(z.axes === true ? null : z.axes, true);
          ax.setAttribute('class', 'lm-ax');
          d.appendChild(ax);
          d.classList.add('has-axes');
          if (z.plot && state.plot) { pl = plotSVG(z.axes === true ? null : z.axes, z.plot); if (pl) d.appendChild(pl); }
        }
        var box = h('div', 'lm-ex');
        (z.ex || []).forEach(function (src) { box.appendChild(exLine(src)); });
        d.appendChild(box);
        if (zoneSteps(z)) {
          anyEx = true;
          d.classList.add('has-ex');
          d.title = '누르면 판서 예시 한 줄 · 두 번 누르면 이 구역 전체';
          d.addEventListener('click', function (e) { e.stopPropagation(); closePops(); onZoneTap(i); });
        }
        ui.zoneEls.push({ el: d, box: box, lines: Array.prototype.slice.call(box.children), cnt: cnt, ax: ax, pl: pl });
        zones.appendChild(d);
      });
      if (anyEx) zones.classList.add('has-ex');
      ui.board.appendChild(zones);
    }
    if (anyEx) {
      var exbar = h('div', 'lm-exbar');
      ui.exPrev = exBtn('◀ 이전 단계', '', '마지막으로 보인 것을 되돌린다 (↑)', revUndo);
      ui.exNext = exBtn('다음 줄 ▶', 'is-main', '판서 예시 다음 한 줄 (↓)', revNext);
      ui.exAll = exBtn('모두 보이기', '', '이 화면의 판서 예시를 모두 보인다', function () { revAll(true); });
      ui.exNone = exBtn('모두 숨기기', '', '이 화면의 판서 예시를 모두 숨긴다', function () { revAll(false); });
      ui.exCnt = h('span', 'lm-excnt');
      exbar.appendChild(ui.exPrev); exbar.appendChild(ui.exNext);
      exbar.appendChild(ui.exAll); exbar.appendChild(ui.exNone); exbar.appendChild(ui.exCnt);
      exbar.appendChild(h('span', 'lm-exhint', '구역 누르기: 한 줄 · 두 번: 구역 전체'));
      ui.board.appendChild(exbar);
    }
    if (state.src) {
      var bs = h('div', 'lm-board-src' + (anyEx ? ' is-compact' : ''));
      bs.title = state.src.where + ' · ' + state.src.label + (state.src.rel ? ' (' + state.src.rel + ')' : '');
      bs.appendChild(h('b', null, state.src.where));
      bs.appendChild(document.createTextNode(' · ' + state.src.label));
      if (state.src.rel) bs.appendChild(h('span', 'lm-board-src-rel', state.src.rel));
      ui.board.appendChild(bs);
    }
    if (!anyEx) ui.board.appendChild(h('span', 'lm-board-note', '전자칠판 필기모드로 이 공간에 판서'));
    applyReveal();
    // 수식 조판 → 글자 크기 맞춤 (MathJax 는 한 번에 하나씩 — 사슬로 잇는다)
    var root = ui.board;
    if (anyEx && window.MathJax && MathJax.typesetPromise) {
      mjChain = mjChain.then(function () { return MathJax.typesetPromise([root]); })
        .catch(function () { /* 조판 실패해도 원문은 보인다 */ })
        .then(fitBoard);
    } else fitBoard();
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
    fitBoard();
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
    if (k === 'ArrowRight' || k === 'PageDown') { if (!(state.stepKeys && revNext())) step(1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { if (!(state.stepKeys && revBack())) step(-1); }
    else if (k === 'ArrowDown' && ui.exCnt) revNext();
    else if (k === 'ArrowUp' && ui.exCnt) revBack();
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
    var pf = loadPref();
    state.stepKeys = !!pf.step;
    state.plot = !!pf.plot;
    if (pf.scope && FROM[pf.scope] && pf.scope !== 'default') state.scope = pf.scope;
    if (o.scr && typeof o.scr === 'object') state.scr = o.scr;
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
        enter(saved ? { t: saved.t, p: saved.p, scr: saved.scr } : null);
      });
    }
  }
  window.aftLessonMode = {
    enter: enter, exit: exit, go: go, tabs: function () { return tabs; },
    reveal: {
      next: revNext, back: revBack, undo: revUndo,
      all: function () { return revAll(true); }, none: function () { return revAll(false); },
      zone: onZoneTap, totals: revTotals,
      ready: function () { return mjChain; }
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
