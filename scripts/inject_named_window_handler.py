#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""1학기 24개 HTML 파일에 named window click handler 일괄 주입 + inline focus 보강.

대상:
- index.html (1)
- 학습지_01~18.html (18)
- 수능특강_수학I_*_해설.html (3)
- 뽑기.html (1)
- 중간고사_자기평가성찰지.html (1)

제외:
- 학습지_전체_묶음.html — PDF 인쇄 전용
- 학습지_미적분I_*, 수능특강_미적분I_*, index-calc.html — 2학기 (이미 핸들러 보유)

작업:
1. `</body>` 직전에 click handler `<script>` 블록 삽입 (이미 있으면 skip)
2. inline `const w = window.open(... 'aftermath_...');`이 `if (w) w.focus();` 없이 끝나면 보강

재실행 안전 (idempotent).
"""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

HANDLER_BLOCK = """<script>
/* named window 일관 처리 — 이미 열린 창 있으면 새 창 없이 focus */
document.addEventListener('click', function(e) {
  const a = e.target.closest('a[target^="aftermath_"]');
  if (!a) return;
  e.preventDefault();
  const w = window.open(a.href, a.target);
  if (w) w.focus();
});
</script>
"""

HANDLER_MARKER = "a[target^=\"aftermath_\"]"

# inline window.open 호출 후 if (w) w.focus(); 없는 패턴
# const w = window.open(..., 'aftermath_...');   ← 다음에 if (w) w.focus()가 안 오면 보강
INLINE_RE = re.compile(
    r"(const\s+w\s*=\s*window\.open\([^)]*'aftermath_[^']*'\s*\)\s*;)(?!\s*if\s*\(w\)\s*w\.focus\(\)\s*;)",
)

TARGETS: list[str] = [
    "index.html",
    "뽑기.html",
    "중간고사_자기평가성찰지.html",
    # 학습지 01~18
    *[
        f"학습지_{n:02d}_*.html"
        for n in range(1, 19)
    ],
    # 수능특강 수학I 해설지 3개
    "수능특강_수학I_*_해설.html",
]


def collect_files() -> list[pathlib.Path]:
    files: list[pathlib.Path] = []
    for pat in TARGETS:
        if "*" in pat:
            matched = sorted(ROOT.glob(pat))
            # 미적분I 파일 제외
            matched = [
                f for f in matched
                if "미적분I" not in f.name and "전체_묶음" not in f.name
            ]
            files.extend(matched)
        else:
            p = ROOT / pat
            if p.exists():
                files.append(p)
    # 중복 제거 (set 사용 시 순서 보장 X — dict.fromkeys)
    return list(dict.fromkeys(files))


def process(path: pathlib.Path) -> dict[str, int]:
    text = path.read_text(encoding="utf-8")
    changes = {"handler_added": 0, "inline_focus_added": 0}

    # 1. inline focus 보강
    new_text, count = INLINE_RE.subn(r"\1 if (w) w.focus();", text)
    changes["inline_focus_added"] = count
    text = new_text

    # 2. handler block 삽입 (이미 있으면 skip)
    if HANDLER_MARKER not in text:
        # </body> 직전에 삽입
        if "</body>" not in text:
            print(f"⚠️  {path.name}: </body> 없음 — skip", file=sys.stderr)
        else:
            text = text.replace("</body>", HANDLER_BLOCK + "</body>", 1)
            changes["handler_added"] = 1

    if changes["handler_added"] or changes["inline_focus_added"]:
        path.write_text(text, encoding="utf-8")

    return changes


def main() -> int:
    files = collect_files()
    if not files:
        print("❌ 대상 파일 없음", file=sys.stderr)
        return 1

    total_handler = 0
    total_focus = 0
    skipped = 0
    print(f"대상 파일 {len(files)}개")
    print("-" * 60)
    for f in files:
        c = process(f)
        marks = []
        if c["handler_added"]:
            marks.append("✅handler")
            total_handler += 1
        if c["inline_focus_added"]:
            marks.append(f"✅focus×{c['inline_focus_added']}")
            total_focus += c["inline_focus_added"]
        if not marks:
            marks.append("⏭ skip (이미 적용)")
            skipped += 1
        print(f"  {f.name:50s} {' '.join(marks)}")

    print("-" * 60)
    print(f"📊 핸들러 추가: {total_handler}건 / inline focus 보강: {total_focus}건 / skip: {skipped}건")
    return 0


if __name__ == "__main__":
    sys.exit(main())
