#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""링크 전수 검사 — 모든 href의 대상 파일이 실제로 존재하는지 확인한다.

폴더 깊이가 바뀌는 복제(학생용 → 교사용/) 뒤에 반드시 돌린다.
실제로 이 검사로 깨진 링크 5건을 찾았다 (PITFALLS D-3).

사용:
  python3 scripts/verify_links.py                 # 저장소 전체
  python3 scripts/verify_links.py 교사용 docs      # 특정 폴더만
"""
import os, re, sys

SKIP_DIRS = {'.git', 'node_modules', '.claude', 'images', '_assets_private'}
HREF = re.compile(r'(?:href|src)="([^"#?]+\.html)"')


def walk(roots):
    for root in roots:
        if os.path.isfile(root):
            yield root
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for fn in filenames:
                if fn.endswith('.html'):
                    yield os.path.join(dirpath, fn)


def main():
    roots = sys.argv[1:] or ['.']
    checked = broken = 0
    seen_bad = []

    for f in walk(roots):
        base = os.path.dirname(f) or '.'
        try:
            s = open(f, encoding='utf-8').read()
        except (UnicodeDecodeError, OSError):
            continue
        for h in sorted(set(HREF.findall(s))):
            if h.startswith(('http://', 'https://', '//', 'mailto:')):
                continue
            checked += 1
            target = os.path.normpath(os.path.join(base, h))
            if not os.path.exists(target):
                broken += 1
                seen_bad.append((f, h))

    for f, h in seen_bad:
        print('❌ %s\n     → %s' % (f, h))

    print('\n검사한 링크 %d개 · 깨진 링크 %d건' % (checked, broken))

    # 중복 DOM id (합성 문서에서 특히 위험)
    print('\n--- 중복 DOM id 검사 ---')
    dup_total = 0
    for f in walk(roots):
        try:
            s = open(f, encoding='utf-8').read()
        except (UnicodeDecodeError, OSError):
            continue
        ids = re.findall(r'\sid="([^"]+)"', s)
        dup = sorted({x for x in ids if ids.count(x) > 1})
        if dup:
            dup_total += len(dup)
            print('❌ %s — %d종: %s' % (f, len(dup), ', '.join(dup[:5])))
    print('중복 id 있는 파일의 id 종류 합계: %d' % dup_total)

    sys.exit(1 if (broken or dup_total) else 0)


if __name__ == '__main__':
    main()
