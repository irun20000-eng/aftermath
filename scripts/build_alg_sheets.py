#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""대수(1학기) 학습지 — 미적분 I 과 같은 형식(수업 모드)으로 만드는 빌더

차시 번호를 교과서 순서대로 01~38 로 다시 매긴다.
  01~20 : 중간고사 이전 (I. 지수함수와 로그함수 · II-1. 삼각함수) — 새로 만든 차시
  21~38 : 중간고사 이후 (II-2 · III) — 예전 학습지_01~18 을 옮긴 차시

학습지 파일은 두 부분으로 나뉜다.
  · 겉틀(chrome): <head>·머리·위아래 이동·타이머·학생 뽑기·수업 모드 스크립트 …  ← 이 스크립트가 쓴다
  · 본문: <!-- ===== 본문 시작 ===== --> 와 <!-- ===== 본문 끝 ===== --> 사이   ← 사람이 쓴다

사용:
  python scripts/build_alg_sheets.py init      # 처음 한 번: 예전 18개 → 새 이름(본문 이관) · 새 20개 빈 틀 · 예전 이름은 이동 안내 파일
  python scripts/build_alg_sheets.py chrome    # 38개 학생용 학습지의 겉틀을 다시 쓴다 (본문은 그대로)
  python scripts/build_alg_sheets.py teacher   # 교사용/ 사본 38개 + 판서 계획·lesson-mode 사본
  python scripts/build_alg_sheets.py index     # index.html(학생용) · 교사용/교사용_index-alg.html 차시 목록
  python scripts/build_alg_sheets.py all       # chrome → teacher → index
"""
import pathlib, re, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
T = ROOT / "교사용"
VER = "20261105"
FORM = "https://docs.google.com/forms/d/e/1FAIpQLSd223-GuArCmhkyhbjsu10qou6tUomqwuw2stc5TYWQ6LZnNQ/viewform?usp=pp_url&entry.234011956="
BEGIN = "<!-- ===== 본문 시작 ===== -->"
END = "<!-- ===== 본문 끝 ===== -->"

U = {
    "I-1": "I-1. 지수와 로그",
    "I-2": "I-2. 지수함수와 로그함수",
    "I": "I. 지수함수와 로그함수",
    "II-1": "II-1. 삼각함수",
    "II-2": "II-2. 사인법칙과 코사인법칙",
    "II": "II. 삼각함수",
    "III-1": "III-1. 등차수열과 등비수열",
    "III-2": "III-2. 수열의 합",
    "III-3": "III-3. 수학적 귀납법",
    "III": "III. 수열",
}

# (번호, 파일 이름 조각, 화면 제목, 단원 키, 예전 파일, 교과서 쪽)
ORDER = [
    (1, "거듭제곱과거듭제곱근", "거듭제곱과 거듭제곱근", "I-1", None, "11~17"),
    (2, "지수의확장_정수지수", "지수의 확장 (1) — 정수 지수", "I-1", None, "18~20"),
    (3, "지수의확장_유리수와실수지수", "지수의 확장 (2) — 유리수·실수 지수", "I-1", None, "21~25"),
    (4, "로그의뜻과성질", "로그의 뜻과 성질", "I-1", None, "26~29"),
    (5, "로그의밑의변환", "로그의 밑의 변환", "I-1", None, "30~32"),
    (6, "상용로그", "상용로그", "I-1", None, "33~36"),
    (7, "중단원마무리_I_1", "중단원 마무리 I-1 (지수와 로그)", "I-1", None, "37~39"),
    (8, "지수함수", "지수함수와 그 그래프", "I-2", None, "41~46"),
    (9, "로그함수", "로그함수와 그 그래프", "I-2", None, "47~51"),
    (10, "지수함수의활용", "지수함수의 활용", "I-2", None, "52~54"),
    (11, "로그함수의활용", "로그함수의 활용", "I-2", None, "55~58"),
    (12, "중단원마무리_I_2", "중단원 마무리 I-2 (지수함수와 로그함수)", "I-2", None, "59~61"),
    (13, "대단원평가_I", "대단원 평가 (I)", "I", None, "62~66"),
    (14, "일반각과호도법", "일반각과 호도법", "II-1", None, "69~75"),
    (15, "삼각함수", "삼각함수의 뜻과 값의 부호", "II-1", None, "76~79"),
    (16, "삼각함수사이의관계", "삼각함수 사이의 관계", "II-1", None, "80~82"),
    (17, "사인함수와코사인함수의그래프", "사인함수와 코사인함수의 그래프", "II-1", None, "83~89"),
    (18, "탄젠트함수의그래프", "탄젠트함수의 그래프", "II-1", None, "90~92"),
    (19, "삼각방정식과부등식", "삼각함수가 포함된 방정식과 부등식", "II-1", None, "93~94"),
    (20, "중단원마무리_II_1", "중단원 마무리 II-1 (삼각함수)", "II-1", None, "95~97"),
    (21, "사인법칙", "사인법칙", "II-2", "학습지_01_사인법칙.html", "99~104"),
    (22, "코사인법칙", "코사인법칙", "II-2", "학습지_02_코사인법칙.html", "104~108"),
    (23, "삼각형의넓이", "삼각형의 넓이", "II-2", "학습지_03_삼각형의넓이.html", "109~112"),
    (24, "중단원마무리_II_2", "중단원 마무리 II-2 (사인법칙과 코사인법칙)", "II-2", "학습지_04_중단원마무리.html", "113~115"),
    (25, "대단원평가_II", "대단원 평가 (II)", "II", "학습지_05_대단원평가.html", "116~120"),
    (26, "등차수열", "등차수열", "III-1", "학습지_06_등차수열.html", "123~129"),
    (27, "등차수열의합", "등차수열의 합", "III-1", "학습지_07_등차수열의합.html", "129~132"),
    (28, "등비수열", "등비수열", "III-1", "학습지_08_등비수열.html", "133~136"),
    (29, "등비수열의합", "등비수열의 합", "III-1", "학습지_09_등비수열의합.html", "136~138"),
    (30, "중단원마무리_III_1", "중단원 마무리 III-1 (등차수열과 등비수열)", "III-1", "학습지_10_중단원마무리_III_1.html", "139~141"),
    (31, "합의기호", "합의 기호 \\(\\Sigma\\)", "III-2", "학습지_11_합의기호.html", "143~145"),
    (32, "자연수의거듭제곱의합", "자연수의 거듭제곱의 합", "III-2", "학습지_12_자연수의거듭제곱의합.html", "146~148"),
    (33, "여러가지수열의합", "여러 가지 수열의 합", "III-2", "학습지_13_여러가지수열의합.html", "148~150"),
    (34, "중단원마무리_III_2", "중단원 마무리 III-2 (수열의 합)", "III-2", "학습지_14_중단원마무리_III_2.html", "151~153"),
    (35, "수열의귀납적정의", "수열의 귀납적 정의", "III-3", "학습지_15_수열의귀납적정의.html", "155~"),
    (36, "수학적귀납법", "수학적 귀납법", "III-3", "학습지_16_수학적귀납법.html", "~"),
    (37, "중단원마무리_III_3", "중단원 마무리 III-3 (수학적 귀납법)", "III-3", "학습지_17_중단원마무리_III_3.html", "~"),
    (38, "대단원평가_III", "대단원 평가 (III)", "III", "학습지_18_대단원평가_III.html", "~"),
]


def fname(e):
    return f"학습지_대수_{e[0]:02d}_{e[1]}.html"


def plain(t):
    """제목의 수식을 글자로 (title·폼 이름용)"""
    return t.replace("\\(\\Sigma\\)", "Σ").replace("\\(", "").replace("\\)", "")


STYLE = r"""
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
        body { font-family: 'Noto Sans KR', sans-serif; background-color: #f8fafc; color: #0f172a; opacity: 0; transition: opacity 0.3s; line-height: 1.7; }
        body.mathjax-ready { opacity: 1; }

        .card { background: white; border-radius: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); padding: 2.5rem; margin-bottom: 3rem; border: 1px solid #e2e8f0; }
        .section-title { font-size: 1.875rem; font-weight: 900; color: #1e293b; margin-bottom: 2rem; border-bottom: 3px solid #e2e8f0; padding-bottom: 0.75rem; letter-spacing: -0.025em; }

        .reveal-box {
            display: inline-flex; align-items: center; justify-content: center;
            min-width: 80px; min-height: 40px; background: #f1f5f9; border: 2px solid #cbd5e1;
            border-radius: 0.75rem; cursor: pointer; position: relative; vertical-align: middle; margin: 0 4px; overflow: hidden;
            transition: all 0.2s;
        }
        .reveal-box:hover { border-color: #94a3b8; background: #e2e8f0; }
        .reveal-box .ans { opacity: 0; pointer-events: none; font-weight: 800; color: #2563eb; transition: opacity 0.3s; padding: 0 10px; }
        .reveal-box::after { content: '?'; color: #64748b; position: absolute; font-size: 1.25rem; font-weight: 900; }
        .reveal-box.active { background: #eff6ff; border-color: #3b82f6; }
        .reveal-box.active .ans { opacity: 1; }
        .reveal-box.active::after { opacity: 0; }

        .thinking-space { min-height: 120px; border: 2px dashed #cbd5e1; border-radius: 1rem; margin-top: 1.5rem; background-color: #f8fafc; padding: 1.5rem; position: relative; }
        .thinking-space::before { content: 'Thinking Space'; position: absolute; top: 1rem; left: 1.5rem; color: #94a3b8; font-weight: 700; font-size: 0.875rem; letter-spacing: 0.05em; text-transform: uppercase; }

        .badge { font-size: 0.875rem; padding: 0.375rem 1rem; border-radius: 0.5rem; font-weight: 800; display: inline-block; margin-bottom: 1rem; letter-spacing: 0.025em; }
        .badge-l1 { color: #166534; background: #dcfce7; border: 1px solid #bbf7d0; }
        .badge-l2 { color: #854d0e; background: #fef9c3; border: 1px solid #fef08a; }
        .badge-l3 { color: #991b1b; background: #fee2e2; border: 1px solid #fecaca; }

        .hint-box { background: #fffbeb; border-left: 6px solid #f59e0b; padding: 1.5rem; border-radius: 0 1rem 1rem 0; margin-top: 1.5rem; }
        .trap-box summary { list-style: none; }
        .trap-box summary::-webkit-details-marker { display: none; }
        .trap-hint { font-size: 0.75rem; color: #b91c1c; font-weight: 700; margin-left: 0.5rem; }

        .alg-accent { color: #2563eb; }

        @media print {
            .no-print { display: none !important; }
            body { opacity: 1; background: white; }
            .card { box-shadow: none; border: none; padding: 1rem 0; margin-bottom: 1rem; }
            .thinking-space { min-height: 100px; }
        }
"""

BTN_MAIN = ('<a href="index.html" target="aftermath_main" class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 '
            'text-slate-700 hover:text-slate-900 rounded-lg text-sm font-bold border border-slate-200 transition-colors shadow-sm">\n'
            '                <span>🏠</span><span>메인</span>\n'
            '                <kbd class="ml-1 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs text-slate-500 font-mono">H</kbd>\n'
            '            </a>')
BTN_PREV = ('<a href="{href}" class="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 '
            'rounded-lg text-sm font-bold border border-slate-200 transition-colors shadow-sm"><span>←</span><span>이전 차시</span></a>')
BTN_NEXT = ('<a href="{href}" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 '
            'rounded-lg text-sm font-bold border border-indigo-200 transition-colors shadow-sm"><span>다음 차시</span><span>→</span></a>')


def navbar(i, bottom=False):
    prev = fname(ORDER[i - 1]) if i > 0 else None
    nxt = fname(ORDER[i + 1]) if i + 1 < len(ORDER) else None
    btns = []
    if prev:
        btns.append(BTN_PREV.format(href=prev))
    if nxt:
        btns.append(BTN_NEXT.format(href=nxt))
    cls = ("aft-bottom-nav no-print mt-12 mb-4" if bottom else "no-print -mt-12 mb-8")
    return (f'        <nav class="{cls} flex justify-between items-center gap-2 flex-wrap">\n'
            f'            {BTN_MAIN}\n'
            f'            <div class="flex gap-2">\n                ' + "\n                ".join(btns) +
            '\n            </div>\n        </nav>')


def top(i):
    n, slug, title, ukey, old, pages = ORDER[i]
    unit = U[ukey]
    unit_label = ("대단원: " if "-" not in ukey else "단원: ") + unit
    return f"""<!DOCTYPE html>
<!-- 2026 1학기 대수 · 단원 {unit} · 차시 {n:02d} {plain(title)} · 교과서(미래엔) {pages}쪽 -->
<!-- 겉틀은 scripts/build_alg_sheets.py 가 쓴다. 본문만 고친다. -->
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>2026 대수 학습지: {plain(title)}</title>
    <meta name="robots" content="noindex,nofollow">
    <script>
        window.MathJax = {{
            tex: {{ inlineMath: [['\\\\(','\\\\)']], displayMath: [['\\\\[','\\\\]']], processEscapes: true }},
            options: {{ ignoreHtmlClass: 'tex2jax_ignore', processHtmlClass: 'mathjax-process' }},
            startup: {{ pageReady: () => MathJax.startup.defaultPageReady().then(() => document.body.classList.add('mathjax-ready')) }}
        }};
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <script>window.name = 'aftermath_ws_alg_{n:02d}';</script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>{STYLE}    </style>
    <link rel="stylesheet" href="widgets.css">
    <link rel="stylesheet" href="lesson-mode.css?v={VER}">
</head>
<body class="p-4 md:p-8 lg:p-12 mathjax-process">
    <script>
        const GOOGLE_FORM_BASE_URL = "{FORM}";
        const LESSON_NAME = "{n:02d}차시 {plain(title)}";
        const GOOGLE_FORM_URL = GOOGLE_FORM_BASE_URL ? GOOGLE_FORM_BASE_URL + encodeURIComponent(LESSON_NAME) : "";
    </script>

    <div class="max-w-4xl mx-auto">
        <header class="text-center mb-16 border-b-4 border-slate-800 pb-10">
            <p class="text-slate-500 font-bold text-sm tracking-[0.3em] mb-3 uppercase">2026학년도 1학기 | 대수</p>
            <h1 class="text-5xl font-black text-slate-900 mb-8 tracking-tight">대수 수업 학습지</h1>
            <div class="flex flex-wrap justify-center items-center gap-6 text-lg font-bold text-slate-700">
                <span class="bg-slate-100 px-5 py-2 rounded-lg border border-slate-200 shadow-sm">{unit_label}</span>
                <span class="bg-blue-100 text-blue-800 px-5 py-2 rounded-lg border border-blue-200 shadow-sm">{n:02d}차시: {title}</span>
            </div>
        </header>

{navbar(i)}

        {BEGIN}
"""


def bottom(i):
    n = ORDER[i][0]
    return f"""        {END}

{navbar(i, bottom=True)}

        <footer class="text-center text-slate-400 text-xs py-8 font-bold opacity-60">
            <p>© 2026 Mathematics Education Engineering · 대수 학습지 {n:02d}차시</p>
        </footer>
    </div>

    <script>
        function toggleReveal(el) {{
            el.classList.add('active');
            if (typeof MathJax !== 'undefined' && el.classList.contains('active')) {{
                MathJax.typesetPromise([el]);
            }}
        }}

        window.addEventListener('DOMContentLoaded', () => {{
            const qrContainer = document.getElementById('qr-container');
            const formLinkBtn = document.getElementById('form-link-btn');
            if (!qrContainer || !formLinkBtn) return;
            if (GOOGLE_FORM_URL && GOOGLE_FORM_URL.includes('http')) {{
                const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${{encodeURIComponent(GOOGLE_FORM_URL)}}`;
                qrContainer.innerHTML = `<img src="${{qrImageUrl}}" alt="QR Code" class="w-full h-full object-contain">`;
                formLinkBtn.href = GOOGLE_FORM_URL;
            }} else {{
                qrContainer.innerHTML = `<span class="text-slate-400 text-sm text-center font-bold">구글 폼 URL 확정 후 QR이 활성화됩니다.</span>`;
            }}
        }});
    </script>

    <script>
        // 메인 단축키 (H/Esc → index.html)
        document.addEventListener('keydown', (e) => {{
            if (e.isComposing) return;
            const t = e.target;
            if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
            if (e.key === 'h' || e.key === 'H' || e.key === 'Escape') {{
                e.preventDefault();
                const w = window.open('index.html', 'aftermath_main'); if (w) w.focus();
            }}
        }});
    </script>

    <!-- floating 타이머 위젯 (widgets.js 자동 마운트) -->
    <div id="aft-timer-widget" class="aft-widget no-print" data-widget="timer">
      <div class="aft-widget-head">
        <span class="aft-widget-title">⏱ 타이머</span>
        <button type="button" class="aft-widget-collapse" aria-label="접기/펼치기">▾</button>
      </div>
      <div class="aft-widget-body">
        <div id="aft-timer-display" class="aft-timer-display">01:00</div>
        <div class="aft-timer-presets">
          <button type="button" class="aft-preset" data-sec="60">1분</button>
          <button type="button" class="aft-preset" data-sec="180">3분</button>
          <button type="button" class="aft-preset" data-sec="300">5분</button>
          <button type="button" class="aft-preset" data-sec="600">10분</button>
        </div>
        <div class="aft-timer-controls">
          <button type="button" id="aft-timer-start">시작</button>
          <button type="button" id="aft-timer-pause">일시정지</button>
          <button type="button" id="aft-timer-reset">리셋</button>
        </div>
      </div>
      <div class="aft-widget-resize" aria-hidden="true"></div>
    </div>

    <!-- 학생 뽑기 — FAB + 모달 (iframe은 열 때 주입해 첫 로딩을 늦추지 않는다) -->
    <button type="button" id="aft-picker-fab" class="aft-fab no-print" aria-label="학생 뽑기">
      <span class="aft-fab-icon">🎲</span>
      <span>학생 뽑기</span>
    </button>

    <div id="aft-picker-modal" class="aft-picker-modal no-print" role="dialog" aria-modal="true" aria-label="학생 뽑기" aria-hidden="true">
      <div class="aft-picker-overlay" data-picker-close></div>
      <div class="aft-picker-panel">
        <div class="aft-picker-head">
          <span class="aft-picker-title">🎲 학생 뽑기 — 대수</span>
          <span class="aft-picker-tools">
            <a class="aft-picker-btn" href="뽑기.html" target="aftermath_picker">새 창으로 ↗</a>
            <button type="button" class="aft-picker-btn" data-picker-close>✕ 닫기</button>
          </span>
        </div>
        <div class="aft-picker-body" data-picker-src="뽑기.html"></div>
      </div>
    </div>

    <style id="aft-picker-css">
    .aft-picker-modal {{ position: fixed; inset: 0; z-index: 10000; display: none; }}
    .aft-picker-modal.is-open {{ display: block; }}
    .aft-picker-overlay {{ position: absolute; inset: 0; background: rgba(15,23,42,.55); }}
    .aft-picker-panel {{ position: absolute; inset: 2vh 2vw; display: flex; flex-direction: column;
      background: #fff; border-radius: 1rem; overflow: hidden; box-shadow: 0 24px 64px rgba(15,23,42,.35); }}
    .aft-picker-head {{ display: flex; justify-content: space-between; align-items: center; gap: .75rem;
      padding: .7rem 1rem; background: #3730a3; color: #fff; flex-wrap: wrap; }}
    .aft-picker-title {{ font-size: .95rem; font-weight: 800; }}
    .aft-picker-tools {{ display: flex; gap: .5rem; }}
    .aft-picker-btn {{ padding: .4rem .8rem; border: 1px solid rgba(255,255,255,.5); border-radius: .5rem;
      background: transparent; color: #fff; font-size: .8rem; font-weight: 700; font-family: inherit;
      cursor: pointer; text-decoration: none; }}
    .aft-picker-btn:hover {{ background: rgba(255,255,255,.16); color: #fff; }}
    .aft-picker-body {{ flex: 1; min-height: 0; }}
    .aft-picker-body iframe {{ width: 100%; height: 100%; border: 0; display: block; }}
    @media print {{ .aft-picker-modal, #aft-picker-fab {{ display: none !important; }} }}
    </style>

    <script id="aft-picker-js">
    (function () {{
      var fab = document.getElementById('aft-picker-fab');
      var modal = document.getElementById('aft-picker-modal');
      if (!fab || !modal) return;
      var body = modal.querySelector('.aft-picker-body');
      var opener = null;

      function open() {{
        if (!body.firstChild) {{                       // 처음 열 때만 iframe 생성
          var f = document.createElement('iframe');
          f.src = body.getAttribute('data-picker-src');
          f.title = '학생 뽑기';
          body.appendChild(f);
        }}
        opener = document.activeElement;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        var c = modal.querySelector('button[data-picker-close]');
        if (c) c.focus();
      }}
      function close() {{
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (opener && opener.focus) opener.focus();
      }}
      fab.addEventListener('click', open);
      modal.addEventListener('click', function (e) {{
        if (e.target.closest('[data-picker-close]')) {{ e.preventDefault(); close(); }}
      }});
      document.addEventListener('keydown', function (e) {{
        if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
      }});
    }})();
    </script>

    <script src="widgets.js"></script>
    <script src="boardplans/alg_{n:02d}.js?v={VER}"></script>
    <script src="lesson-mode.js?v={VER}"></script>

<script>
/* named window 일관 처리 — 이미 열린 창 있으면 새 창 없이 focus */
document.addEventListener('click', function(e) {{
  const a = e.target.closest('a[target^="aftermath_"]');
  if (!a) return;
  e.preventDefault();
  const w = window.open(a.href, a.target);
  if (w) w.focus();
}});
</script>

<a href="#" class="aft-top-btn no-print" id="aft-top-btn" aria-label="맨 위로">▲ TOP</a>
<style id="aft-top-css">
.aft-top-btn{{position:fixed;left:24px;bottom:24px;z-index:9997;display:none;
  align-items:center;gap:6px;padding:10px 16px;border:none;border-radius:999px;
  background:#4f46e5;color:#fff;font-size:14px;font-weight:700;font-family:inherit;
  text-decoration:none;cursor:pointer;box-shadow:0 4px 14px rgba(79,70,229,.38);}}
.aft-top-btn:hover{{background:#4338ca;color:#fff;}}
.aft-top-btn.is-on{{display:inline-flex;}}
@media (max-width:600px){{.aft-top-btn{{left:16px;bottom:16px;padding:9px 14px;font-size:13px;}}}}
@media print{{.aft-top-btn{{display:none !important;}}}}
</style>
<script id="aft-top-js">
(function(){{
  var b=document.getElementById('aft-top-btn'); if(!b) return;
  function sy(){{return window.pageYOffset||document.documentElement.scrollTop||0;}}
  function t(){{ if(sy()>400) b.classList.add('is-on'); else b.classList.remove('is-on'); }}
  window.addEventListener('scroll',t,{{passive:true}});
  window.addEventListener('resize',t);
  t();
  b.addEventListener('click',function(e){{
    e.preventDefault();
    try{{ window.scrollTo({{top:0,behavior:'smooth'}}); }}catch(_){{ window.scrollTo(0,0); }}
  }});
}})();
</script>
</body>
</html>
"""


PLACEHOLDER = """
        <!-- 이 차시 본문은 아직 비어 있다. 학습지 형식은 .claude/work/ALG_SPEC.md 참고 -->
        <section class="card bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
            <h2 class="section-title text-indigo-900 border-indigo-200">00. 생각 열기 (Warm-up &amp; Connection)</h2>
            <p class="text-slate-500">준비 중</p>
        </section>
"""


def old_body(old_html):
    """예전 학습지의 본문: 첫 번째 <nav> 뒤 ~ <footer> 앞"""
    i = old_html.find("</nav>")
    j = old_html.find("<footer")
    assert i > 0 and j > i, "본문 경계를 찾지 못함"
    body = old_html[i + len("</nav>"):j]
    # 학습지 본문 안의 예전 차시 파일 이름 → 새 이름
    for e in ORDER:
        if e[4]:
            body = body.replace(e[4], fname(e))
    return "\n" + body.strip("\n") + "\n\n"


def body_of(html):
    i, j = html.find(BEGIN), html.find(END)
    assert i > 0 and j > i, "본문 표식 없음"
    return html[i + len(BEGIN):j]


def write(p, s):
    p.write_text(s, encoding="utf-8", newline="\n")


REDIRECT = """<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<meta name="robots" content="noindex,nofollow">
<title>이동 안내 — {title}</title>
<meta http-equiv="refresh" content="0; url={new}">
<script>location.replace('{new}' + location.search + location.hash);</script>
</head><body style="font-family:sans-serif;padding:2rem">
<p>차시 번호가 바뀌었습니다 (교과서 순서 01~38). <a href="{new}">{n:02d}차시 {title} 학습지로 이동</a></p>
</body></html>
"""


def cmd_init(force=False):
    for i, e in enumerate(ORDER):
        p = ROOT / fname(e)
        if p.exists() and not force:
            print("있음 (건너뜀):", p.name)
            continue
        if e[4]:
            body = old_body((ROOT / e[4]).read_text(encoding="utf-8"))
        else:
            body = PLACEHOLDER
        write(p, assemble(i, body.rstrip() + "\n\n        "))
        print("작성:", p.name)
    for e in ORDER:
        if e[4]:
            op = ROOT / e[4]
            if "lesson-mode" in op.read_text(encoding="utf-8") or "http-equiv=\"refresh\"" in op.read_text(encoding="utf-8"):
                continue
            write(op, REDIRECT.format(new=fname(e), title=plain(e[2]), n=e[0]))
            print("이동 안내:", op.name, "→", fname(e))


def assemble(i, b):
    """겉틀(위) + 본문 + 겉틀(아래). b 는 BEGIN 과 END 사이 글 그대로"""
    t = top(i)
    t = t[:t.rfind(BEGIN) + len(BEGIN)]
    bt = bottom(i)
    bt = bt[bt.find(END):]
    return t + b + bt


def cmd_chrome():
    for i, e in enumerate(ORDER):
        p = ROOT / fname(e)
        write(p, assemble(i, body_of(p.read_text(encoding="utf-8"))))
    print("겉틀 갱신:", len(ORDER))


# ---------- 교사용 사본 ----------
LINK = re.compile(r'((?:href|src|data-picker-src)=")([^"#?:]+?\.(?:html|css|js|png|jpe?g|svg|gif))((?:[#?][^"]*)?")')


def teacher_html(s):
    s = s.replace("window.name = 'aftermath_ws_alg_", "window.name = 'aftermath_ws_alg'; //")
    s = re.sub(r"window\.name = 'aftermath_ws_alg'; //\d\d';", "window.name = 'aftermath_ws_alg';", s)
    s = s.replace("'index.html', 'aftermath_main'", "'교사용_index-alg.html', 'aftermath_main'")
    s = s.replace("(H/Esc → index.html)", "(H/Esc → 교사용_index-alg.html)")

    def fix(m):
        pre, path, post = m.group(1), m.group(2), m.group(3)
        if path == "index.html":
            return pre + "교사용_index-alg.html" + post
        if re.match(r"학습지_대수_\d\d_", path):
            return pre + "교사용_" + path + post
        if (T / path).exists() or path.startswith("boardplans/"):
            return pre + path + post
        if (ROOT / path).exists():
            return pre + "../" + path + post
        return m.group(0)
    return LINK.sub(fix, s)


def cmd_teacher():
    (T / "boardplans").mkdir(exist_ok=True)
    for e in ORDER:
        src = ROOT / fname(e)
        write(T / ("교사용_" + fname(e)), teacher_html(src.read_text(encoding="utf-8")))
    for f in ["lesson-mode.js", "lesson-mode.css"]:
        shutil.copyfile(ROOT / f, T / f)
    n = 0
    for p in sorted((ROOT / "boardplans").glob("alg_*.js")):
        shutil.copyfile(p, T / "boardplans" / p.name)
        n += 1
    print(f"교사용 학습지 {len(ORDER)}개 · 판서 계획 사본 {n}개")


# ---------- 인덱스 ----------
CARDS = [
    ("I-1", "🔢", [1, 2, 3, 4, 5, 6, 7]),
    ("I-2", "📈", [8, 9, 10, 11, 12, 13]),
    ("II-1", "🌀", [14, 15, 16, 17, 18, 19, 20]),
    ("EXAM", "📝", []),
    ("II-2", "📐", [21, 22, 23, 24, 25]),
    ("III-1", "📊", [26, 27, 28, 29, 30]),
    ("III-2", "∑", [31, 32, 33, 34]),
    ("III-3", "🔁", [35, 36, 37, 38]),
]


def idx_title(e):
    t = e[2]
    return t.replace("\\(\\Sigma\\)", "\\(\\Sigma\\)")


def rows(nums, teacher):
    out = []
    for n in nums:
        e = ORDER[n - 1]
        f = fname(e)
        if teacher:
            tf = "교사용_" + f
            out.append(f"""                <div class="lesson-row" data-lesson="{tf}">
                    <button class="progress-check" title="진도 체크">✓</button>
                    <a class="lesson-link" href="{tf}?mode=class" target="aftermath_ws_alg" title="수업 모드로 열기 (전자칠판)">
                        <span class="flex items-center gap-3"><span class="lesson-num">{n:02d}</span><span>{idx_title(e)} <span class="ext-icon">↗</span></span></span>
                        <span class="text-slate-400 text-sm">→</span>
                    </a>
                    <a class="lm-pill lm-pill-plain" href="{tf}" target="aftermath_ws_alg" title="스크롤 학습지 그대로 보기 · 인쇄">일반 보기</a>
                </div>""")
        else:
            out.append(f"""                <div class="lesson-row" data-lesson="{f}">
                    <button class="progress-check" title="진도 체크">✓</button>
                    <a class="lesson-link" href="{f}" target="aftermath_ws_alg_{n:02d}" rel="noopener noreferrer">
                        <span class="flex items-center gap-3"><span class="lesson-num">{n:02d}</span><span>{idx_title(e)} <span class="ext-icon">↗</span></span></span>
                        <span class="text-slate-400 text-sm">→</span>
                    </a>
                    <a class="lm-pill" href="{f}?mode=class" target="aftermath_ws_alg_{n:02d}" title="전자칠판 수업 화면 (왼쪽 본문 · 오른쪽 판서)">수업 모드</a>
                </div>""")
    return "\n".join(out)


def exam_card(teacher):
    href = ("../" if teacher else "") + "중간고사_자기평가성찰지.html"
    return f"""        <!-- 시험 성찰 (중간고사 직후 첫 차시 — 21차시 앞) -->
        <div class="unit-card mb-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <h2 class="unit-title"><span>📝</span> 시험 성찰 <span class="text-xs font-normal text-amber-700 ml-2">— 중간고사 직후 첫 차시</span></h2>
            <div class="grid gap-2">
                <div class="lesson-row" data-lesson="중간고사_자기평가성찰지.html">
                    <button class="progress-check" title="진도 체크">✓</button>
                    <a class="lesson-link" href="{href}" target="aftermath_selfeval" rel="noopener noreferrer">
                        <span class="flex items-center gap-3"><span class="lesson-num" style="background:#fff7ed;color:#c2410c">M</span><span>중간고사 자기평가 &amp; 성찰지 <span class="ext-icon">↗</span></span></span>
                        <span class="text-slate-400 text-sm">→</span>
                    </a>
                </div>
            </div>
        </div>
"""


def lesson_cards(teacher):
    parts = ["        <!-- ===== 차시 목록 시작 (scripts/build_alg_sheets.py index 가 쓴다) ===== -->"]
    for key, icon, nums in CARDS:
        if key == "EXAM":
            parts.append(exam_card(teacher))
            continue
        title = U[key]
        if key == "I-2":
            title += " · 대단원 평가 I"
        if key == "II-2":
            title += " · 대단원 평가 II"
        if key == "III-3":
            title += " · 대단원 평가 III"
        parts.append(f"""        <div class="unit-card mb-6">
            <h2 class="unit-title"><span>{icon}</span> {title}</h2>
            <div class="grid gap-2">
{rows(nums, teacher)}
            </div>
        </div>
""")
    parts.append("        <!-- ===== 차시 목록 끝 ===== -->")
    return "\n".join(parts)


IDX_B = "<!-- ===== 차시 목록 시작"
IDX_E = "<!-- ===== 차시 목록 끝 ===== -->"


def splice_cards(html, cards):
    i = html.find(IDX_B)
    j = html.find(IDX_E)
    i = html.rfind("\n", 0, i) + 1
    return html[:i] + cards + html[j + len(IDX_E):]


def cmd_index():
    # 학생용 index.html
    p = ROOT / "index.html"
    s = p.read_text(encoding="utf-8")
    if IDX_B not in s:
        # 처음: '시험 성찰' 카드부터 수능특강 카드 앞까지를 차시 목록으로 바꾼다
        i = s.find("<!-- 시험 성찰")
        j = s.find('<div class="unit-card mb-6 bg-gradient-to-br from-rose-50 to-purple-50')
        j = s.rfind("\n", 0, j) + 1
        # 수능특강 카드 앞 주석 줄까지 포함
        k = s.rfind("<!--", i, j)
        if k > 0 and "수능특강" in s[k:j]:
            j = s.rfind("\n", 0, k) + 1
        i = s.rfind("\n", 0, i) + 1
        s = s[:i] + IDX_B + " -->\n" + IDX_E + "\n\n" + s[j:]
    s = splice_cards(s, lesson_cards(False))
    write(p, s)
    print("index.html 차시 목록 38개")

    # 교사용 인덱스
    tp = T / "교사용_index-alg.html"
    if not tp.exists():
        print("교사용_index-alg.html 없음 — 먼저 만든다 (make_teacher_index)")
        return
    ts = tp.read_text(encoding="utf-8")
    ts = splice_cards(ts, lesson_cards(True))
    write(tp, ts)
    print("교사용_index-alg.html 차시 목록 38개")


if __name__ == "__main__":
    c = sys.argv[1] if len(sys.argv) > 1 else ""
    if c == "init":
        cmd_init("--force" in sys.argv)
    elif c == "chrome":
        cmd_chrome()
    elif c == "teacher":
        cmd_teacher()
    elif c == "index":
        cmd_index()
    elif c == "all":
        cmd_chrome(); cmd_teacher(); cmd_index()
    else:
        print(__doc__)
