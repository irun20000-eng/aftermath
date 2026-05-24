#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""학습지_미적분I_01~31.html → 학습지_전체_묶음_미적분I.html 빌더.

1학기 학습지_전체_묶음.html 패턴 그대로 재사용:
- 학습지_미적분I_01의 head 베이스 (MathJax · tailwind · 학습지 본문 CSS · widgets.css)
- window.name 라인 제거 (학습지마다 다른 namespace 충돌 방지)
- 묶음 전용 CSS (#aft-bundle-css) — 1학기 묶음에서 추출
- title 교체 ("학습지 전체 묶음 (미적분I 01-31) — PDF 저장용")
- 31개 학습지의 <body…>…</body> 안 내용을 <section class="aft-lesson-wrap">로 wrap
- 각 학습지의 <script src="widgets.js"></script>는 제거 → 맨 끝 1회만

재실행 안전 (idempotent): 매번 OUT_BUNDLE 통째 재작성.
"""
from __future__ import annotations

import html as html_mod
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC_BUNDLE_1ST = ROOT / "학습지_전체_묶음.html"  # 1학기 묶음 (참조용)
SRC_LESSON_TEMPLATE = ROOT / "학습지_미적분I_01_함수의극한.html"  # head 베이스
OUT_BUNDLE = ROOT / "학습지_전체_묶음_미적분I.html"

HEAD_RE = re.compile(r"<head>(.*?)</head>", re.DOTALL | re.IGNORECASE)
BODY_RE = re.compile(r"<body[^>]*>(.*?)</body>", re.DOTALL | re.IGNORECASE)
TITLE_RE = re.compile(r"<title>(.*?)</title>", re.DOTALL | re.IGNORECASE)
# head 안 첫 번째 <style>...</style> 블록 (학습지 본문 CSS)
HEAD_STYLE_RE = re.compile(r"<style>(.*?)</style>", re.DOTALL | re.IGNORECASE)
WINDOW_NAME_RE = re.compile(
    r"\s*<script>\s*window\.name\s*=\s*['\"][^'\"]*['\"]\s*;\s*</script>\s*",
    re.IGNORECASE,
)
WIDGETS_JS_RE = re.compile(
    r"\s*<script\s+src=[\"']widgets\.js[\"']\s*>\s*</script>\s*",
    re.IGNORECASE,
)
BUNDLE_CSS_RE = re.compile(
    r'<style id="aft-bundle-css">.*?</style>',
    re.DOTALL,
)


def extract_head(html: str) -> str:
    m = HEAD_RE.search(html)
    if not m:
        raise SystemExit("head 추출 실패")
    return m.group(0)


def extract_body_inner(html: str) -> str:
    m = BODY_RE.search(html)
    if not m:
        raise SystemExit("body 추출 실패")
    return m.group(1)


def extract_title(html: str) -> str:
    m = TITLE_RE.search(html)
    return m.group(1).strip() if m else ""


def extract_bundle_css(src_1st_bundle_html: str) -> str:
    m = BUNDLE_CSS_RE.search(src_1st_bundle_html)
    if not m:
        raise SystemExit("1학기 묶음에서 #aft-bundle-css 추출 실패")
    return m.group(0)


def main() -> int:
    if not SRC_BUNDLE_1ST.exists():
        print(f"❌ 1학기 묶음 없음: {SRC_BUNDLE_1ST}", file=sys.stderr)
        return 1
    if not SRC_LESSON_TEMPLATE.exists():
        print(f"❌ 학습지 01 없음: {SRC_LESSON_TEMPLATE}", file=sys.stderr)
        return 1

    src_1st_html = SRC_BUNDLE_1ST.read_text(encoding="utf-8")
    bundle_css = extract_bundle_css(src_1st_html)

    template_html = SRC_LESSON_TEMPLATE.read_text(encoding="utf-8")
    template_head = extract_head(template_html)

    # window.name 라인 제거
    template_head = WINDOW_NAME_RE.sub("\n    ", template_head)
    # title 교체
    template_head = TITLE_RE.sub(
        "<title>학습지 전체 묶음 (미적분I 01-31) — PDF 저장용</title>",
        template_head,
        count=1,
    )
    # 묶음 전용 CSS injection (</head> 직전)
    # 묶음 전용 override CSS — MathJax 로딩 지연으로 화면이 검정 유지되는 문제 회피.
    # 1학기 묶음(18개)보다 1.7배 큰 2학기 묶음(31개)에서 사용자 보고된 stall 대응.
    override_css = (
        '<style id="aft-bundle-override">\n'
        '  /* MathJax 처리 완료 대기 없이 본문 즉시 표시 — 수식은 처리되는대로 점진 렌더링 */\n'
        '  body { opacity: 1 !important; }\n'
        '</style>'
    )
    template_head = template_head.replace(
        "</head>",
        "\n" + bundle_css + "\n\n" + override_css + "\n\n</head>",
    )

    # 31개 학습지 수집
    lesson_files: list[tuple[int, pathlib.Path]] = []
    for n in range(1, 32):
        cands = sorted(ROOT.glob(f"학습지_미적분I_{n:02d}_*.html"))
        if not cands:
            print(f"❌ 학습지 {n:02d} 미발견", file=sys.stderr)
            return 1
        lesson_files.append((n, cands[0]))

    # 빌드
    out: list[str] = []
    out.append("<!DOCTYPE html>")
    out.append('<html lang="ko">')
    out.append(template_head)
    # mathjax-ready 클래스를 처음부터 박아 opacity:0 → 1 토글 의존성 제거 (override_css와 이중 안전망)
    out.append('<body class="p-4 md:p-8 lg:p-12 mathjax-process mathjax-ready">')
    out.append("")
    out.append('<button class="aft-pdf-save-bundle no-print" onclick="window.print()">')
    out.append("  📄 전체 PDF 저장 (31개 학습지)")
    out.append("</button>")
    out.append("")

    for n, path in lesson_files:
        html_text = path.read_text(encoding="utf-8")
        body_inner = extract_body_inner(html_text)
        # 각 학습지 안 widgets.js 제거 (중복 방지)
        body_inner = WIDGETS_JS_RE.sub("\n", body_inner)
        title = extract_title(html_text)
        meta_label = f"📄 {n:02d}. {title}".strip()

        # 각 학습지의 head 본문 CSS도 wrap 안에 inject (n=01은 head에 이미 있으니 생략)
        lesson_style = ""
        if n > 1:
            head_text = extract_head(html_text)
            style_m = HEAD_STYLE_RE.search(head_text)
            if style_m:
                lesson_style = f"  <style data-lesson-style=\"{n:02d}\">{style_m.group(1)}</style>"

        out.append(
            f'<section class="aft-lesson-wrap" data-lesson-no="{n:02d}" '
            f'style="page-break-after:always;break-after:page;">'
        )
        out.append(
            f'  <div class="aft-lesson-meta no-print">{html_mod.escape(meta_label)}</div>'
        )
        if lesson_style:
            out.append(lesson_style)
        out.append(body_inner.strip())
        out.append("</section>")

    out.append('<script src="widgets.js"></script>')
    out.append("</body>")
    out.append("</html>")

    OUT_BUNDLE.write_text("\n".join(out), encoding="utf-8")
    size = OUT_BUNDLE.stat().st_size
    line_count = len(OUT_BUNDLE.read_text(encoding="utf-8").splitlines())
    print(f"✅ 작성: {OUT_BUNDLE.name}")
    print(f"   {size:,} bytes · {line_count:,} lines · 31개 학습지 concat")
    return 0


if __name__ == "__main__":
    sys.exit(main())
