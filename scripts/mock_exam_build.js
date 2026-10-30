#!/usr/bin/env node
/**
 * 수능 양식 모의고사 조판기 — 문제지 PDF + 해설지 PDF
 *
 * 문항 데이터(JSON)는 저장소 밖에 둔다. EBS 등 원저작물 내용은 커밋하지 않는다.
 *
 * 사용:
 *   node scripts/mock_exam_build.js --data <data_dir> --figs <figs_dir> --meta <meta.json> --out <out_dir>
 *     [--modules <node_modules 경로>] [--paper B4|A4] [--html]
 *
 * data_dir : common_*.json, prob_*.json, calc_*.json, geom_*.json (형식은 아래 Problem 참조)
 * meta.json: { "year": "2027", "title": "…", "subtitle": "…", "copyright": "…", "file_stem": "…" }
 *
 * Problem = { no, section: common|prob|calc|geom, points, type: mc|short, stem, figure, figure_width,
 *             choices[], answer, answer_value, concept, solution_steps[{title, body}],
 *             solution_figure(문자열 또는 배열), pitfall, verify }
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, [])
);
for (const k of ['data', 'figs', 'meta', 'out']) {
  if (!args[k]) { console.error(`--${k} 가 필요합니다`); process.exit(1); }
}

const MODULES = path.resolve(args.modules || path.join(__dirname, '..', 'node_modules'));
const KATEX = path.join(MODULES, 'katex', 'dist');
const FONT = path.join(MODULES, '@fontsource', 'nanum-myeongjo');
for (const p of [KATEX, FONT]) {
  if (!fs.existsSync(p)) { console.error(`없음: ${p}  (npm install 필요)`); process.exit(1); }
}

const PAPER = { B4: [257, 364], A4: [210, 297] }[(args.paper || 'B4').toUpperCase()];
const meta = JSON.parse(fs.readFileSync(args.meta, 'utf8'));
const SECTIONS = [
  { key: 'common', name: '공통과목', label: '' },
  { key: 'prob', name: '확률과 통계', label: '(확률과 통계)' },
  { key: 'calc', name: '미적분', label: '(미적분)' },
  { key: 'geom', name: '기하', label: '(기하)' },
];

const problems = fs.readdirSync(args.data).filter(f => f.endsWith('.json')).sort()
  .flatMap(f => JSON.parse(fs.readFileSync(path.join(args.data, f), 'utf8')));
const bySec = Object.fromEntries(SECTIONS.map(s => [s.key, problems.filter(p => p.section === s.key).sort((a, b) => a.no - b.no)]));
const sections = SECTIONS.filter(s => bySec[s.key].length);

const figUri = name => {
  const p = path.join(args.figs, name);
  if (!fs.existsSync(p)) throw new Error(`그림 없음: ${p}`);
  return `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
};
const CIRCLED = ['①', '②', '③', '④', '⑤'];

// 수식 안의 < > 는 HTML 태그로 파싱되므로 \lt \gt 로 바꾼다 (PITFALLS A-3)
const tex = s => (s == null ? s : String(s).replace(/\$\$[\s\S]+?\$\$|\$[^$]+?\$/g,
  m => m.replace(/</g, '\\lt ').replace(/>/g, '\\gt ')));
for (const p of problems) {
  for (const k of ['stem', 'answer_value', 'pitfall']) p[k] = tex(p[k]);
  p.choices = (p.choices || []).map(tex);
  p.solution_steps = (p.solution_steps || []).map(st => ({ title: tex(st.title), body: tex(st.body) }));
}

// 배점은 질문 문장 끝에 붙인다 — 문항이 조건·보기 박스로 끝나면 박스 앞에
function withPoints(stem, pts) {
  const tag = ` <span class="pts">[${pts}점]</span>`;
  const m = stem.match(/^([\s\S]*)(<div class="(?:cond|bogi)">[\s\S]*?<\/div>)\s*$/);
  if (m && /[?.]\s*(<br>)?\s*$/.test(m[1])) return m[1].replace(/\s*(<br>)?\s*$/, '') + tag + m[2];
  return stem + tag;
}

const head = (title, extraCss) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${title}</title>
<link rel="stylesheet" href="file://${KATEX}/katex.min.css">
<link rel="stylesheet" href="file://${FONT}/400.css"><link rel="stylesheet" href="file://${FONT}/700.css"><link rel="stylesheet" href="file://${FONT}/800.css">
<script src="file://${KATEX}/katex.min.js"></script><script src="file://${KATEX}/contrib/auto-render.min.js"></script>
<style>
* { box-sizing: border-box }
html, body { margin: 0; padding: 0; background: #fff; color: #000 }
body { font-family: 'Nanum Myeongjo', serif; font-size: 10.5pt; line-height: 1.75; word-break: keep-all; overflow-wrap: break-word }
.katex { font-size: 1.08em }
.katex-display { margin: .4em 0 }
img { max-width: 100% }
table.ztable, table.ptable { border-collapse: collapse; margin: 2mm auto; text-align: center }
table.ztable td, table.ztable th, table.ptable td, table.ptable th { border: .8pt solid #000; padding: .5mm 3mm }
table.ztable th, table.ptable th { font-weight: 700 }
${extraCss}
</style></head><body>`;

const RENDER_MATH = `renderMathInElement(document.body, {
  delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}],
  throwOnError: false, strict: 'ignore', trust: true });`;

/* ───────────────────────── 문제지 ───────────────────────── */

const examCss = `
@page { size: ${PAPER[0]}mm ${PAPER[1]}mm; margin: 0 }
.page { width: ${PAPER[0]}mm; height: ${PAPER[1]}mm; padding: 12mm 14mm 10mm; position: relative; overflow: hidden; page-break-after: always; display: flex; flex-direction: column }
.page:last-child { page-break-after: auto }
.phead { display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 2.2pt solid #000; padding-bottom: 1.5mm; margin-bottom: 4mm }
.phead .pno { font-size: 22pt; font-weight: 800; width: 30mm; line-height: 1 }
.phead .pno.r { text-align: right }
.phead .ptitle { font-size: 15pt; font-weight: 800; letter-spacing: .25em }
.phead .ptitle small { font-size: 11pt; letter-spacing: 0; font-weight: 700 }
.fhead { text-align: center; margin-bottom: 4mm }
.fhead .yr { font-size: 11pt; letter-spacing: .1em }
.fhead .row { display: flex; align-items: center; justify-content: space-between; margin-top: 2mm }
.fhead .kyosi { border: 1.4pt solid #000; border-radius: 4mm; padding: 1mm 4mm; font-size: 13pt; font-weight: 700 }
.fhead .big { font-size: 30pt; font-weight: 800; letter-spacing: .35em }
.fhead .odd { border: 1.4pt solid #000; padding: 1mm 3mm; font-size: 12pt; font-weight: 700 }
.fhead .who { display: flex; gap: 6mm; justify-content: center; margin-top: 3mm; font-size: 10pt }
.fhead .who span { border-bottom: .8pt solid #000; padding: 0 2mm; min-width: 40mm; display: inline-block; text-align: left }
.fhead .sub { font-size: 9.5pt; margin-top: 1.5mm }
.fhead hr { border: 0; border-top: 2.2pt solid #000; margin: 3mm 0 0 }
.cols { flex: 1; display: flex; gap: 0; min-height: 0 }
.col { flex: 1; display: flex; flex-direction: column; padding: 0 4.5mm; min-width: 0 }
.col + .col { border-left: .8pt solid #000 }
.prob { flex: 1 0 auto }  /* 내용 높이를 먼저 확보하고 남는 공간만 균등 분배 */
.prob.fit { flex: 0 0 auto }
.kind { font-weight: 800; font-size: 10.5pt; margin: 0 0 2mm; display: inline-block; border: 1pt solid #000; padding: 0 2mm }
.qno { font-weight: 800; font-size: 12pt; margin-right: .3em }
.pts { white-space: nowrap }
.stem { text-align: justify }
.fig { text-align: center; margin: 2.5mm 0 }
.cond { border: .8pt solid #000; padding: 1.5mm 3mm; margin: 2mm 0 }
.bogi { border: .8pt solid #000; padding: 2mm 3mm; margin: 2.5mm 0; position: relative }
.bogi-t { text-align: center; font-weight: 700; margin-bottom: 1mm; letter-spacing: .3em }
.choices { display: grid; margin-top: 2.5mm; row-gap: 1.5mm }
.choices.c5 { grid-template-columns: repeat(5, 1fr) }
.choices.c3 { grid-template-columns: repeat(3, 1fr) }
.choices.c1 { grid-template-columns: 1fr }
.choices > span { white-space: nowrap; justify-self: start }
.check { border: 1pt solid #000; padding: 2mm 3mm; font-size: 9.5pt; margin-top: auto }
.check b { display: block; margin-bottom: 1mm }
.pfoot { position: absolute; left: 14mm; right: 14mm; bottom: 4mm; text-align: center; font-size: 8pt; color: #333 }
#measure { position: absolute; left: -9999px; top: 0 }
`;

function probHtml(p, kind) {
  const ch = p.type === 'mc'
    ? `<div class="choices" data-n="5">${p.choices.map((c, i) => `<span>${CIRCLED[i]} ${c}</span>`).join('')}</div>` : '';
  const fig = p.figure ? `<div class="fig"><img src="${figUri(p.figure)}" style="width:${Math.round((p.figure_width || 0.55) * 100)}%"></div>` : '';
  return `<div class="prob" data-no="${p.no}">${kind ? `<div class="kind">${kind}</div><br>` : ''}`
    + `<div class="stem"><span class="qno">${p.no}.</span>${withPoints(p.stem, p.points)}</div>${fig}${ch}</div>`;
}

function examHtml() {
  const blocks = sections.map(s => {
    const list = bySec[s.key];
    const firstShort = list.find(p => p.type === 'short');
    const items = list.map(p => probHtml(p, p === list[0] ? '5지선다형' : p === firstShort ? '단답형' : ''));
    const next = sections[sections.indexOf(s) + 1];
    const check = `<div class="check"><b>※ 확인 사항</b>○ 답안지의 해당란에 필요한 내용을 정확히 기입(표기)했는지 확인하시오.`
      + (s.key === 'common' && next ? `<br>○ 이어서, 「선택과목」 문제가 제시되오니, 자신이 선택한 과목인지 확인하시오.` : '') + `</div>`;
    return `<section data-sec="${s.key}" data-label="${s.label}">${items.join('')}${check}</section>`;
  }).join('');
  return head(meta.title, examCss) + `<div id="measure">${blocks}</div><div id="book"></div>
<script>
const META = ${JSON.stringify(meta)};
${RENDER_MATH}
// 글꼴과 그림이 모두 준비된 뒤에 높이를 잰다 — 그림 디코딩 전 측정하면 단을 넘친다
Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => {}))]).then(paginate);
function paginate() {
const MM = 96 / 25.4;
const PAPER = ${JSON.stringify(PAPER)};
const COL_W = ((PAPER[0] - 28) / 2 - 9) * MM;
const MIN_GAP = 30 * MM;            // 문항 아래 최소 풀이 공간
const MAX_PER_COL = 2;
const measure = document.getElementById('measure');
measure.style.width = COL_W + 'px';

// 선택지 배치: 5열 → 3열 → 1열
measure.querySelectorAll('.choices').forEach(box => {
  const spans = [...box.children];
  const w = Math.max(...spans.map(s => s.getBoundingClientRect().width));
  box.classList.add(w < COL_W / 5 - 6 ? 'c5' : w < COL_W / 3 - 6 ? 'c3' : 'c1');
});

const book = document.getElementById('book');
let pageNo = 0;
function header(sec, first) {
  pageNo++;
  if (first) return '<div class="fhead"><div class="yr">' + META.year + '학년도 대학수학능력시험 대비 · ' + META.title + '</div>'
    + '<div class="row"><span class="kyosi">제 2 교시</span><span class="big">수학 영역</span><span class="odd">홀수형</span></div>'
    + '<div class="who">성명 <span>&nbsp;</span> 수험 번호 <span>&nbsp;</span></div>'
    + '<div class="sub">' + META.subtitle + '</div><hr></div>';
  const odd = pageNo % 2 === 1;
  const pn = '<span class="pno' + (odd ? ' r' : '') + '">' + pageNo + '</span>';
  const t = '<span class="ptitle">수학 영역 <small>' + sec.dataset.label + '</small></span>';
  return '<div class="phead">' + (odd ? '<span class="pno"></span>' + t + pn : pn + t + '<span class="pno"></span>') + '</div>';
}
function newPage(sec, first) {
  const pg = document.createElement('div');
  pg.className = 'page';
  pg.innerHTML = header(sec, first) + '<div class="cols"><div class="col"></div><div class="col"></div></div>'
    + '<div class="pfoot">' + META.copyright + '</div>';
  book.appendChild(pg);
  return [...pg.querySelectorAll('.col')];
}
const overflow = [];
let firstPage = true;
for (const sec of measure.querySelectorAll('section')) {
  const items = [...sec.children];
  let cols = newPage(sec, firstPage); firstPage = false;
  let ci = 0, used = 0, count = 0;
  const colH = () => cols[ci].getBoundingClientRect().height;
  for (const el of items) {
    const isCheck = el.classList.contains('check');
    const h = el.getBoundingClientRect().height;
    const need = isCheck ? h : h + MIN_GAP;
    if ((count >= MAX_PER_COL && !isCheck) || used + need > colH()) {
      ci++; used = 0; count = 0;
      if (ci > 1) { cols = newPage(sec, false); ci = 0; }
    }
    if (need > colH()) { el.classList.add('fit'); overflow.push(el.dataset.no || 'check'); }
    cols[ci].appendChild(el);
    used += need; if (!isCheck) count++;
  }
}
window.__report = {
  pages: pageNo,
  overflow,
  // 실제 배치 후 단 넘침(PDF에서 잘리는 내용) — 0이어야 한다
  colOverflow: [...document.querySelectorAll('#book .col')].filter(c => c.scrollHeight > c.clientHeight + 1)
    .map(c => [...c.querySelectorAll('.prob')].map(p => p.dataset.no).join(',')),
  katexErrors: document.querySelectorAll('.katex-error').length,
  problems: document.querySelectorAll('#book .prob').length,
};
}
</script></body></html>`;
}

/* ───────────────────────── 해설지 ───────────────────────── */

const solCss = `
@page { size: ${PAPER[0]}mm ${PAPER[1]}mm; margin: 14mm 16mm 18mm }
body { font-size: 10.5pt }
.sheet { padding: 0 }
.cover { text-align: center; padding: 6mm 0 4mm; border-bottom: 2.2pt solid #000; margin-bottom: 5mm }
.cover .t { font-size: 22pt; font-weight: 800; letter-spacing: .15em }
.cover .s { font-size: 11pt; margin-top: 1mm }
h2 { font-size: 13pt; font-weight: 800; border-left: 2mm solid #000; padding-left: 2.5mm; margin: 6mm 0 3mm; break-after: avoid }
table.ans { border-collapse: collapse; width: 100%; margin-bottom: 3mm; font-size: 10pt; text-align: center }
table.ans th, table.ans td { border: .8pt solid #000; padding: 1mm 0 }
table.ans th { background: #eee; font-weight: 700 }
/* 카드 전체에 avoid-page 를 걸면 한 쪽보다 긴 카드가 아래 여백으로 넘친다 — 머리줄·문제·STEP 단위로만 묶는다 */
.card { border: .8pt solid #555; border-radius: 2mm; padding: 3mm 4mm; margin: 0 0 4mm }
.chead, .q, .pit, .sfig { break-inside: avoid }
.chead, .q { break-after: avoid }
.chead { display: flex; align-items: baseline; gap: 3mm; border-bottom: .6pt solid #999; padding-bottom: 1.5mm; margin-bottom: 2mm }
.chead .no { font-size: 15pt; font-weight: 800 }
.chead .pt { font-size: 9.5pt }
.chead .concept { flex: 1; font-size: 9.5pt; color: #333 }
.chead .ans { font-weight: 800; border: 1.2pt solid #000; border-radius: 1.5mm; padding: 0 2.5mm; white-space: nowrap }
.q { background: #f4f4f4; border-radius: 1.5mm; padding: 2mm 3mm; font-size: 9.5pt; margin-bottom: 2.5mm }
.q .choices { margin-top: 1mm }
.q .choices > span { margin-right: 4mm; white-space: nowrap; display: inline-block }
.q .fig { text-align: center; margin: 1.5mm 0 }
.cond { border: .8pt solid #000; padding: 1mm 2.5mm; margin: 1.5mm 0; background: #fff }
.bogi { border: .8pt solid #000; padding: 1.5mm 2.5mm; margin: 1.5mm 0; background: #fff }
.bogi-t { text-align: center; font-weight: 700; letter-spacing: .3em }
/* grid 는 Chromium 인쇄에서 쪽 경계로 나뉘지 않아 여백까지 넘친다 — 블록 + 절대배치 태그 */
.step { position: relative; padding-left: 19mm; margin: 1.5mm 0; break-inside: avoid }
.step .tag { position: absolute; left: 0; top: .5mm; width: 17mm; font-weight: 800; font-size: 9pt; background: #000; color: #fff; border-radius: 1mm; text-align: center; height: 5.5mm; line-height: 5.5mm }
.step .st { font-weight: 700 }
.sfig { text-align: center; margin: 2mm 0 }
.pit { margin-top: 2mm; font-size: 9.5pt; border-top: .6pt dashed #999; padding-top: 1.5mm }
.pit b { margin-right: 1.5mm }
`;

function solHtml() {
  const ansTables = sections.map(s => {
    const list = bySec[s.key];
    const rows = [];
    for (let i = 0; i < list.length; i += 11) {
      const chunk = list.slice(i, i + 11);
      rows.push(`<tr><th>번호</th>${chunk.map(p => `<th>${p.no}</th>`).join('')}</tr>`
        + `<tr><th>정답</th>${chunk.map(p => `<td>${p.type === 'mc' ? CIRCLED[+p.answer - 1] : p.answer}</td>`).join('')}</tr>`);
    }
    return `<div><b>${s.name}</b></div><table class="ans">${rows.join('')}</table>`;
  }).join('');

  const cards = sections.map(s => `<h2>${s.name}</h2>` + bySec[s.key].map(p => {
    const ch = p.type === 'mc' ? `<div class="choices">${p.choices.map((c, i) => `<span>${CIRCLED[i]} ${c}</span>`).join('')}</div>` : '';
    const fig = p.figure ? `<div class="fig"><img src="${figUri(p.figure)}" style="width:${Math.round((p.figure_width || 0.55) * 45)}%"></div>` : '';
    const ans = p.type === 'mc' ? `${CIRCLED[+p.answer - 1]} ${p.answer_value || ''}` : p.answer;
    const steps = p.solution_steps.map((st, i) =>
      `<div class="step"><div class="tag">STEP ${i + 1}</div><div><span class="st">${st.title}</span><div>${st.body}</div></div></div>`).join('');
    const sfigs = [].concat(p.solution_figure || []);
    const sfig = sfigs.length ? `<div class="sfig">${sfigs.map(f => `<img src="${figUri(f)}" style="width:${sfigs.length > 1 ? 30 : 40}%;margin:0 2mm">`).join('')}</div>` : '';
    return `<div class="card"><div class="chead"><span class="no">${p.no}</span><span class="pt">[${p.points}점]</span>`
      + `<span class="concept">${p.concept || ''}</span><span class="ans">정답 ${ans}</span></div>`
      + `<div class="q">${p.stem}${fig}${ch}</div>${steps}${sfig}`
      + (p.pitfall ? `<div class="pit"><b>⚠ 실수 주의</b>${p.pitfall}</div>` : '') + `</div>`;
  }).join('')).join('');

  return head(meta.title + ' 해설', solCss) + `<div class="sheet"><div class="cover"><div class="t">정답과 해설</div>`
    + `<div class="s">${meta.year}학년도 대학수학능력시험 대비 · ${meta.title} · 수학 영역</div></div>`
    + `<h2>빠른 정답</h2>${ansTables}${cards}</div>
<script>${RENDER_MATH}
document.fonts.ready.then(() => window.__report = { katexErrors: document.querySelectorAll('.katex-error').length, cards: document.querySelectorAll('.card').length });
</script></body></html>`;
}

/* ───────────────────────── 렌더 ───────────────────────── */

(async () => {
  fs.mkdirSync(args.out, { recursive: true });
  const stem = meta.file_stem || 'mock_exam';
  // 저장소 playwright 버전과 설치된 브라우저가 다를 수 있다 (PITFALLS F-8)
  const exe = process.env.PW_CHROME || ['/opt/pw-browsers/chromium'].find(p => fs.existsSync(p));
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage();
  const jobs = [
    { name: `${stem}_문제지`, html: examHtml(), pdf: { preferCSSPageSize: true, printBackground: true } },
    { name: `${stem}_해설지`, html: solHtml(), pdf: {
      preferCSSPageSize: true, printBackground: true,
      displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: `<div style="width:100%;text-align:center;font-size:8pt;color:#444">${meta.copyright} · <span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
    } },
  ];
  const reports = {};
  for (const job of jobs) {
    const htmlPath = path.join(args.out, `${job.name}.html`);
    fs.writeFileSync(htmlPath, job.html);
    await page.goto('file://' + path.resolve(htmlPath), { waitUntil: 'load' });
    await page.waitForFunction(() => window.__report, null, { timeout: 60000 });
    reports[job.name] = await page.evaluate(() => window.__report);
    await page.pdf({ path: path.join(args.out, `${job.name}.pdf`), ...job.pdf });
    if (!args.html) fs.unlinkSync(htmlPath);
  }
  await browser.close();
  console.log(JSON.stringify({ problems: problems.length, bySection: Object.fromEntries(sections.map(s => [s.key, bySec[s.key].length])), reports }, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
