#!/usr/bin/env node
/**
 * 해설지 렌더 검증 — 브라우저에서 실제로 열고 클릭한다.
 *
 * 정적 검사(verify_sheet.py)로는 절대 잡히지 않는 것들을 잡는다.
 * 이 단계를 건너뛰어 결함 4건이 한꺼번에 나온 사고가 있었다 (PITFALLS A-1).
 *
 * 확인 항목
 *   1) 문항이 실제로 렌더되는가
 *   2) 정답 버튼 클릭 → 정답이 표시되는가   ← 필드명이 틀리면 조용히 실패
 *   3) 초기화 클릭 → 정답이 사라지는가       ← 실제로 누락된 적 있음
 *   4) 그림이 로드되는가 (naturalWidth > 0)
 *   5) JS 예외 0건
 *   6) 빈 문제 없음
 *
 * 샌드박스에는 외부 CDN이 닿지 않으므로 MathJax·Tailwind·Fonts를 스텁한다.
 *   → 수식이 raw TeX(\(9\))로 보이는 것은 정상이다. 실제 브라우저에서는 렌더된다.
 *
 * 사용:
 *   node scripts/verify_render.js <파일> [확인할 문항 수]
 *   node scripts/verify_render.js 수학익힘책_*.html
 */
const { chromium } = require('playwright');
const path = require('path');

const CHROME = process.env.PW_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function stub(page) {
  await page.route('**://cdn.jsdelivr.net/**', r => r.fulfill({
    status: 200, contentType: 'application/javascript',
    body: 'window.MathJax=window.MathJax||{};' +
          'document.addEventListener("DOMContentLoaded",()=>document.body.classList.add("mathjax-ready"));'
  }));
  await page.route('**://cdn.tailwindcss.com/**',
    r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.route('**://fonts.googleapis.com/**',
    r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route('**://fonts.gstatic.com/**', r => r.abort());
  await page.route('**://api.qrserver.com/**', r => r.abort());
}

async function verifyFile(browser, file, maxProblems) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text()))
      errs.push('console: ' + m.text().slice(0, 120));
  });
  await stub(page);
  await page.goto('file://' + path.resolve(file),
                  { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    document.body.classList.add('mathjax-ready');
    document.body.style.opacity = 1;
  });

  // 뷰어형 해설지는 한 번에 한 문항만 DOM에 있다.
  // 총 문항 수는 진행 표시("1 / 11")에서 읽고, 없으면 카드 수로 대체한다.
  const total = await page.evaluate(() => {
    if (window.PROBLEMS && window.PROBLEMS.length) return window.PROBLEMS.length;
    const el = document.querySelector('#progress-label, .progress-label');
    const m = el && el.textContent.match(/(\d+)\s*\/\s*(\d+)/);
    if (m) return parseInt(m[2], 10);
    return document.querySelectorAll('.problem-card,.card.wb-problem').length;
  });
  const n = Math.min(maxProblems || total, total);

  const rows = [];
  for (let k = 0; k < n; k++) {
    // 문항 이동 (뷰어형이면 다음 버튼, 목록형이면 그대로)
    if (k > 0) {
      const nextBtn = await page.$('#next-btn, .nav-next, [data-nav="next"]');
      if (nextBtn) { await nextBtn.click(); await page.waitForTimeout(250); }
    }
    const r = { i: k + 1, ans: '', reset: '-', img: '-' };

    const ansBtn = await page.$('.answer-btn:visible, .step-btn.answer-btn');
    if (ansBtn) {
      await ansBtn.click(); await page.waitForTimeout(200);
      r.ans = (await page.evaluate(() => {
        const e = document.querySelector('.answer-reveal-inline, .answer-reveal');
        return e ? e.textContent.trim().replace(/\s+/g, ' ').slice(0, 70) : '';
      })) || '(표시 안 됨)';

      const resetBtn = await page.$('.reset-btn:visible, .step-btn.reset-btn');
      if (resetBtn) {
        await resetBtn.click(); await page.waitForTimeout(200);
        const left = await page.evaluate(() =>
          document.querySelectorAll('.answer-reveal-inline, .answer-reveal').length);
        r.reset = left === 0 ? 'O' : '남음(' + left + ')';
      }
    }
    r.img = await page.evaluate(() => {
      const im = [...document.images].filter(i => i.src.startsWith('data:'));
      if (!im.length) return '-';
      return im.every(i => i.complete && i.naturalWidth > 0) ? 'OK' : '깨짐';
    });
    rows.push(r);
  }

  const empties = await page.evaluate(() =>
    [...document.querySelectorAll('.problem-statement,.wb-stmt')]
      .filter(e => e.textContent.trim().length < 5).length);

  await page.close();
  return { total, rows, errs, empties };
}

(async () => {
  const args = process.argv.slice(2);
  const maxN = /^\d+$/.test(args[args.length - 1]) ? parseInt(args.pop(), 10) : null;
  if (!args.length) {
    console.error('사용: node scripts/verify_render.js <파일...> [문항수]');
    process.exit(2);
  }
  const browser = await chromium.launch({ executablePath: CHROME });
  let bad = 0;
  for (const f of args) {
    const { total, rows, errs, empties } = await verifyFile(browser, f, maxN);
    const noAns = rows.filter(r => r.ans === '(표시 안 됨)').length;
    const noReset = rows.filter(r => r.reset !== 'O' && r.reset !== '-').length;
    const brokenImg = rows.filter(r => r.img === '깨짐').length;
    const ok = !errs.length && !noAns && !noReset && !brokenImg && !empties;
    bad += ok ? 0 : 1;

    console.log((ok ? '✅ ' : '❌ ') + path.basename(f) + '  문항 ' + total);
    for (const r of rows)
      console.log('     %s  정답="%s"  초기화=%s  그림=%s',
                  String(r.i).padStart(3), r.ans, r.reset, r.img);
    if (empties) console.log('     · 빈 문제 ' + empties + '건');
    if (noAns)   console.log('     · 정답 미표시 ' + noAns + '건 ← 필드명 확인 (answer/answerText)');
    if (noReset) console.log('     · 초기화 실패 ' + noReset + '건');
    if (brokenImg) console.log('     · 그림 깨짐 ' + brokenImg + '건');
    if (errs.length) console.log('     · JS 예외: ' + errs.slice(0, 3).join(' | '));
  }
  await browser.close();
  console.log('\n%d개 파일 · 문제 있는 파일 %d개', args.length, bad);
  process.exit(bad ? 1 : 0);
})();
