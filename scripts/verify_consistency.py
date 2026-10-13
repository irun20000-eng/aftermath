#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""같은 문항이 학생용·교사용·Nav·판서·묶음 중 일부에서만 다르게 남는 오류 검사 (미적분 I 01~31차시)

검사
  1) 학생용 ↔ 교사용 학습지 : 문항(배지·문장·출처)·힌트, 그리고 문항 밖 본문이 같은지 (링크 주소 차이는 제외) — 실패
  2) 학습지 문항 ↔ Nav 카드 : 문항 번호로 짝짓고 학습지 문장의 수식 \\( \\) 이 Nav q-stmt 에 있는지 — 실패
       · 부등호(<, >, ≤, ≥, ≠)는 같은 두 변을 잇는 기호가 다르면 실패 (Nav 에만 있는 부등식도 실패)
       · 적분·극한·합 첨자(∫_a^b, lim_{x→a})는 같은 종류끼리 따로 비교
       · Nav 가 수식을 말로 바꾼 정상 사례는 scripts/consistency_allow.json 에 (차시, 문항, 검사, 이유) 로 허용
       · 학습지 문항 배지(기초·기본·도전) ↔ Nav 카드 lvl 표시가 다르면 실패
  3) 정답 : Nav q-ans 의 핵심 값(수식·숫자)이 학습지 힌트/풀이와 판서 계획('b:' 결과 줄)에 나오는지 — 경고 (휴리스틱)
  4) 묶음 최신 여부 : 학습지_전체_묶음_미적분I.html 에 각 학습지 문항 블록이 그대로 있는지 — 실패
                     교사용 통합본 2개는 build_teacher_bundles.py --check 로 '변화 없음'인지 — 실패
  5) 출처 표기 lint : 'P.?' 금지 · 출처의 기초/기본/도전 ↔ 배지 · 배지 글머리(기초-/기본-/심화-) ↔ 배지 색 — 실패
                     출처 어휘가 '변형'·'자체 출제'·'참고' 외의 말(유형·응용·연계 …)을 쓰면 목록 — 경고

사용:
  python scripts/verify_consistency.py                 # 전체
  python scripts/verify_consistency.py --only 1,2,5    # 일부 검사만
  python scripts/verify_consistency.py --lesson 14 20  # 일부 차시만 (4번 교사용 통합본 검사는 건너뜀)
  python scripts/verify_consistency.py --quiet         # 경고 목록 생략 (개수만)
실패가 하나라도 있으면 exit 1. 표준 라이브러리만 쓴다.
"""
import argparse, collections, html, json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
T = ROOT / "교사용"
BUNDLE = ROOT / "학습지_전체_묶음_미적분I.html"
ALLOW = ROOT / "scripts" / "consistency_allow.json"
LESSONS = [f"{i:02d}" for i in range(1, 32)]

# verify_lesson_mode.py · lesson-mode.js 와 같은 탭 규칙 (제목 → 화면 키)
RULES = [
    (re.compile(r"성찰"), "reflect"),
    (re.compile(r"생각\s*열기"), "warmup"),
    (re.compile(r"개념\s*구성"), "concept"),
    (re.compile(r"수준별"), "level"),
    (re.compile(r"형성평가"), "check"),
    (re.compile(r"도전\s*문제"), "challenge"),
    (re.compile(r"실전"), "practice"),
]
PROBLEM_TABS = {"level", "check", "challenge", "practice"}
BADGE_LV = {"l1": "기초", "l2": "기본", "l3": "도전", "hard": "도전"}
NAV_LV = {"lvl-l1": "기초", "lvl-l2": "기본", "lvl-l3": "도전"}
SOURCE_RE = re.compile(r'<span class="text-base font-normal[^"]*">([\s\S]*?)</span>')
SOURCE_VOCAB_OK = ("변형", "자체 출제", "참고")
SOURCE_VOCAB_OTHER = ("유형", "응용", "연계", "통합", "일반화", "보강", "패턴", "기반", "미리보기", "확장",
                      "자체 정리", "추가", "재구성", "각색", "발췌", "수정", "개작", "유사")

fails, warns, notes = [], [], []
used_allow = set()
counts = collections.Counter()


def fail(check, where, msg):
    fails.append((check, where, msg))
    counts[f"fail{check}"] += 1


def warn(check, where, msg):
    warns.append((check, where, msg))
    counts[f"warn{check}"] += 1


# ───────────────────────── 공통 도구 ─────────────────────────
def read(p: pathlib.Path) -> str:
    return p.read_text(encoding="utf-8").replace("\r\n", "\n")


TAG = r"<(?=[a-zA-Z/!])(?:[^>\"']|\"[^\"]*\"|'[^']*')*>"   # 진짜 태그만 (수식 속 맨 '<' 는 남기고, 속성 안 '>' 는 건너뜀)


def strip_tags(s: str) -> str:
    return html.unescape(re.sub(TAG, " ", s))


def squash(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def element_at(s: str, i: int, tag: str = "div") -> str:
    d = 0
    for m in re.finditer(r"<(/?)%s\b[^>]*>" % tag, s[i:]):
        d += -1 if m.group(1) else 1
        if d == 0:
            return s[i:i + m.end()]
    return s[i:]


def unwrap_cmd(t: str, cmd: str) -> str:
    """\\text{…} → … (중괄호 짝 맞춤)"""
    out, i = [], 0
    key = "\\" + cmd + "{"
    while True:
        j = t.find(key, i)
        if j < 0:
            out.append(t[i:])
            return "".join(out)
        out.append(t[i:j])
        k, d = j + len(key), 1
        while k < len(t) and d:
            d += {"{": 1, "}": -1}.get(t[k], 0)
            k += 1
        out.append(t[j + len(key):k - 1])
        i = k


TEX_SUBS = [
    (r"\\(display|text|script)style", ""), (r"\\[dt]frac", r"\\frac"),
    (r"\\left(?![a-zA-Z])|\\right(?![a-zA-Z])|\\[bB]igg?[lr]?(?![a-zA-Z])", ""),
    (r"\\boxed\{\\phantom\{[^{}]*\}\}|\\square|□", "?"),
    (r"\\[,;:! ]|\\quad|\\qquad|~", ""),
    (r"\\leqq|\\leqslant|\\leq|\\le(?![a-zA-Z])|≦", "≤"), (r"\\geqq|\\geqslant|\\geq|\\ge(?![a-zA-Z])|≧", "≥"),
    (r"\\lt(?![a-zA-Z])|<", "‹"), (r"\\gt(?![a-zA-Z])|>", "›"), (r"\\neq|\\ne(?![a-zA-Z])", "≠"),
    (r"\\to(?![a-zA-Z])|\\rightarrow(?![a-zA-Z])|\\longrightarrow", "→"),
    (r"\\cdot(?![a-zA-Z])|⋅", "·"), (r"−", "-"), (r"\\mid", "|"), (r"\\vert", "|"),
    (r"\s+", ""),
]


def norm_tex(t: str) -> str:
    t = html.unescape(t)
    for c in ("text", "mathrm", "textrm", "mbox", "operatorname", "mathbf", "boldsymbol", "bm"):
        t = unwrap_cmd(t, c)
    t = re.sub(r"\\(?:text|mathrm)\s+(?=[A-Za-z])", "", t)          # \text P → P
    for a, b in TEX_SUBS:
        t = re.sub(a, b, t)
    t = re.sub(r"([_^])\{([^{}\\])\}", r"\1\2", t)            # x^{2} → x^2
    t = re.sub(r"\\frac(\d)(\d)", r"\\frac{\1}{\2}", t)        # \frac12 → \frac{1}{2}
    t = re.sub(r"\\frac\{([^{}])\}\{([^{}])\}", r"\\frac{\1}{\2}", t)
    t = re.sub(r"[.。,，:：]+$", "", t)
    return t


def loose(t: str) -> str:
    """Nav 의 흔한 줄임을 무시한 비교용: f(x) → f, 앞의 'f(x)=' · 'y=', \\lim 의 아래첨자, 중괄호
    (부등호·적분 첫자는 따로 엄격하게 비교한다)"""
    t = re.sub(r"(?<=[\d)A-Z])(m/s\^2|m/s|cm\^[23]|cm|km/h|km|m|L|s)$", "", t)   # 단위
    cmds = []

    def keep(m):
        cmds.append(m.group(0))
        return chr(0xE000 + len(cmds) - 1)
    t = re.sub(r"\\[a-zA-Z]+", keep, t)                       # 명령어 보호 (\lim 의 m 뒤 f(x) 등)
    t = re.sub(r"([a-zA-Z])\(([a-z])\)", r"\1", t)          # f(x) → f
    t = re.sub(r"[\uE000-\uF8FF]", lambda m: cmds[ord(m.group(0)) - 0xE000], t)
    t = re.sub(r"\\lim_(\{[^{}]*\}|.)", r"\\lim", t)
    t = re.sub(r"(?<![a-zA-Z])[a-z]\\in", "", t)              # x\in[-2,4] → [-2,4]
    t = re.sub(r"^[a-zA-Z]=", "", t)
    t = t.replace("·", "").replace("\\{", "(").replace("\\}", ")")
    t = t.replace("{", "").replace("}", "")
    t = re.sub(r"d[xtu](?=$|[=+\-)\]§,])", "", t)                    # ∫… dx ↔ ∫…
    t = re.sub(r"(?<=[\d)A-Z])(m/s\^2|m/s|cm\^[23]|cm|km/h|km|m|L|s)$", "", t)   # 단위
    if re.fullmatch(r"\([^,()]*\)", t):                                  # (0≤t≤4) ↔ 0≤t≤4
        t = t[1:-1]
    return t


def trivial(t: str) -> bool:
    """변수 이름·함수 이름 목록처럼 Nav 가 흔히 생략하는 수식 (f(x), a,b, y=f(x), x_1,x_2 …)"""
    if re.fullmatch(r"[a-zA-Z]=[a-zA-Z](\([a-z]\))?", t):
        return True
    if re.fullmatch(r"\(?t≥0\)?|t\(t≥0\)", t):                # 시각의 범위 t ≥ 0 (Nav 가 거의 항상 생략)
        return True
    if re.fullmatch(r"[\[(][^,]+,[^,]+[\])]", t):        # 숫자 구간·좌표는 의미 있음, (x,y)·(a,b) 같은 글자뿐인 것은 아님
        return not re.search(r"\d|\\infty", t)
    t2 = re.sub(r"_\d", "", t)
    return not re.search(r"[=+\-^‹›≤≥≠/|]|\\(frac|lim|int|sum|sqrt|infty)|\d", t2)


def split_cases(t: str):
    """\\begin{cases} a & (조건) \\\\ b & (조건) \\end{cases} → 줄·칸 단위 조각 (앞의 'f(x)=' 는 따로)"""
    m = re.search(r"\\begin\{cases\}([\s\S]*?)\\end\{cases\}", t)
    if not m:
        return [t]
    head = t[:m.start()].strip()
    tail = t[m.end():].strip()
    out = [head] if head and not re.fullmatch(r"[a-zA-Z]\(x\)\s*=", head) else []
    for row in re.split(r"\\\\", m.group(1)):
        cells = [c for c in row.split("&") if c.strip()]
        # '(x = 1)' 같은 한 점 조건칸은 Nav 가 f(1)=… 로 쓰는 일이 많아 뺄다 (부등식 조건은 남김)
        out += [c for c in cells if not re.fullmatch(r"\s*\(?\s*[a-z]\s*=\s*[^=<>]+?\)?\s*", c)]
    if tail:
        out += split_cases(tail)
    return out


MATH_RE = re.compile(r"\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$")


def math_spans(fragment_html: str):
    """HTML 조각의 \\( … \\) · \\[ … \\] 수식 원문 목록 (태그 제거 후). 별집합수식은 \\quad · 쉼표로 나눔"""
    raw = strip_tags(fragment_html)
    out = []
    for m in MATH_RE.finditer(raw):
        if m.group(1) is not None:
            out.append(m.group(1))
        else:
            out += [x for x in re.split(r"\\q?quad", m.group(2) or m.group(3) or "") if x.strip()]
    return out


def plain_text_norm(fragment_html: str) -> str:
    """수식 구분자를 떼고 전체를 정규화 — '\\(18\\) cm' ↔ '18cm' 같은 경우용"""
    raw = strip_tags(fragment_html)
    raw = re.sub(r"\\[()\[\]]", " ", raw)
    return norm_tex(raw)


def plain_numbers(fragment_html: str):
    raw = strip_tags(fragment_html)
    rest = MATH_RE.sub(" ", raw)
    return re.findall(r"(?<![\w.])-?\d+(?:\.\d+)?(?![\w.])", rest)


# ── 부등호 · 첨자 ──
INEQ = "≤≥‹›≠"
FLIP = {"≤": "≥", "≥": "≤", "‹": "›", "›": "‹", "≠": "≠"}


SEP = r"=|,|;|:|\\Rightarrow|\\Leftrightarrow|\\iff|\\quad|이고|또는"


def _trim_left(s: str) -> str:
    s = re.split(SEP, s)[-1]
    d = 0
    for i in range(len(s) - 1, -1, -1):       # 짝 없는 여는 괄호 뒤만
        d += {")": 1, "]": 1, "(": -1, "[": -1}.get(s[i], 0)
        if d < 0:
            return s[i + 1:]
    return s


def _trim_right(s: str) -> str:
    s = re.split(SEP, s)[0]
    d = 0
    for i, ch in enumerate(s):                 # 짝 없는 닫는 괄호 앞까지만
        d += {"(": 1, "[": 1, ")": -1, "]": -1}.get(ch, 0)
        if d < 0:
            return s[:i]
    return s


def ineq_atoms(tok: str):
    parts = re.split(r"([%s])" % INEQ, tok)
    out = []
    for i in range(1, len(parts) - 1, 2):
        left, right = _trim_left(parts[i - 1]), _trim_right(parts[i + 1])
        if left or right:
            out.append((left, parts[i], right))
    return out


def read_group(t: str, i: int):
    """t[i] 에서 시작하는 TeX 인자 하나 ({…} 또는 \\cmd 또는 한 글자) → (내용, 다음 위치)"""
    if i >= len(t):
        return "", i
    if t[i] == "{":
        d, k = 0, i
        while k < len(t):
            d += {"{": 1, "}": -1}.get(t[k], 0)
            k += 1
            if d == 0:
                break
        return t[i + 1:k - 1], k
    if t[i] == "\\":
        m = re.match(r"\\[a-zA-Z]+", t[i:])
        if m:
            return m.group(0), i + m.end()
    return t[i], i + 1


def bounds(tok: str):
    out = []
    for m in re.finditer(r"\\(int|lim|sum)(?![a-zA-Z])", tok):
        i = m.end()
        sub = sup = ""
        for _ in range(2):
            if i < len(tok) and tok[i] in "_^":
                g, j = read_group(tok, i + 1)
                if tok[i] == "_":
                    sub = g
                else:
                    sup = g
                i = j
        if sub or sup:
            out.append((m.group(1), f"{m.group(1)}[{sub}|{sup}]"))
    return out


# ───────────────────────── 학습지 파싱 ─────────────────────────
class Problem:
    def __init__(self, num, tab, idx, block, badge_cls, badge_txt, stmt_html, hint_html, source):
        self.num, self.tab, self.idx = num, tab, idx
        self.block, self.badge_cls, self.badge_txt = block, badge_cls, badge_txt
        self.stmt_html, self.hint_html, self.source = stmt_html, hint_html, source

    @property
    def key(self):
        return f"{self.tab}.{self.idx}"


def section_title(sec: str) -> str:
    m = re.search(r"<h2[^>]*>([\s\S]*?)</h2>", sec)
    return squash(strip_tags(m.group(1))) if m else ""


def sections(page: str):
    out = []
    for m in re.finditer(r"<section class=\"card[\s\S]*?</section>", page):
        sec = m.group(0)
        title = section_title(sec)
        tab = next((k for r, k in RULES if r.search(title)), None)
        out.append((tab, title, sec, m.start()))
    return out


def split_details(block: str):
    """(details 앞 문장 부분, details 안 내용 전부)"""
    i = block.find("<details")
    if i < 0:
        return block, ""
    hints = []
    for m in re.finditer(r"<details", block):
        hints.append(element_at(block, m.start(), "details"))
    return block[:i], "\n".join(hints)


def last_details_end(block: str) -> int:
    end = 0
    for m in re.finditer(r"<details", block):
        end = m.start() + len(element_at(block, m.start(), "details"))
    return end


def problem_from(tab, idx, block, num_hint=None):
    bm = re.search(r'<span class="badge badge-([\w-]+)">([\s\S]*?)</span>', block)
    badge_cls = bm.group(1) if bm else ""
    badge_txt = squash(strip_tags(bm.group(2))) if bm else ""
    stmt, hint = split_details(block[bm.end():] if bm else block)
    src = SOURCE_RE.search(stmt)
    source = squash(strip_tags(src.group(1))) if src else ""
    stmt_wo_src = SOURCE_RE.sub(" ", stmt)
    text = squash(strip_tags(stmt_wo_src))
    nm = re.match(r"(\d+)\s*[.．]", text)
    num = nm.group(1) if nm else (num_hint or "")
    return Problem(num, tab, idx, block, badge_cls, badge_txt, stmt_wo_src, hint, source)


STMT_START = re.compile(r'<div class="text-(?:xl|2xl|lg)[^"]*font-bold[^"]*">\s*(\d+)\s*[.．]')


def sheet_problems(page: str):
    probs, counter = [], collections.Counter()
    ch = 0
    for tab, title, sec, _ in sections(page):
        if tab not in PROBLEM_TABS:
            continue
        sec = re.sub(r"<!--[\s\S]*?-->", "", sec)
        if tab == "challenge":
            ch += 1
            # 출처·난이도 상자는 문장에서 뺀다
            body = sec.split("</h2>", 1)[1] if "</h2>" in sec else sec
            box = re.search(r'<div class="bg-purple-50[^"]*"|<div class="bg-amber-50[^"]*"', body)
            if box and "출처" in element_at(body, box.start())[:400]:
                el = element_at(body, box.start())
                body = body.replace(el, " ", 1)
            body = re.sub(r'<div class="mt-4 text-sm text-slate-500 italic">[\s\S]*?</div>', " ", body)
            counter[tab] += 1
            probs.append(problem_from(tab, counter[tab], body, num_hint=f"D{ch}"))
            probs[-1].num = f"D{ch}"
            probs[-1].block = sec
            continue
        badges = [m.start() for m in re.finditer(r'<span class="badge ', sec)]
        if tab in ("level", "practice") and badges:
            for k, a in enumerate(badges):
                b = badges[k + 1] if k + 1 < len(badges) else len(sec)
                chunk = sec[a:b]
                # 배지 + 문장 div + 바로 뒤 details 들만 (다음 Level 머리말·띠 등은 버린다)
                h = re.search(r"<h3\b", chunk)
                if h:
                    chunk = chunk[:h.start()]
                sm = re.search(r'<div class="text-', chunk)
                if sm:
                    end = sm.start() + len(element_at(chunk, sm.start()))
                    for dm in re.finditer(r"<details", chunk[end:]):
                        gap = chunk[end:end + dm.start()]
                        if re.search(r"<(?!/?div\b|br\b)[a-zA-Z]", gap) and "thinking-space" not in gap:
                            break
                        end += dm.start() + len(element_at(chunk, end + dm.start(), "details"))
                    chunk = chunk[:end]
                else:
                    e = last_details_end(chunk)
                    if e:
                        chunk = chunk[:e]
                counter[tab] += 1
                probs.append(problem_from(tab, counter[tab], chunk))
        else:
            starts = [m.start() for m in STMT_START.finditer(sec)]
            if not starts:
                continue
            counter[tab] += 1                     # 형성평가는 화면 1개 (check.1)
            for k, a in enumerate(starts):
                b = starts[k + 1] if k + 1 < len(starts) else len(sec)
                chunk = sec[a:b]
                e = last_details_end(chunk)
                if e:
                    chunk = chunk[:e]
                else:
                    chunk = element_at(sec, a)
                probs.append(problem_from(tab, counter[tab], chunk))
    return probs


def non_problem_text(page: str):
    """문항 탭이 아닌 카드(생각 열기·개념·성찰 …) 본문 — 링크 주소는 지움"""
    out = []
    for tab, title, sec, _ in sections(page):
        if tab in PROBLEM_TABS:
            continue
        out.append((title, squash(re.sub(r'\s(href|src|data-picker-src)="[^"]*"', "", sec))))
    return out


def lesson_files(nn: str):
    s = sorted(ROOT.glob(f"학습지_미적분I_{nn}_*.html"))
    t = sorted(T.glob(f"교사용_학습지_미적분I_{nn}_*.html"))
    n = sorted(T.glob(f"교사용_Nav_미적분I_{nn}_*.html"))
    return (s[0] if s else None), (t[0] if t else None), (n[0] if n else None)


# ───────────────────────── Nav 파싱 ─────────────────────────
def nav_cards(nav: str):
    a = nav.find("<article")
    b = nav.rfind("</article>")
    art = nav[a:b] if a >= 0 and b > a else nav
    cards, end = [], -1
    for m in re.finditer(r'<div class="prob-card[^"]*"', art):
        if m.start() < end:
            continue
        el = element_at(art, m.start())
        end = m.start() + len(el)

        def one(cls):
            mm = re.search(r'<(div|span) class="%s"' % cls, el)
            return element_at(el, mm.start(), mm.group(1)) if mm else ""
        num = squash(strip_tags(one("q-num")))
        lv = re.search(r'<span class="lvl (lvl-[\w]+)"', el)
        board = re.search(r'<div class="nv-board" data-key="([^"]+)"', art[end:])
        cards.append({"num": num, "stmt": one("q-stmt"), "ans": one("q-ans"), "solve": one("q-solve"),
                      "lvl": lv.group(1) if lv else "", "board": board.group(1) if board else ""})
    return cards


# ───────────────────────── 판서 계획 ─────────────────────────
def js_unescape(s: str) -> str:
    return re.sub(r"\\(.)", lambda m: {"n": "\n", "t": "\t"}.get(m.group(1), m.group(1)), s)


def board_pages(nn: str):
    p = ROOT / "boardplans" / f"calc_{nn}.js"
    if not p.exists():
        return {}
    txt = read(p)
    keys = list(re.finditer(r"'([a-z]+\.\d+)'\s*:\s*\{", txt))
    pages = {}
    for k, m in enumerate(keys):
        block = txt[m.end(): keys[k + 1].start() if k + 1 < len(keys) else len(txt)]
        lits = [js_unescape(x) for x in re.findall(r"'((?:[^'\\]|\\.)*)'", block)]
        blines = [l[2:] for l in lits if l.startswith("b:")]
        blines += [x for l in lits for x in re.findall(r"\[\[b:([\s\S]*?)\]\]", l)]
        pages[m.group(1)] = {"b": blines, "all": lits}
    return pages


def board_hay(lines):
    """판서 줄들 → 정규화 문자열 (수식 안팎 모두)"""
    out = []
    for l in lines:
        spans = re.findall(r"\\\(([\s\S]*?)\\\)", l)
        rest = re.sub(r"\\\([\s\S]*?\\\)", " ", l)
        out += [norm_tex(x) for x in spans] + [norm_tex(rest)]
    return "§".join(out)


# ───────────────────────── 허용 목록 ─────────────────────────
def load_allow():
    if not ALLOW.exists():
        return {}
    data = json.loads(ALLOW.read_text(encoding="utf-8"))
    out = {}
    for it in data.get("allow", []):
        if not it.get("reason"):
            raise SystemExit(f"consistency_allow.json: 이유 없는 항목 {it}")
        for c in it.get("checks", ["tokens"]):
            out[(it["lesson"], str(it["q"]), c)] = it["reason"]
    return out


# ───────────────────────── 검사 1 ─────────────────────────
def check1(nn, sp, tp):
    ss, ts = read(sp), read(tp)
    a, b = sheet_problems(ss), sheet_problems(ts)
    if len(a) != len(b):
        fail(1, f"{nn}차시", f"문항 수 다름 — 학생용 {len(a)} · 교사용 {len(b)}")
    for pa, pb in zip(a, b):
        w = f"{nn}차시 {pa.num or pa.key}번"
        if pa.num != pb.num:
            fail(1, w, f"문항 번호 다름 — 학생용 {pa.num} · 교사용 {pb.num}")
        for label, xa, xb in (("배지", pa.badge_cls + "|" + pa.badge_txt, pb.badge_cls + "|" + pb.badge_txt),
                              ("출처", pa.source, pb.source),
                              ("문장", squash(strip_tags(pa.stmt_html)), squash(strip_tags(pb.stmt_html))),
                              ("힌트/풀이", squash(strip_tags(pa.hint_html)), squash(strip_tags(pb.hint_html)))):
            if xa != xb:
                fail(1, w, f"{label} 다름\n      학생용: {diff_snip(xa, xb)}\n      교사용: {diff_snip(xb, xa)}")
    na, nb = non_problem_text(ss), non_problem_text(ts)
    for (ta, xa), (tb, xb) in zip(na, nb):
        if xa != xb:
            fail(1, f"{nn}차시 「{ta}」", f"문항 밖 본문 다름\n      학생용: {diff_snip(xa, xb)}\n      교사용: {diff_snip(xb, xa)}")
    if len(na) != len(nb):
        fail(1, f"{nn}차시", f"카드 수 다름 — 학생용 {len(na)} · 교사용 {len(nb)}")
    return a


def diff_snip(x: str, y: str, w: int = 70) -> str:
    """x 에서 y 와 처음 달라지는 곳 앞뒤"""
    i = 0
    while i < min(len(x), len(y)) and x[i] == y[i]:
        i += 1
    return ("…" if i > 25 else "") + x[max(0, i - 25): i + w] + ("…" if i + w < len(x) else "")


# ───────────────────────── 검사 2 ─────────────────────────
def drop_choices(s: str) -> str:
    """선택지 ①~⑤ 뒤의 수식은 비교에서 뺀다 (Nav 는 선택지를 줄이거나 빼는 일이 많다)"""
    return re.sub(r"[①②③④⑤]\s*(?:<[^>]*>\s*)*\\\([\s\S]*?\\\)", " ", s)


def check2(nn, probs, cards, allow):
    by_num = {c["num"]: c for c in cards}
    seen = set()
    for p in probs:
        w = f"{nn}차시 {p.num}번"
        c = by_num.get(p.num)
        if not c:
            fail(2, w, "Nav 에 같은 번호 카드 없음")
            continue
        seen.add(p.num)
        # 배지 ↔ Nav lvl
        blv, nlv = BADGE_LV.get(p.badge_cls), NAV_LV.get(c["lvl"])
        if blv and nlv and blv != nlv:
            fail(2, w, f"난이도 표시 다름 — 학습지 배지 {p.badge_cls}({blv}) · Nav {c['lvl']}({nlv})")
        # 수식 대조 (선택지 ①~⑤ 의 수식은 빼고)
        stmt = re.sub(r"<img\b(?:[^>\"']|\"[^\"]*\"|'[^']*')*>", " ", drop_choices(p.stmt_html))
        nstmt = drop_choices(c["stmt"])
        w_toks = [norm_tex(x) for t in math_spans(stmt) for x in split_cases(t)]
        w_toks = [t for t in w_toks if len(t) > 1 and not trivial(t)]
        n_toks = [norm_tex(x) for t in math_spans(nstmt) for x in split_cases(t)]
        hay = "§".join(n_toks) + "§" + plain_text_norm(c["stmt"])
        lhay = loose(hay)
        ntext = strip_tags(c["stmt"])
        missing = [t for t in dict.fromkeys(w_toks) if t not in hay and loose(t) not in lhay
                   and not (t == "(-\\infty,\\infty)" and re.search(r"실수\s*전체|모든\s*실수", ntext))]
        # 부등호 (엄격)
        w_at = [a for t in w_toks for a in ineq_atoms(t)]
        n_at = [a for t in n_toks for a in ineq_atoms(t)]
        strict = []

        def find(at, pool):
            """같은 두 변을 잇는 부등식: 같은 기호가 하나라도 있으면 그 기호, 없으면 처음 찾은 다른 기호"""
            L, op, R = at
            found = []
            for (l2, o2, r2) in pool:
                if loose(l2) == loose(L) and loose(r2) == loose(R):
                    found.append(o2)
                elif loose(l2) == loose(R) and loose(r2) == loose(L):
                    found.append(FLIP[o2])
            if op in found:
                return op
            return found[0] if found else None
        for at in n_at:
            if (at[0], at[1], at[2]) in (("t", "≥", "0"), ("0", "≤", "t")):       # 시각 범위는 더해 적어도 됨
                continue
            o = find(at, w_at)
            if o is None:
                strict.append(f"Nav 에만 있는 부등식 {at[0]}{at[1]}{at[2]}")
            elif o != at[1]:
                strict.append(f"부등호 다름 — 학습지 {at[0]}{o}{at[2]} · Nav {at[0]}{at[1]}{at[2]}")
        # 첨자 (엄격)
        wb = collections.Counter(b for t in w_toks for _, b in bounds(t))
        nb_ = collections.Counter(b for t in n_toks for _, b in bounds(t))
        for b in nb_:                      # 학습지 첨자가 Nav 에 없는 것은 위 '수식 없음' 으로 잡힌다
            if b not in wb:
                strict.append(f"Nav 첨자 {b} 가 학습지 문장에 없음 (학습지: {', '.join(sorted(wb)) or '없음'})")
        key = (nn, p.num)
        if missing:
            if (nn, p.num, "tokens") in allow:
                counts["allowed2"] += 1
                used_allow.add((nn, p.num, "tokens"))
            else:
                fail(2, w, "학습지 수식이 Nav q-stmt 에 없음: " + " · ".join(missing[:6])
                     + (f" 외 {len(missing) - 6}개" if len(missing) > 6 else "")
                     + f"\n      Nav q-stmt: {squash(strip_tags(c['stmt']))[:160]}")
        if strict:
            if (nn, p.num, "strict") in allow:
                counts["allowed2"] += 1
                used_allow.add((nn, p.num, "strict"))
            else:
                fail(2, w, "부등호/첨자: " + " · ".join(strict[:4]))
    for c in cards:
        if c["num"] not in seen and c["num"] not in {p.num for p in probs}:
            fail(2, f"{nn}차시 {c['num']}번", "학습지에 같은 번호 문항 없음 (Nav 에만 있는 카드)")


# ───────────────────────── 검사 3 ─────────────────────────
ANS_CUT = re.compile(r"(핵심|판서\s*포인트|함정|의미|해석|서술\s*채점|채점|참고|주의|비교|포인트|연결|확장|이유|근거|검산|오개념)\s*[:：]")


def answer_values(ans_html: str):
    """Nav q-ans 의 '정답:' 뒤 핵심 값들 (설명 문장·(1)(2) 번호·'a=' 같은 이름은 뾍는다)"""
    t = strip_tags(ans_html)
    t = re.sub(r"^[\s\S]*?정답\s*[:：]", "", t, count=1)
    t = ANS_CUT.split(t)[0]
    t = re.split(r"(?<!\d)\.\s|。", t)[0]                      # 첫 문장까지만
    t = re.sub(r"(?<![\w')])\(\s*\d\s*\)(?=\s|\\\(|$)", " ", t)    # (1) (2) 번호
    vals = []
    for x in re.findall(r"\\\(([\s\S]*?)\\\)", t):
        vals += re.split(r",(?![^()\[\]{}]*[)\]}])", norm_tex(x))     # 바깥 쉼표로 나눔
    rest = re.sub(r"\\\([\s\S]*?\\\)", " ", t)
    vals += re.findall(r"(?<![\w.])-?\d+(?:\.\d+)?(?![\w.])", rest)
    out = []
    for v in vals:
        parts, d, cur = [], 0, ""
        for ch in v:                                          # 바깥 '=' 의 마지막 변 (a=2 · f'(1)=-12 · A-B+C=11)
            d += {"(": 1, "[": 1, "{": 1, ")": -1, "]": -1, "}": -1}.get(ch, 0)
            if ch == "=" and d == 0:
                parts.append(cur); cur = ""
            else:
                cur += ch
        v = cur if parts else v
        v = re.sub(r"(?<=.)\([a-z]=[^()]*\)$", "", v)        # 10(x=-1) → 10
        if v and not re.fullmatch(r"[a-zA-Z]|\\[a-zA-Z]+", v) and v not in out:
            out.append(v)
    return out


def hint_has_answer(hint_html: str) -> bool:
    """힌트가 답까지 가는 풀이인가 (전략만 주는 힌트는 정답 비교를 하지 않는다)"""
    t = strip_tags(hint_html)
    return bool(re.search(r"정답|답\s*[:：]|∴|따라서|결론|값은|답은", t))


def check3(nn, probs, cards, pages):
    by_num = {c["num"]: c for c in cards}
    for p in probs:
        c = by_num.get(p.num)
        if not c or not c["ans"]:
            continue
        vals = answer_values(c["ans"])
        if not vals:
            continue
        def has(v, hay):
            return v in hay or loose(v) in loose(hay)
        miss_h = []
        if p.hint_html and hint_has_answer(p.hint_html):
            hint_hay = "§".join(norm_tex(x) for x in math_spans(p.hint_html)) + "§" \
                + "§".join(plain_numbers(p.hint_html)) + "§" + plain_text_norm(p.hint_html)
            miss_h = [v for v in vals if not has(v, hint_hay)]
        else:
            counts["hint_noanswer"] += 1
        key = c["board"] or p.key
        page = pages.get(key)
        miss_b, not_blue = [], []
        if page is not None:
            bh = board_hay(page["b"])
            ah = board_hay(page["all"])
            for v in vals:
                if not has(v, bh):
                    (not_blue if has(v, ah) else miss_b).append(v)
        if not_blue:
            counts["not_blue"] += 1
            notes.append(f"{nn}차시 {p.num}번: 판서 {key} 에 있지만 b: 줄이 아님 — {', '.join(not_blue)}")
        if miss_h or miss_b or page is None:
            parts = []
            if miss_h:
                parts.append("힌트/풀이에 없음 " + ", ".join(miss_h))
            if page is None:
                parts.append(f"판서 계획에 {key} 화면 없음")
            elif miss_b:
                parts.append(f"판서 {key} 에 없음 " + ", ".join(miss_b))
            warn(3, f"{nn}차시 {p.num}번", " · ".join(parts) + f"  (Nav 정답: {squash(strip_tags(c['ans']))[:90]})")


# ───────────────────────── 검사 4 ─────────────────────────
def bundle_sections(txt: str):
    out = {}
    ms = list(re.finditer(r'<section class="aft-lesson-wrap" data-lesson-no="([^"]+)"', txt))
    for k, m in enumerate(ms):
        out[m.group(1)] = txt[m.start(): ms[k + 1].start() if k + 1 < len(ms) else len(txt)]
    return out


def check4_sheet(nn, probs, bsecs):
    sec = bsecs.get(nn)
    if sec is None:
        fail(4, f"{nn}차시", f"{BUNDLE.name} 에 data-lesson-no=\"{nn}\" 구간 없음")
        return
    hay = squash(re.sub(r"<!--[\s\S]*?-->", "", sec))
    bprobs = {p.num: p for p in sheet_problems(sec)}
    for p in probs:
        blk = squash(p.block)
        if blk in hay:
            continue
        q = bprobs.get(p.num)
        if q is None:
            fail(4, f"{nn}차시 {p.num}번", "학습지 전체 묶음에 이 문항이 없음")
            continue
        what = [lab for lab, x, y in (("배지", p.badge_txt, q.badge_txt), ("출처", p.source, q.source),
                                       ("문장", squash(strip_tags(p.stmt_html)), squash(strip_tags(q.stmt_html))),
                                       ("힌트/풀이", squash(strip_tags(p.hint_html)), squash(strip_tags(q.hint_html))))
                if x != y]
        if not what:
            what = ["HTML(태그·속성)만"]
        x = squash(strip_tags(p.block)); y = squash(strip_tags(q.block))
        fail(4, f"{nn}차시 {p.num}번", f"학습지 전체 묶음과 다름 ({'·'.join(what)})"
             + (f"\n      학습지: {diff_snip(x, y)}\n      묶음  : {diff_snip(y, x)}" if x != y else ""))


def check4_teacher():
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "build_teacher_bundles.py"), "--check"],
                       cwd=ROOT, capture_output=True, env={**__import__("os").environ, "PYTHONIOENCODING": "utf-8"})
    out = r.stdout.decode("utf-8", "replace") + r.stderr.decode("utf-8", "replace")
    if r.returncode == 0:
        counts["ok4t"] += 1
        return
    lines = [l for l in out.splitlines() if l.startswith("CHECK")] or out.strip().splitlines()[-3:]
    for l in lines:
        fail(4, "교사용 통합본", l.replace("CHECK ", ""))
    secs = [l.strip() for l in out.splitlines() if re.match(r"\s+[LW]\w+\s+카드", l) and "q-stmt 달라진 카드  0" not in l]
    if secs:
        fail(4, "교사용 통합본", "Nav 와 달라진 섹션: " + " / ".join(squash(s) for s in secs[:12]))


# ───────────────────────── 검사 5 ─────────────────────────
def check5_file(path: pathlib.Path, txt: str):
    for m in re.finditer(r"P\.\s*\?", txt):
        line = txt.count("\n", 0, m.start()) + 1
        fail(5, f"{path.relative_to(ROOT)}:{line}", "출처 'P.?' — 쪽 번호 미확정 표기")
    # 수식 안 맨 '<' (HTML 이 태그로 읽어 수식이 깨진다 — \lt 를 써야 함)
    body = txt[txt.find("<body"):] if "<body" in txt else txt
    off = len(txt) - len(body)
    for m in re.finditer(r"\\\((?:(?!\\\)).){0,300}?<(?![a-zA-Z/!])", body, re.S):
        line = txt.count("\n", 0, off + m.end()) + 1
        fail(5, f"{path.relative_to(ROOT)}:{line}", "수식 안 맨 '<' → \\lt 로: " + squash(m.group(0))[-60:])


def check5_sheet(nn, probs):
    for p in probs:
        w = f"{nn}차시 {p.num}번"
        lv = BADGE_LV.get(p.badge_cls)
        if p.badge_txt and lv:
            head = re.match(r"\[?\s*(기초|기본|도전|심화|발전|서술형)", p.badge_txt)
            want = {"기초": "기초", "기본": "기본", "도전": "도전", "심화": "도전", "발전": "도전"}.get(head.group(1)) if head else None
            if want and want != lv:
                fail(5, w, f"배지 글머리 '{head.group(1)}' 인데 배지 색은 {p.badge_cls}({lv})")
        if p.source:
            sm = re.search(r"(?<![가-힣])(기초|기본|도전)(?=\s*\d|\s*[0-9]{2}번|\s*\d+번)", p.source)
            if sm and lv and sm.group(1) != lv:
                derived = any(k in p.source for k in ("참고", "변형", "자체", "유형", "패턴", "연계", "기반", "보강", "응용", "일반화"))
                msg = f"출처 '{p.source}' 는 {sm.group(1)} 인데 배지는 {p.badge_cls}({lv})"
                if p.tab != "practice":
                    # 차시 학습지의 배지는 학습지 Level(1·2·3) — 교과서 기초·기본·도전과 다를 수 있다
                    warn(5, w, msg + " — 차시 학습지 Level 배지라 경고만")
                elif derived:
                    warn(5, w, msg + " — 참고·변형 문항이라 경고만")
                else:
                    fail(5, w, msg)
            other = [k for k in SOURCE_VOCAB_OTHER if k in p.source]
            if other:
                warn(5, w, f"출처 어휘 {other} (권장: {'·'.join(SOURCE_VOCAB_OK)}) — '{p.source}'")


# ───────────────────────── 실행 ─────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="1,2,3,4,5")
    ap.add_argument("--lesson", nargs="*", default=[])
    ap.add_argument("--quiet", action="store_true")
    ap.add_argument("--verbose", action="store_true", help="참고 목록(판서에 있지만 b: 줄이 아닌 정답 값)도 출력")
    a = ap.parse_args()
    only = {int(x) for x in a.only.split(",") if x.strip()}
    lessons = [f"{int(x):02d}" for x in a.lesson] or LESSONS
    allow = load_allow()
    bsecs = bundle_sections(read(BUNDLE)) if 4 in only and BUNDLE.exists() else {}
    if 4 in only and not BUNDLE.exists():
        fail(4, BUNDLE.name, "파일 없음")

    nprob = 0
    for nn in lessons:
        sp, tp, np_ = lesson_files(nn)
        if not sp:
            fail(1, f"{nn}차시", "학생용 학습지 없음")
            continue
        probs = sheet_problems(read(sp))
        nprob += len(probs)
        if 1 in only:
            if not tp:
                fail(1, f"{nn}차시", "교사용 학습지 없음")
            else:
                check1(nn, sp, tp)
        cards = nav_cards(read(np_)) if np_ else []
        if (2 in only or 3 in only) and not np_:
            fail(2, f"{nn}차시", "교사용 Nav 없음")
        if 2 in only and np_:
            check2(nn, probs, cards, allow)
        if 3 in only and np_:
            check3(nn, probs, cards, board_pages(nn))
        if 4 in only and bsecs:
            check4_sheet(nn, probs, bsecs)
        if 5 in only:
            check5_sheet(nn, probs)
            for p in (sp, tp, np_):
                if p:
                    check5_file(p, read(p))
    if 2 in only:
        for k in sorted(set(allow) - used_allow):
            if k[0] in lessons:
                warn(2, f"{k[0]}차시 {k[1]}번", f"허용 목록 항목({k[2]})이 더 이상 필요 없음 — consistency_allow.json 에서 지울 것")
    if 4 in only and not a.lesson:
        check4_teacher()
    if 5 in only and not a.lesson:
        for p in sorted(ROOT.glob("수학익힘책_미적분I_*.html")) + sorted(T.glob("교사용*수학익힘책_미적분I_*.html")):
            check5_file(p, read(p))

    names = {1: "학생용↔교사용", 2: "학습지↔Nav", 3: "정답", 4: "묶음 최신", 5: "출처 표기"}
    for c in sorted(only):
        fl = [f for f in fails if f[0] == c]
        wl = [x for x in warns if x[0] == c]
        print(f"\n── {c}) {names[c]} — 실패 {len(fl)} · 경고 {len(wl)}" + (f" · 허용 {counts['allowed2']}" if c == 2 else ""))
        for _, w, m in fl:
            print(f"❌ {w}: {m}")
        if not a.quiet:
            for _, w, m in wl:
                print(f"⚠️  {w}: {m}")
        if c == 3:
            print(f"   (참고: 전략만 주는 힌트 {counts['hint_noanswer']}개는 힌트 비교 생략 · 판서에 있지만 b: 줄이 아닌 문항 "
                  f"{counts['not_blue']}개{' — 아래' if a.verbose else ' (--verbose 로 목록)'})")
            if a.verbose:
                for n in notes:
                    print("   · " + n)
    print(f"\n일관성 검사: 차시 {len(lessons)}개 · 학습지 문항 {nprob}개 · 실패 {len(fails)}건 · 경고 {len(warns)}건"
          + (f" · 허용 목록 적용 {counts['allowed2']}건" if counts["allowed2"] else ""))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
