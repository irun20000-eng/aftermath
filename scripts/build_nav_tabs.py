#!/usr/bin/env python3
"""교사용 Nav → 수업 모드 탭 구조 변환기

원본은 항상 main 브랜치의 Nav 를 읽는다 (git show main:…) → 여러 번 돌려도 결과가 같다.
판서 예시 칠판의 제목(label)과 탭 시간(minutes)은 boardplans/calc_NN.js 에서 가져온다.
탭 시간은 Nav 타임라인(B)에서 계산해 판서 계획 파일(루트·교사용 두 벌)에 minutes 로 써 넣는다.

사용:
  python3 scripts/build_nav_tabs.py 18 19 20 …
"""
import json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
T = ROOT / "교사용"
VER = "20261012"

LEGEND = ('    <div class="nv-legend"><span><i style="background:#1e293b"></i>검정 · 기본 식</span>'
          '<span><i style="background:#1d4ed8"></i>파랑 · 핵심 결과</span>'
          '<span><i style="background:#dc2626"></i>빨강 · 함정·주의</span>'
          '<span><i style="background:#15803d"></i>초록 · 학생 답·발표</span></div>\n')
PROMISE = ('    <h2 class="section-h"><span class="ico">P</span> 판서 운영 약속</h2>\n'
           '    <p style="font-size:.85rem;color:#475569;margin-bottom:.5rem;">수업 모드에서 학습지 오른쪽 절반이 판서 공간이다. '
           '전자칠판 <strong>필기모드</strong>로 화면을 잡은 뒤, 흐리게 표시된 <strong>구역 ①②③ 순서대로</strong> 쓴다. '
           '각 탭의 <strong>판서 예시</strong>가 그 구역에 무엇을 어떤 색으로 쓸지 보여 준다. '
           '예시의 <strong>[수업 화면 열기]</strong>를 누르면 학습지의 같은 화면이 바로 열린다. '
           '<strong>[수업 중 보기]</strong>는 판서 예시만 크게 보여 준다 (태블릿·보조 화면용).</p>\n')


def git_main(rel: str) -> str:
    out = subprocess.run(["git", "show", f"main:{rel}"], cwd=ROOT, capture_output=True)
    if out.returncode:
        raise SystemExit(f"git show 실패: {rel}\n{out.stderr.decode('utf-8', 'replace')}")
    return out.stdout.decode("utf-8").replace("\r\n", "\n")


def load_plan(nn: str) -> dict:
    js = ("global.window={};require(process.argv[1]);"
          "process.stdout.write(JSON.stringify(window.LM_BOARD_PLAN))")
    out = subprocess.run(["node", "-e", js, str(ROOT / "boardplans" / f"calc_{nn}.js")],
                         capture_output=True)
    if out.returncode:
        raise SystemExit(f"판서 계획 읽기 실패 calc_{nn}.js\n{out.stderr.decode('utf-8', 'replace')}")
    return json.loads(out.stdout.decode("utf-8"))


def cut(s: str, a: str, b: str) -> str:
    i = s.find(a)
    j = s.find(b, i + len(a))
    if i < 0 or j < 0:
        raise ValueError(f"표식 없음: {a} … {b}")
    return s[i:j]


def esc(t: str) -> str:
    return t.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")


def write_minutes(nn: str, minutes: dict):
    line = "  minutes: " + json.dumps(minutes, ensure_ascii=False).replace('"', "'") + ",\n"
    for p in (ROOT / "boardplans" / f"calc_{nn}.js", T / "boardplans" / f"calc_{nn}.js"):
        s = p.read_text(encoding="utf-8")
        if re.search(r"^  minutes: .*\n", s, re.M):
            s = re.sub(r"^  minutes: .*\n", line, s, count=1, flags=re.M)
        else:
            s = re.sub(r"(^  legend: .*\n)", r"\1" + line.replace("\\", "\\\\"), s, count=1, flags=re.M)
        p.write_text(s, encoding="utf-8")


def build(nn: str):
    navs = sorted(T.glob(f"교사용_Nav_미적분I_{nn}_*.html"))
    sheets = sorted(T.glob(f"교사용_학습지_미적분I_{nn}_*.html"))
    if not navs or not sheets:
        raise SystemExit(f"{nn}: Nav 또는 교사용 학습지 없음")
    nav_path, ws = navs[0], sheets[0].name
    rel = "교사용/" + nav_path.name
    src = git_main(rel)
    plan = load_plan(nn)
    pages = plan["pages"]

    A = cut(src, "    <!-- A. ", "    <!-- B. ")
    B = cut(src, "    <!-- B. ", "    <!-- C. ")
    C = cut(src, "    <!-- C. ", "    <!-- D. ")
    D = cut(src, "    <!-- D. ", "    <!-- E. ")
    E = cut(src, "    <!-- E. ", "    <!-- F. ")
    F = cut(src, "    <!-- F. ", "    <!-- G. ")
    G = cut(src, "    <!-- G. ", "    <!-- H. ")
    H = cut(src, "    <!-- H. ", "</article>")

    rows = re.findall(r"        <div class=\"tl-row\">[\s\S]*?\n        </div>\n", B)
    times = [re.search(r'<div class="tl-time">([^<]*)</div>', r).group(1) for r in rows]
    mins = [int(re.search(r"(\d+)\s*['′]", t).group(1)) if re.search(r"(\d+)\s*['′]", t) else 0 for t in times]

    # 해설 카드 — 주석 표식 단위로 자른다
    inner = E[E.index('<div class="problems">') + len('<div class="problems">'):]
    inner = inner[: inner.rindex("</div>")]
    parts = re.split(r"\n(?=\s*<!-- )", inner)
    cards = []
    for p in parts:
        m = re.match(r"\s*<!-- (.*?) -->", p)
        if not m or 'class="prob-card' not in p:
            continue
        cards.append((m.group(1), "        " + p.strip() + "\n"))

    review = any(k.startswith("practice.") for k in pages)

    def tl(*idx):
        return '    <div class="timeline">\n' + "".join(rows[i] for i in idx if i < len(rows)) + "    </div>\n"

    def board(key):
        if key not in pages:
            return ""
        return f'    <div class="nv-board" data-key="{key}" data-label="{esc(pages[key].get("label", key))}"></div>\n'

    def probs(html):
        return '    <div class="problems">\n' + html + "    </div>\n"

    def head(t, s):
        return f'    <h2 class="nv-panel-h">{t} <small>{s}</small></h2>\n'

    def tabbtn(key, label, k=None):
        kk = f'<span class="k">{k}</span>' if k else ""
        return f'        <button type="button" class="nv-tab" data-key="{key}">{kk}{label}</button>\n'

    panels, btns = [], [tabbtn("overview", "개관")]
    panels.append(f'    <!-- ===== 개관 ===== -->\n    <section class="nv-panel" data-key="overview">\n{B}{PROMISE}{LEGEND}    </section>\n')

    if not review:
        lv = [c for c in cards if re.match(r"L\d", c[0])]
        fc = [c for c in cards if c[0].startswith("형성")]
        ch = [c for c in cards if c[0].startswith("도전")]
        minutes = {"warmup": mins[0] if len(mins) > 0 else 0, "concept": mins[1] if len(mins) > 1 else 0,
                   "level": mins[2] if len(mins) > 2 else 0, "check": mins[3] if len(mins) > 3 else 0,
                   "reflect": mins[4] if len(mins) > 4 else 0}
        concept_keys = sorted([k for k in pages if k.startswith("concept.")], key=lambda k: int(k.split(".")[1]))
        level_html = ""
        cur_lv = None
        for i, (tag, html) in enumerate(lv):
            L = tag[:2]
            if L != cur_lv:
                cur_lv = L
                level_html += f'    <h2 class="section-h"><span class="ico">E</span> Level {L[1]}</h2>\n'
            level_html += probs(html) + board(f"level.{i + 1}")
        ch_html = "".join(probs(html) + board(f"challenge.{i + 1}") for i, (tag, html) in enumerate(ch))
        btns += [tabbtn("warmup", "생각 열기", 1), tabbtn("concept", "개념 구성", 2), tabbtn("level", "수준별 훈련", 3),
                 tabbtn("check", "형성평가", 4), tabbtn("challenge", "도전", 5), tabbtn("reflect", "성찰·메모", 6)]
        panels.append(f'    <!-- ===== 1 생각 열기 ===== -->\n    <section class="nv-panel" data-key="warmup">\n'
                      f'{head("1 생각 열기", times[0] if times else "")}{tl(0)}{C}{board("warmup.1")}    </section>\n')
        panels.append(f'    <!-- ===== 2 개념 구성 ===== -->\n    <section class="nv-panel" data-key="concept">\n'
                      f'{head("2 개념 구성", (times[1] if len(times) > 1 else "") + f" · 수업 화면 {len(concept_keys)}장")}{tl(1)}{D}{LEGEND}'
                      + "".join(board(k) for k in concept_keys) + "    </section>\n")
        panels.append(f'    <!-- ===== 3 수준별 훈련 ===== -->\n    <section class="nv-panel" data-key="level">\n'
                      f'{head("3 수준별 훈련", "문항마다 해설 → 판서 예시")}{tl(2, 3)}{LEGEND}{level_html}    </section>\n')
        panels.append(f'    <!-- ===== 4 형성평가 ===== -->\n    <section class="nv-panel" data-key="check">\n'
                      f'{head("4 형성평가", times[3] if len(times) > 3 else "")}{tl(3)}'
                      + "".join(probs(h) + board("check.1") for _, h in fc) + f"{F}    </section>\n")
        panels.append(f'    <!-- ===== 5 도전 ===== -->\n    <section class="nv-panel" data-key="challenge">\n'
                      f'{head("5 도전", "과제 안내 · 다음 시간 풀이")}{ch_html}    </section>\n')
        panels.append(f'    <!-- ===== 6 성찰·메모 ===== -->\n    <section class="nv-panel" data-key="reflect">\n'
                      f'{head("6 성찰·메모", times[4] if len(times) > 4 else "")}{tl(4)}{board("reflect.1")}{G}{H}    </section>\n')
    else:
        q = []
        for tag, html in cards:
            m = re.match(r"Q(\d+)", tag)
            if m:
                q.append((int(m.group(1)), html))
        q.sort()
        # 마무리 차시 타임라인은 3~5줄 — 첫 줄(도입)·끝 줄(정리)을 뺀 나머지가 실전 훈련
        last = len(rows) - 1
        minutes = {"practice": sum(mins[1:last]) if last > 1 else sum(mins), "reflect": mins[last] if last >= 0 else 0}
        q_html = "".join(probs(h) + board(f"practice.{n}") for n, h in q)
        btns += [tabbtn("practice", "실전 훈련", 1), tabbtn("reflect", "성찰·메모", 2)]
        panels.append(f'    <!-- ===== 1 실전 훈련 ===== -->\n    <section class="nv-panel" data-key="practice">\n'
                      f'{head("1 실전 훈련", f"{len(q)}문항 · 문항마다 해설 → 판서 예시")}{tl(*range(0, last))}{C}{D}{LEGEND}{q_html}{F}    </section>\n')
        panels.append(f'    <!-- ===== 2 성찰·메모 ===== -->\n    <section class="nv-panel" data-key="reflect">\n'
                      f'{head("2 성찰·메모", times[last] if last >= 0 else "")}{tl(last)}{board("reflect.1")}{G}{H}    </section>\n')

    tabs = ('    <!-- 수업 모드와 같은 탭 순서 — 인쇄할 때는 모든 탭이 차례로 나온다 -->\n'
            '    <nav class="nv-tabs no-print" aria-label="수업 단계">\n' + "".join(btns) +
            '        <button type="button" class="nv-live-btn" title="판서 예시만 크게 (태블릿·보조 화면)">수업 중 보기</button>\n'
            f'        <a class="nv-tab-open" href="{ws}?mode=class" target="aftermath_ws_calc">수업 모드로 학습지 열기 ↗</a>\n'
            '    </nav>\n\n')

    art = f'<article class="lesson" data-lm-ws="{ws}">\n\n{A}{tabs}' + "\n".join(panels) + "\n</article>"
    out = src[: src.index('<article class="lesson">')] + art + src[src.index("</article>") + len("</article>"):]
    out = out.replace("</head>", f'    <link rel="stylesheet" href="lesson-board.css?v={VER}">\n</head>', 1)
    if '<script id="aft-fit-math">' not in out:
        raise SystemExit(f"{nn}: aft-fit-math 표식 없음")
    out = out.replace('<script id="aft-fit-math">',
                      f'<script src="boardplans/calc_{nn}.js?v={VER}"></script>\n'
                      f'<script src="lesson-board.js?v={VER}"></script>\n\n<script id="aft-fit-math">', 1)
    ws_link = 'class="ws-link">학습지 보기 →</a>'
    if ws_link in out:
        out = out.replace(ws_link, ws_link + f'\n        <a href="{ws}?mode=class" target="aftermath_ws_calc" class="ws-link">수업 모드 ▶</a>')
    nav_path.write_bytes(out.replace("\n", "\r\n").encode("utf-8"))
    write_minutes(nn, minutes)
    n_boards = out.count('class="nv-board"')
    missing = [k for k in pages if f'data-key="{k}"' not in out]
    print(f"✅ {nn}: 카드 {len(cards)} · 판서 칠판 {n_boards} · 탭 시간 {minutes}" + (f" · ⚠️ 칠판 없는 계획 {missing}" if missing else ""))


if __name__ == "__main__":
    for a in sys.argv[1:]:
        build(a.zfill(2))
