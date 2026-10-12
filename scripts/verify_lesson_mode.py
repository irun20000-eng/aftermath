#!/usr/bin/env python3
"""수업 모드(lesson-mode) 정합성 검사

1) 루트와 교사용/ 사본이 같은지 (lesson-mode.js·css, boardplans/*.js)
2) 수업 모드를 켠 학습지마다 판서 계획 파일이 있는지
3) 판서 계획의 화면 키가 학습지 화면 구성과 맞는지
   - 학습지에서 나오는 화면 (lesson-mode.js 와 같은 규칙) 중 계획이 빠진 것
   - 계획에는 있는데 학습지에는 없는 키 (오타·번호 밀림)
4) 판서 예시 줄의 색 표시 문법 ([[b:…]] 짝, 줄 앞 b:/r:/g:)

사용:
  python3 scripts/verify_lesson_mode.py
"""
import pathlib, re, sys, filecmp

ROOT = pathlib.Path(__file__).resolve().parent.parent
T = ROOT / "교사용"

# lesson-mode.js 의 TAB_RULES 와 같은 순서·규칙
RULES = [
    (re.compile(r"성찰"), "reflect", "none"),
    (re.compile(r"생각\s*열기"), "warmup", "none"),
    (re.compile(r"개념\s*구성"), "concept", "blocks"),
    (re.compile(r"수준별"), "level", "problems"),
    (re.compile(r"형성평가"), "check", "none"),
    (re.compile(r"도전\s*문제"), "challenge", "merge"),
    (re.compile(r"실전"), "practice", "problems"),
]

fails = []


def fail(msg):
    fails.append(msg)
    print("❌", msg)


def expected_keys(html: str):
    keys = []
    counts = {}
    sections = re.findall(r"<section class=\"card[\s\S]*?</section>", html)
    for sec in sections:
        m = re.search(r"<h2[^>]*>([\s\S]*?)</h2>", sec)
        title = re.sub(r"<[^>]+>", "", m.group(1)) if m else ""
        rule = next((r for r in RULES if r[0].search(title)), None)
        if not rule:
            continue
        _, key, split = rule
        if split == "blocks":
            wrap = sec.split('class="space-y-8"', 1)
            n = len(re.findall(r"<h3", wrap[1])) if len(wrap) > 1 else 1
        elif split == "problems":
            n = len(re.findall(r'class="badge ', sec)) or 1
        else:
            n = 1
        for _ in range(n):
            counts[key] = counts.get(key, 0) + 1
            keys.append(f"{key}.{counts[key]}")
    return keys


def main():
    # 1) 사본 동기화
    pairs = [("lesson-mode.js", "lesson-mode.js"), ("lesson-mode.css", "lesson-mode.css")]
    for p in (ROOT / "boardplans").glob("*.js"):
        pairs.append((f"boardplans/{p.name}", f"boardplans/{p.name}"))
    for a, b in pairs:
        pa, pb = ROOT / a, T / b
        if not pb.exists():
            fail(f"교사용 사본 없음: 교사용/{b}")
        elif not filecmp.cmp(pa, pb, shallow=False):
            fail(f"사본 불일치: {a} ↔ 교사용/{b}")

    # 2·3) 학습지 ↔ 판서 계획
    sheets = sorted(ROOT.glob("학습지_*.html")) + sorted(T.glob("교사용_학습지_*.html"))
    checked = 0
    for s in sheets:
        html = s.read_text(encoding="utf-8")
        if "lesson-mode.js" not in html:
            continue
        checked += 1
        m = re.search(r'src="(boardplans/[^"?]+\.js)(?:\?[^"]*)?"', html)
        if not m:
            print(f"⚠️  {s.name}: 판서 계획 없음 (빈 판서 공간으로 동작)")
            continue
        plan = s.parent / m.group(1)
        if not plan.exists():
            fail(f"{s.name}: 판서 계획 파일 없음 {m.group(1)}")
            continue
        ptxt = plan.read_text(encoding="utf-8")
        have = set(re.findall(r"'([a-z]+\.\d+)'\s*:", ptxt))
        want = expected_keys(html)
        missing = [k for k in want if k not in have]
        extra = sorted(have - set(want))
        if missing:
            fail(f"{s.name}: 계획 빠진 화면 {missing}")
        if extra:
            fail(f"{s.name}: 학습지에 없는 계획 키 {extra}")
        # 4) 색 문법
        for line in re.findall(r"'((?:[^'\\]|\\.)*)'", ptxt):
            if line.count("[[") != line.count("]]"):
                fail(f"{plan.name}: [[ ]] 짝 안 맞음 → {line[:50]}")
        print(f"✅ {s.name}: 화면 {len(want)}개 · 계획 {len(have)}개")

    print(f"\n수업 모드 학습지 {checked}개 검사 · 실패 {len(fails)}건")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
