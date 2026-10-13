#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""교사용 통합본 2종을 Nav 정본(교사용_Nav_*.html)에서 다시 만든다.

  1) 교사용/교사용_Solutions_All_미적분I.html   — 31차시 + 익힘책 6단원 해설 모음
       외형(head·CSS·표지·목차·하단 스크립트)은 현재 파일 그대로 두고,
       차시별 내용(차시 머리·한 줄 핵심·공식 박스·문항 해설 카드 전부)만 Nav 에서 다시 채운다.
       '다음 차시' 한 줄(next-lesson)은 Nav 에 없으므로 현재 파일의 것을 이어 쓴다.
  2) 교사용/교사용_Nav_All_묶음_미적분I.html    — Nav 37개(31차시 + 익힘책 6)를 한 파일로
       탭 바를 빼고 모든 탭 패널을 펼친다. 판서 예시 칠판은 차시마다 자기 판서 계획을 쓴다
       (boardplans/calc_NN.js 31개 → window.LM_BOARD_PLANS['NN'], lesson-board.js 가
        칠판의 가장 가까운 [data-lesson] 으로 고른다).

Nav 원본·학습지는 읽기만 한다. 실행하면 두 파일을 다시 쓰고,
이전 파일 대비 차시별 변화(카드 수 · 문항 문장/정답이 달라진 카드)를 출력한다.

사용:
  python scripts/build_teacher_bundles.py              # 두 파일 다시 쓰기 + 변화 요약
  python scripts/build_teacher_bundles.py --base main  # 변화 요약의 기준을 git main 판으로
  python scripts/build_teacher_bundles.py --dry-run    # 쓰지 않고 변화 요약만
  python scripts/build_teacher_bundles.py --check      # 쓰지 않고, 다시 만들면 두 파일이 바뀌는지만 (바뀌면 exit 1)

언제 다시 돌리나: Nav(교사용_Nav_*.html)나 boardplans 를 고친 뒤.
"""
import argparse, difflib, html, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
T = ROOT / "교사용"
SOL = T / "교사용_Solutions_All_미적분I.html"
BUNDLE = T / "교사용_Nav_All_묶음_미적분I.html"
BOARD_JS_VER = "20261013"      # lesson-board.js 를 고쳤을 때 올린다 (GitHub Pages 캐시)

# 익힘책 Nav 가 들어가는 자리: 이 차시 바로 뒤
WB_AFTER = {"04": "I1", "07": "I2", "11": "II1", "20": "II2", "25": "III1", "29": "III2"}


# ───────────────────────── 공통 도구 ─────────────────────────
def read(p: pathlib.Path) -> str:
    return p.read_text(encoding="utf-8").replace("\r\n", "\n")


def write(p: pathlib.Path, text: str, crlf: bool):
    data = text.replace("\r\n", "\n")
    if crlf:
        data = data.replace("\n", "\r\n")
    p.write_bytes(data.encode("utf-8"))


def git_show(ref: str, rel: str) -> str:
    out = subprocess.run(["git", "show", f"{ref}:{rel}"], cwd=ROOT, capture_output=True)
    if out.returncode:
        raise SystemExit(f"git show 실패: {ref}:{rel}\n{out.stderr.decode('utf-8', 'replace')}")
    return out.stdout.decode("utf-8").replace("\r\n", "\n")


def element_at(s: str, i: int, tag: str = "div") -> str:
    """s[i] 에서 시작하는 <tag …> 요소 전체 (같은 태그 짝 맞추기)."""
    d = 0
    for m in re.finditer(r"<(/?)%s\b[^>]*>" % tag, s[i:]):
        d += -1 if m.group(1) else 1
        if d == 0:
            return s[i:i + m.end()]
    raise ValueError(f"<{tag}> 짝이 맞지 않음 @{i}")


def elements(s: str, cls_re: str, tag: str = "div"):
    """class 가 cls_re 로 시작하는 <tag> 요소들 (문서 순서, 바깥 것만)."""
    out, end = [], -1
    for m in re.finditer(r'<%s class="(%s)"' % (tag, cls_re), s):
        if m.start() < end:
            continue
        el = element_at(s, m.start(), tag)
        out.append(el)
        end = m.start() + len(el)
    return out


def drop_stray_closes(s: str, tags=("div", "section")):
    """짝 없는 닫는 태그 제거 — 브라우저가 단독 파일에서 무시하던 것을 통합본에서도 무시되게."""
    stack, cut = [], []
    for m in re.finditer(r"<(/?)(%s)\b[^>]*>" % "|".join(tags), s):
        if not m.group(1):
            stack.append(m.group(2))
        elif m.group(2) in stack:
            while stack and stack[-1] != m.group(2):
                stack.pop()
            stack.pop()
        else:
            cut.append((m.start(), m.end()))
    for a, b in reversed(cut):
        s = s[:a] + s[b:]
    return s, len(cut)


def article(nav: str) -> str:
    a = nav.find("<article")
    b = nav.find("</article>", a)
    if a < 0 or b < 0:
        raise ValueError("article.lesson 없음")
    return nav[a:b + len("</article>")]


def text_of(fragment: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def nav_sources():
    """[(key, kind, path)] — 문서 순서 (01…31, 익힘책은 해당 차시 뒤)."""
    out = []
    for nn in [f"{i:02d}" for i in range(1, 32)]:
        ps = sorted(T.glob(f"교사용_Nav_미적분I_{nn}_*.html"))
        if len(ps) != 1:
            raise SystemExit(f"{nn}차시 Nav 가 {len(ps)}개 — 1개여야 함")
        out.append((nn, "lesson", ps[0]))
        if nn in WB_AFTER:
            w = WB_AFTER[nn]
            ps = sorted(T.glob(f"교사용_Nav_수학익힘책_미적분I_{w}_*.html"))
            if len(ps) != 1:
                raise SystemExit(f"익힘책 {w} Nav 가 {len(ps)}개 — 1개여야 함")
            out.append((w, "wb", ps[0]))
    return out


# ───────────────────────── CSS 합치기 ─────────────────────────
def css_rules(css: str):
    """최상위 규칙 단위로 자른다 (주석 제거, @media 블록은 통째로)."""
    css = re.sub(r"/\*[\s\S]*?\*/", "", css)
    rules, d, start, paren, quote = [], 0, 0, 0, ""
    i = 0
    while i < len(css):
        c = css[i]
        if quote:                          # 따옴표·url( ) 안의 ; { } 는 규칙 경계가 아니다
            if c == quote:
                quote = ""
        elif c in "'\"":
            quote = c
        elif c == "(":
            paren += 1
        elif c == ")":
            paren -= 1
        elif paren:
            pass
        elif c == "{":
            d += 1
        elif c == "}":
            d -= 1
            if d == 0:
                rules.append(css[start:i + 1].strip())
                start = i + 1
        elif c == ";" and d == 0:          # @import …;
            rules.append(css[start:i + 1].strip())
            start = i + 1
        i += 1
    return [r for r in rules if r]


def norm_css(r: str) -> str:
    return re.sub(r"\s+", " ", r).strip()


def head_styles(page: str) -> str:
    head = page[:page.find("</head>")]
    return "\n".join(re.findall(r"<style[^>]*>([\s\S]*?)</style>", head))


def union_nav_css(navs) -> list:
    seen, out = set(), []
    for _, _, p in navs:
        for r in css_rules(head_styles(read(p))):
            k = norm_css(r)
            if k not in seen:
                seen.add(k)
                out.append(r)
    imports = [r for r in out if r.startswith("@import")]
    return imports + [r for r in out if not r.startswith("@import")]


# ───────────────────────── 1) Solutions_All ─────────────────────────
def lesson_parts(nav_html: str):
    art = article(nav_html)
    head = element_at(art, art.find('<div class="lesson-head"'))
    big = elements(art, r"big-idea")
    formulas = elements(art, r"formula-box")
    cards = elements(art, r"prob-card[^\"]*")
    is_level = 'data-key="level"' in art
    return {"head": head, "big": big[0] if big else "", "formulas": formulas,
            "cards": cards, "is_level": is_level}


def sol_article_id(key: str, kind: str) -> str:
    return ("L" if kind == "lesson" else "W") + key


def split_old_solutions(s: str):
    first = s.find('<article class="lesson"')
    if first < 0:
        raise SystemExit("Solutions_All: <article class=\"lesson\"> 없음 — 외형을 가져올 수 없다")
    cm = s.rfind("<!-- =====", 0, first)
    # 첫 차시 앞의 '<!-- ===== 01차시 ===== -->' 주석까지는 차시 쪽 (외형에서 뺀다)
    if cm >= 0 and re.fullmatch(r"<!--[\s\S]*?-->\s*", s[cm:first]):
        shell_head = s[:cm]
    else:
        shell_head = s[:first]
    last = s.rfind("</article>") + len("</article>")
    shell_tail = s[last:]
    arts = {}
    for m in re.finditer(r'<article class="lesson" id="([^"]+)"', s):
        b = s.find("</article>", m.start())
        arts[m.group(1)] = s[m.start():b + len("</article>")]
    return shell_head, shell_tail, arts


def card_info(card: str):
    def one(cls):
        m = re.search(r'<(div|span) class="%s"' % cls, card)
        if not m:
            return ""
        return element_at(card, m.start(), m.group(1))
    return {"num": text_of(one("q-num")), "stmt": one("q-stmt"), "ans": one("q-ans")}


TEX_EQ = [(r"\\displaystyle", ""), (r"\\[dt]frac", r"\\frac"), (r"\\left|\\right", ""),
          (r"\\[,;:! ]|\\quad|\\qquad|~", ""), (r"\\leq?(?![a-z])", "≤"), (r"\\geq?(?![a-z])", "≥"),
          (r"\\lt(?![a-z])|<", "‹"), (r"\\gt(?![a-z])|>", "›"), (r"\\neq|\\ne(?![a-z])", "≠"),
          (r"\\cdot", "·"), (r"\\[()\[\]]", ""), (r"\\mathrm|\\text|\\,", ""),
          (r"\s+", ""), (r"[.。,，:：]+$", "")]


def norm_math(fragment: str) -> str:
    t = text_of(fragment)
    t = re.sub(r"^\s*정답\s*[:：]\s*", "", t)
    for a, b in TEX_EQ:
        t = re.sub(a, b, t)
    return t


def math_tokens(fragment: str):
    """수식 \\( … \\) 안쪽 + 수식 밖 숫자 — 말투를 빼고 '무엇을 묻는가' 만 남긴다."""
    raw = html.unescape(re.sub(r"<[^>]+>", " ", fragment))
    toks = re.findall(r"\\\(([\s\S]*?)\\\)", raw)
    rest = re.sub(r"\\\([\s\S]*?\\\)", " ", raw)
    toks += re.findall(r"(?<![\w①-⑳])\d+(?:\.\d+)?(?![\w])", rest)
    out = []
    for t in toks:
        for a, b in TEX_EQ:
            t = re.sub(a, b, t)
        if t:
            out.append(t)
    return out


def stmt_class(old: str, new: str):
    """same · wording(수식 같고 말만 다름) · partial · different — 유사도도 돌려준다."""
    if norm_math(old) == norm_math(new):
        return "same", 1.0
    def clean(t):   # f(x)= ↔ f=, 괄호·중괄호·\_ 차이는 같은 것으로
        t = re.sub(r"([a-zA-Z])\(([a-z])\)=", r"\1=", t)
        return re.sub(r"\\[{}_]|[{}()|]", "", t.replace("\\_", "_"))
    to, tn = [clean(t) for t in math_tokens(old)], [clean(t) for t in math_tokens(new)]
    mo, mn = "".join(to), "".join(tn)
    r = difflib.SequenceMatcher(None, mo, mn).ratio() if (mo or mn) else 0.0
    if mo == mn or r >= 0.9:
        return "wording", r
    # 이전 문장의 의미 있는 수식(5자 이상)이 새 문장에 하나도 없고 수식 유사도도 낮으면 → 다른 문항
    # (이전 문장에 수식이 거의 없으면 판단 불가 → partial)
    sig = [t for t in to if len(t) >= 5]
    hay = mn + "§" + clean(norm_math(new))
    if sig and not any(t in hay for t in sig) and r < 0.6:
        return "different", r
    return "partial", r


def answer_conflict(old: str, new: str) -> bool:
    """이전 정답의 수식·수치가 새 정답에 들어 있지 않으면 충돌 (새 쪽은 설명이 더 붙어 있다)."""
    to = math_tokens(old)
    joined = "|".join(math_tokens(new)) + "|" + norm_math(new)
    if to:
        return any(t not in joined for t in to)
    return False      # 이전 정답에 수식·수치가 없으면 (예: '증명 완료') 비교하지 않는다


def compare_cards(old_cards, new_cards):
    """번호가 같은 카드끼리, 남은 것은 순서대로 짝짓는다."""
    o = [card_info(c) for c in old_cards]
    n = [card_info(c) for c in new_cards]
    pairs, used_o, used_n = [], set(), set()
    for j, nc in enumerate(n):
        for i, oc in enumerate(o):
            if i not in used_o and oc["num"] and oc["num"] == nc["num"]:
                pairs.append((i, j)); used_o.add(i); used_n.add(j); break
    rest_o = [i for i in range(len(o)) if i not in used_o]
    rest_n = [j for j in range(len(n)) if j not in used_n]
    for i, j in zip(rest_o, rest_n):
        pairs.append((i, j)); used_o.add(i); used_n.add(j)
    pairs.sort(key=lambda p: p[1])
    stmt_any, wording, partial, major, ans_diff, renum = [], [], [], [], [], []
    for i, j in pairs:
        label = n[j]["num"] or f"#{j + 1}"
        if o[i]["num"] != n[j]["num"]:
            renum.append(f"{o[i]['num'] or '?'}→{n[j]['num'] or '?'}")
        cls, r = stmt_class(o[i]["stmt"], n[j]["stmt"])
        conflict = answer_conflict(o[i]["ans"], n[j]["ans"])
        if cls == "partial" and conflict:      # 수식도 바뀌고 정답도 다르면 다른 문항
            cls = "different"
        if cls != "same":
            stmt_any.append(label)
        if cls == "wording":
            wording.append(label)
        elif cls == "partial":
            partial.append(label)
        elif cls == "different":
            major.append(label)
        if conflict and cls != "different":    # 문장은 같은데 정답만 다른 카드
            ans_diff.append(label)
    added = [n[j]["num"] or f"#{j + 1}" for j in range(len(n)) if j not in used_n]
    removed = [o[i]["num"] or f"#{i + 1}" for i in range(len(o)) if i not in used_o]
    return {"stmt_any": stmt_any, "wording": wording, "partial": partial, "major": major, "ans": ans_diff,
            "added": added, "removed": removed, "renum": renum,
            "pairs": [(o[i], n[j]) for i, j in pairs]}


def indent(block: str, pad: str) -> str:
    return "\n".join((pad + l if l.strip() else l) for l in block.split("\n"))


def dedent_block(block: str) -> str:
    lines = block.split("\n")
    if len(lines) < 2:
        return block
    ws = [len(l) - len(l.lstrip(" ")) for l in lines[1:] if l.strip()]
    cut = min(ws) if ws else 0
    # 여는 줄은 들여쓰기가 없으니, 닫는 줄 기준으로 맞춘다
    last = lines[-1]
    cut = min(cut, len(last) - len(last.lstrip(" ")))
    return "\n".join([lines[0]] + [l[cut:] if l[:cut].strip() == "" else l.lstrip(" ") for l in lines[1:]])


def build_solutions(navs, old_text: str, base_text: str):
    shell_head, shell_tail, old_arts = split_old_solutions(old_text)
    _, _, base_arts = split_old_solutions(base_text)
    order = [(sol_article_id(k, kind), k, kind, p) for k, kind, p in navs]
    ids = [o[0] for o in order]
    parts, report, used_classes = [], [], set()
    for idx, (aid, key, kind, path) in enumerate(order):
        P = lesson_parts(read(path))
        used_classes.update(c for card in P["cards"] for c in re.findall(r'class="([^"]+)"', card))
        n = len(P["cards"])
        e_title = "문항별 해설" if (kind == "lesson" and P["is_level"]) else f"문항별 해설 ({n}문항)"
        old = old_arts.get(aid, "")
        nl = elements(old, r"next-lesson")
        prev_a = f'<a href="#{ids[idx - 1]}">← 이전</a>' if idx else "<span>← 처음</span>"
        next_a = f'<a href="#{ids[idx + 1]}">다음 →</a>' if idx + 1 < len(ids) else "<span>🏁 끝</span>"
        label = f"{key}차시" if kind == "lesson" else f"익힘책 {key}"
        body = [f"<!-- ===== {label} (원본: {path.name}) ===== -->",
                f'<article class="lesson" id="{aid}">',
                indent(dedent_block(P["head"]), "    "),
                indent(dedent_block(P["big"]), "    ") if P["big"] else ""]
        body += [indent(dedent_block(f), "    ") for f in P["formulas"]]
        body += [f'    <h2 class="section-h"><span class="ico">E</span> {e_title}</h2>',
                 '    <div class="problems">']
        body += [indent(dedent_block(c), "        ") for c in P["cards"]]
        body += ["    </div>"]
        if nl:
            body.append("    " + nl[0].strip())
        body.append(f'<nav class="sol-secnav no-print"><a href="#toc">🏠 목차</a>'
                    f'<div class="grp">{prev_a}{next_a}</div></nav>')
        body.append("</article>")
        parts.append("\n".join(x for x in body if x != ""))
        base = base_arts.get(aid, "")
        before = elements(base, r"prob-card[^\"]*")
        diff = compare_cards(before, P["cards"])
        report.append((aid, len(before), n, diff, bool(base)))

    # Nav 카드에 쓰이는데 Solutions 의 CSS 에 없는 클래스 → Nav CSS 에서 그 규칙만 가져온다
    head = re.sub(r'<style id="aft-navcard-css">[\s\S]*?</style>\n?', "", shell_head)
    sol_css = head_styles(head)
    classes = {c for cl in used_classes for c in cl.split()}
    missing = sorted(c for c in classes if not re.search(r"\.%s(?![\w-])" % re.escape(c), sol_css))
    extra = []
    if missing:
        for r in union_nav_css(navs):
            if r.startswith("@"):
                continue
            sel = r.split("{", 1)[0]
            if any(re.search(r"\.%s(?![\w-])" % re.escape(c), sel) for c in missing):
                extra.append("    " + norm_css(r))
    css_block = ('<style id="aft-navcard-css">\n    /* build_teacher_bundles.py — Nav 카드에만 있는 클래스 (Nav CSS 그대로) */\n'
                 + "\n".join(extra) + "\n</style>\n") if extra else ""
    if css_block:
        head = head.replace("</head>", css_block + "</head>", 1)
    out = head.rstrip() + "\n\n" + "\n\n".join(parts) + "\n\n" + shell_tail.lstrip("\n")
    return out, report, missing


# ───────────────────────── 2) Nav_All 묶음 ─────────────────────────
BUNDLE_CSS = r"""
<style id="aft-nav-bundle-css">
  /* 통합 묶음 화면용 — build_teacher_bundles.py */
  body { background: #f1f5f9 !important; opacity: 1 !important; }
  .aft-lesson-wrap { max-width: 952px; margin: 2rem auto; }   /* .lesson 880px + 좌우 패딩 — 개별 파일과 같은 카드 폭 */
  .aft-lesson-meta { position: sticky; top: 0; z-index: 100; background: #0d9488; color: #ecfeff;
    padding: 8px 16px; font-weight: 700; font-size: 13px; border-radius: 0 0 8px 8px; display: inline-block; margin-bottom: 1rem; }
  .aft-lesson-wrap nav.topnav { max-width: 952px; margin: 0 auto 1rem; padding: 0; }
  .aft-lesson-wrap nav.topnav span.off { font-size: .82rem; font-weight: 700; padding: .5rem .875rem; border: 1px solid #cbd5e1;
    border-radius: .5rem; color: #334155; background: white; opacity: .4; }
  /* 탭 바는 빼고, 모든 탭 패널을 펼친다 (인쇄 모드처럼) */
  .aft-lesson-wrap .nv-panel { display: block !important; }
  .aft-lesson-wrap .nv-panel + .nv-panel { margin-top: 1.75rem; padding-top: 1rem; border-top: 2px dashed #99f6e4; }
  .aft-pdf-save-bundle { position: fixed; top: 24px; right: 24px; z-index: 9999; padding: 14px 22px; border: none; border-radius: 999px;
    background: linear-gradient(135deg, #0d9488, #0f766e); color: white; font-size: 15px; font-weight: 700; cursor: pointer;
    box-shadow: 0 6px 18px rgba(13, 148, 136, 0.4); }
  .aft-pdf-save-bundle:hover { transform: translateY(-1px); filter: brightness(1.08); }
  .btoc { max-width: 952px; margin: 1.5rem auto 2.5rem; padding: 1.75rem 2rem; background: #fff; border-radius: 1rem;
    box-shadow: 0 6px 30px rgba(0,0,0,.08); position: relative; z-index: 1; }
  .btoc h1 { font-size: 1.5rem; font-weight: 900; color: #134e4a; margin-bottom: .25rem; }
  .btoc .btoc-sub { font-size: .85rem; color: #64748b; margin-bottom: 1.25rem; }
  .btoc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: .5rem; }
  .btoc-item { display: flex; align-items: center; gap: .5rem; padding: .5rem .75rem; border: 1px solid #e2e8f0; border-radius: .5rem;
    text-decoration: none; color: #1e293b; font-size: .85rem; font-weight: 600; background: #f8fafc; }
  .btoc-item:hover { border-color: #0d9488; background: #f0fdfa; }
  .btoc-item.wb { background: #fff7ed; border-color: #fed7aa; color: #9a3412; }
  .btoc-item.wb:hover { border-color: #ea580c; }
  .btoc-ic { flex-shrink: 0; }
  .aft-btoc-top { position: fixed; right: 24px; bottom: 24px; z-index: 9998; padding: 10px 16px; border: none; border-radius: 999px;
    background: #0d9488; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(13,148,136,.4); text-decoration: none; }
  .aft-btoc-top:hover { background: #0f766e; color: #fff; }
  @media print {
    @page { size: A4; margin: 14mm; }
    body { background: white !important; font-size: 10.5pt; }
    .no-print, .aft-pdf-save-bundle, .aft-btoc-top, .btoc, .aft-lesson-meta, nav { display: none !important; }
    .watermark { display: none !important; }
    .aft-lesson-wrap { page-break-before: always; break-before: page; margin: 0 !important; max-width: none; }
    .aft-lesson-wrap:first-of-type { page-break-before: auto; break-before: auto; }
    .aft-lesson-wrap .prob-card, .aft-lesson-wrap .formula-box, .aft-lesson-wrap .meta-grid,
    .aft-lesson-wrap .reflect-grid { break-inside: avoid; page-break-inside: avoid; }
  }
</style>
"""

def old_toc_labels(old_bundle: str) -> dict:
    out = {}
    for m in re.finditer(r'<a class="btoc-item[^"]*" href="#nav-([^"]+)">[\s\S]*?<span>([^<]*)</span></a>', old_bundle):
        out[m.group(1)] = m.group(2)
    return out


def build_bundle(navs, old_bundle: str):
    first = read(navs[0][2])
    head = first[:first.find("</head>")]
    pre_style = head[:head.find("<style")]
    pre_style = re.sub(r"<title>[\s\S]*?</title>",
                       "<title>[교사용] 미적분 I 수업 가이드 통합본 (31차시 + 수학 익힘책 6단원)</title>", pre_style)
    css = union_nav_css(navs)
    css_ver = re.search(r'lesson-board\.css\?v=(\d+)', first)
    css_ver = css_ver.group(1) if css_ver else BOARD_JS_VER
    plan_ver = re.search(r'boardplans/calc_\d+\.js\?v=(\d+)', first)
    plan_ver = plan_ver.group(1) if plan_ver else BOARD_JS_VER
    fit = re.search(r'<script id="aft-fit-math">[\s\S]*?</script>', first).group(0)

    labels = old_toc_labels(old_bundle)
    keys = [("nav-" + (k if kind == "lesson" else "wb-" + k), k, kind, p) for k, kind, p in navs]
    toc, sections, plans, report = [], [], [], []
    for idx, (sid, key, kind, path) in enumerate(keys):
        nav = read(path)
        art = article(nav)
        if "<script" in art:
            raise SystemExit(f"{path.name}: article 안에 <script> — 통합본에서 전역 충돌 위험 (PITFALLS E-1)")
        if re.search(r'\sid="', art):
            raise SystemExit(f"{path.name}: article 안에 id — 통합본에서 중복 위험 (PITFALLS E-2)")
        title = text_of(re.search(r'<span class="lesson-title">([\s\S]*?)</span>', art).group(1))
        short = title.split(" — ")[0]
        label = labels.get(sid[4:]) or (f"{key}차시 {short}" if kind == "lesson" else f"익힘책 {key} {short}")
        # 탭 바 제거 (패널은 CSS 로 모두 펼침)
        n_tabs = len(re.findall(r'<nav class="nv-tabs', art))
        art = re.sub(r'\n?[ \t]*<nav class="nv-tabs[\s\S]*?</nav>', "", art)
        art, stray = drop_stray_closes(art)
        boards = re.findall(r'<div class="nv-board" data-key="([^"]+)"', art)
        ws = re.search(r'data-lm-ws="([^"]+)"', art)
        ws = ws.group(1) if ws else ""
        prev_a = (f'<a href="#{keys[idx - 1][0]}">← 이전</a>' if idx else '<span class="off">← 이전</span>')
        next_a = (f'<a href="#{keys[idx + 1][0]}">다음 →</a>' if idx + 1 < len(keys) else '<span class="off">다음 →</span>')
        links = ""
        if ws:
            links = (f'\n        <a href="{ws}" target="aftermath_ws_calc" class="ws-link">학습지 보기 →</a>'
                     f'\n        <a href="{ws}?mode=class" target="aftermath_ws_calc" class="ws-link">수업 모드 ▶</a>')
        ic = "📋" if kind == "lesson" else "📗"
        toc.append(f'    <a class="btoc-item{"" if kind == "lesson" else " wb"}" href="#{sid}">'
                   f'<span class="btoc-ic">{ic}</span><span>{html.escape(label, quote=False)}</span></a>')
        sections.append(
            f'<section class="aft-lesson-wrap" id="{sid}" data-nav-no="{sid[4:]}" data-lesson="{key}">\n'
            f'  <div class="aft-lesson-meta no-print">{ic} {html.escape(label, quote=False)}</div>\n'
            f'<!-- 원본: {path.name} -->\n'
            f'<nav class="topnav no-print">\n    <a href="#toc">🏠 목차</a>\n'
            f'    <div style="display:flex;gap:.5rem;flex-wrap:wrap;">\n        {prev_a}\n        {next_a}{links}\n    </div>\n</nav>\n\n'
            f'{art}\n</section>')
        if kind == "lesson":
            plan = T / "boardplans" / f"calc_{key}.js"
            if not plan.exists():
                raise SystemExit(f"판서 계획 없음: {plan}")
            ptxt = read(plan)
            have = set(re.findall(r"'([a-z]+\.\d+)'\s*:", ptxt))
            miss = [b for b in boards if b not in have]
            plans.append(f'<script src="boardplans/calc_{key}.js?v={plan_ver}"></script>\n'
                         f"<script>(window.LM_BOARD_PLANS = window.LM_BOARD_PLANS || {{}})['{key}'] = window.LM_BOARD_PLAN;</script>")
            report.append((sid, n_tabs, len(boards), miss, stray))
        else:
            report.append((sid, n_tabs, len(boards), [], stray))

    lines = pre_style.split("\n")
    while lines and (lines[0].startswith("<!DOCTYPE") or lines[0].startswith("<!--")):
        lines.pop(0)
    out = ("<!DOCTYPE html>\n"
           "<!-- [교사용] 미적분 I 31차시 + 익힘책 6단원 Nav 통합 묶음 — 학생 비공개.\n"
           "     scripts/build_teacher_bundles.py 가 교사용_Nav_*.html 에서 만든다. 직접 고치지 말 것 (Nav 를 고치고 다시 실행). -->\n"
           + "\n".join(lines))
    out = out.rstrip() + "\n    <style>\n        " + "\n        ".join(css) + "\n    </style>\n"
    out += f'    <link rel="stylesheet" href="lesson-board.css?v={css_ver}">\n' + BUNDLE_CSS + "</head>\n"
    out += ('<body class="mathjax-process">\n\n'
            '<div class="watermark">TEACHER\'S GUIDE</div>\n'
            '<button class="aft-pdf-save-bundle no-print" onclick="window.print()">📄 전체 PDF 저장 (31차시 + 익힘책 6단원)</button>\n'
            '<a class="aft-btoc-top no-print" href="#toc">▲ 목차</a>\n\n'
            '<div class="btoc" id="toc">\n'
            '  <h1>📚 미적분 I 수업 가이드 통합본</h1>\n'
            '  <div class="btoc-sub">31차시 + 수학 익힘책 6단원 · 탭을 모두 펼친 상태 · 판서 예시 칠판 포함. 항목을 누르면 이동합니다.</div>\n'
            '  <div class="btoc-grid">\n' + "\n".join(toc) + "\n  </div>\n</div>\n\n")
    out += "\n\n".join(sections) + "\n\n"
    out += "<!-- 판서 계획: 차시마다 window.LM_BOARD_PLANS['NN'] 에 모은다 (lesson-board.js 가 [data-lesson] 으로 고름) -->\n"
    out += "\n".join(plans) + "\n"
    out += f'<script src="lesson-board.js?v={BOARD_JS_VER}"></script>\n\n'
    out += fit + "\n\n<script id=\"aft-btoc-js\">\n(function(){\n  var b=document.querySelector('.aft-btoc-top'); if(!b) return;\n" \
                 "  b.addEventListener('click',function(e){ e.preventDefault(); var t=document.getElementById('toc');\n" \
                 "    try{ t.scrollIntoView({behavior:'smooth'}); }catch(_){ t.scrollIntoView(); } });\n})();\n</script>\n</body>\n</html>\n"
    return out, report


# ───────────────────────── 실행 ─────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", help="변화 요약 기준 git ref (기본: 지금 디스크의 파일)")
    ap.add_argument("--dry-run", action="store_true", help="파일을 쓰지 않는다")
    ap.add_argument("--detail", nargs="*", default=[], metavar="ID",
                    help="이 섹션(L17 · WI1 …)의 카드별 이전/새 문장·정답을 나란히 출력")
    ap.add_argument("--check", action="store_true",
                    help="쓰지 않고, 지금 파일이 Nav 에서 다시 만든 결과와 같은지만 본다 (다르면 exit 1)")
    a = ap.parse_args()
    if a.check:
        a.dry_run = True

    navs = nav_sources()
    sol_old = read(SOL)
    sol_base = git_show(a.base, "교사용/" + SOL.name) if a.base else sol_old
    bundle_old = read(BUNDLE)
    crlf_sol = b"\r\n" in SOL.read_bytes()[:4000]
    crlf_bun = b"\r\n" in BUNDLE.read_bytes()[:4000]

    sol_new, rep, missing = build_solutions(navs, sol_old, sol_base)
    bun_new, brep = build_bundle(navs, bundle_old)

    if a.check:
        stale = [p.name for p, new, old in ((SOL, sol_new, sol_old), (BUNDLE, bun_new, bundle_old)) if new != old]
        for name in stale:
            print(f"CHECK 다시 만들어야 함: 교사용/{name} (Nav·boardplans 와 다름 — python scripts/build_teacher_bundles.py)")
        if not stale:
            print("CHECK 변화 없음: 교사용 통합본 2개가 Nav 정본과 같다")
            return 0
        # 무엇이 다른지는 아래 요약(기준: 지금 파일)으로 이어서 보여 준다

    if not a.dry_run:
        write(SOL, sol_new, crlf_sol)
        write(BUNDLE, bun_new, crlf_bun)

    print("=" * 72)
    print(f"Solutions_All — {SOL.name}  ({'쓰지 않음' if a.dry_run else '다시 씀'})")
    print(f"  기준: {'git ' + a.base if a.base else '실행 전 파일'} · Nav 에서 가져온 섹션 {len(rep)}개")
    if missing:
        print(f"  Nav CSS 에서 보충한 카드 클래스: {', '.join(missing)}")
    print("-" * 72)
    tot_old = tot_new = 0
    changed = []
    for aid, n_old, n_new, d, had in rep:
        tot_old += n_old; tot_new += n_new
        flag = []
        if not had:
            flag.append("이전 파일에 없던 섹션")
        if d["added"]:
            flag.append("추가 " + ",".join(d["added"]))
        if d["removed"]:
            flag.append("삭제 " + ",".join(d["removed"]))
        if d["renum"]:
            flag.append("번호 " + ",".join(d["renum"]))
        line = (f"  {aid:6s} 카드 {n_old:2d}→{n_new:2d} · q-stmt 달라진 카드 {len(d['stmt_any']):2d}"
                + (f" [{','.join(d['stmt_any'])}]" if d['stmt_any'] else "")
                + (f"\n           └ 문항 자체가 다름 [{','.join(d['major'])}]" if d['major'] else "")
                + (f"\n           └ 일부 다름 [{','.join(d['partial'])}]" if d['partial'] else "")
                + (f"\n           └ 말투만 다름(수식 같음) {len(d['wording'])}개" if d['wording'] else "")
                + (f"\n           └ 문장은 같은데 정답 표기 다름 [{','.join(d['ans'])}]" if d['ans'] else "")
                + ("\n           └ " + " · ".join(flag) if flag else ""))
        print(line)
        if d["stmt_any"] or d["ans"] or flag or n_old != n_new:
            changed.append(aid)
        if aid in a.detail:
            for oc, nc in d["pairs"]:
                cls, r = stmt_class(oc["stmt"], nc["stmt"])
                same_s = cls == "same"
                same_a = not answer_conflict(oc["ans"], nc["ans"])
                print(f"      [{oc['num']}→{nc['num']}] 문장 {cls}({r:.2f}) · 정답 {'일치' if same_a else '불일치'}")
                if not same_s:
                    print("        이전: " + text_of(oc["stmt"])[:160])
                    print("        새  : " + text_of(nc["stmt"])[:160])
                if not same_a:
                    print("        이전 정답: " + text_of(oc["ans"])[:120])
                    print("        새 정답  : " + text_of(nc["ans"])[:120])
    print("-" * 72)
    print(f"  카드 합계 {tot_old} → {tot_new} · 변화 있는 섹션 {len(changed)}개: {', '.join(changed) or '없음'}")
    print("  (비교: 태그·공백·\\displaystyle·\\dfrac/\\frac 등 표기 차이는 지운 뒤.")
    print("   '문항 자체가 다름' = 이전 문장의 핵심 수식이 새 문장에 없고 유사도 0.6 미만, 또는 수식이 바뀌고 정답도 다름.")
    print("   '일부 다름' = 수식 일부가 다르지만 정답은 같음(압축 요약·조건 보강 등). --detail L17 처럼 주면 카드별 원문을 나란히 보여 준다)")

    print("=" * 72)
    print(f"Nav_All 묶음 — {BUNDLE.name}  ({'쓰지 않음' if a.dry_run else '다시 씀'})")
    nb = 0
    for sid, n_tabs, n_boards, miss, stray in brep:
        nb += n_boards
        extra = []
        if miss:
            extra.append("판서 계획 없는 칠판 " + ",".join(miss))
        if stray:
            extra.append(f"짝 없는 닫는 태그 {stray}개 제거 (원본 Nav 결함)")
        print(f"  {sid:12s} 탭 바 {n_tabs} 제거 · 칠판 {n_boards:2d}" + (" · " + " · ".join(extra) if extra else ""))
    print(f"  섹션 {len(brep)}개 · 칠판 {nb}개 · 판서 계획 {sum(1 for _, k, _ in navs if k == 'lesson')}개 로드")
    print(f"  크기 {len(bundle_old):,} → {len(bun_new):,} 자")
    if a.check:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
