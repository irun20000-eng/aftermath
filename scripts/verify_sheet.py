#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""해설지 정적 검증 — 브라우저 없이 파일만 읽어 규칙 위반을 찾는다.

이 검사만으로는 충분하지 않다. 반드시 verify_render.js 도 함께 돌린다.
(정적 검사를 통과하고도 화면이 깨진 사례가 실제로 있었다 — PITFALLS A-1)

사용:
  python3 scripts/verify_sheet.py <파일...> \
      --expect-count 11 --expect basic=3,standard=6,advanced=2

  python3 scripts/verify_sheet.py 수학익힘책_*.html      # 기대치 없이 요약만
"""
import argparse, glob, re, sys

MAX_CHOICE_LEN = 20


def visual_len(s):
    """선택지의 '화면에 보이는' 대략적 길이.

    소스의 글자 수를 그대로 세면 \\(\\dfrac{2a-b}{2}\\) 같은 짧은 분수가
    22자로 잡혀 오탐이 된다. LaTeX 껍데기를 걷어내고 잰다.
    """
    t = s.replace('\\\\', '\\')                      # 빌드용 이중 백슬래시 해제
    t = re.sub(r'\\[()\[\]]', '', t)                 # \( \) \[ \]
    t = re.sub(r'\\(dfrac|frac|sqrt|displaystyle|left|right|,|;|!|quad|qquad)\b', '', t)
    t = re.sub(r'\\[a-zA-Z]+', 'x', t)               # 남은 명령어는 1글자로
    t = re.sub(r'[{}$\s]', '', t)                    # 중괄호·공백
    return len(t)


def slice_problems(html):
    """PROBLEMS 배열 리터럴만 잘라 온다."""
    i = html.find('const PROBLEMS')
    if i < 0:
        return None
    j = html.find('\n];', i)
    return html[i:j] if j > 0 else html[i:]


def check(path, expect_count=None, expect_levels=None):
    html = open(path, encoding='utf-8').read()
    blk = slice_problems(html)
    issues, info = [], {}

    if blk is None:
        return ['PROBLEMS 배열을 찾지 못함'], {}

    # 1) 문항 수
    ids = re.findall(r"\bid\s*:\s*'([^']+)'", blk)
    info['count'] = len(ids)
    if expect_count is not None and len(ids) != expect_count:
        issues.append('문항 수 %d ≠ 기대 %d' % (len(ids), expect_count))
    dup = {x for x in ids if ids.count(x) > 1}
    if dup:
        issues.append('중복 문항 id: %s' % ', '.join(sorted(dup)))

    # 2) 난이도 분포
    levels = {}
    for lv in ('basic', 'standard', 'advanced'):
        levels[lv] = len(re.findall(r"level\s*:\s*'%s'" % lv, blk))
    info['levels'] = levels
    if sum(levels.values()) != len(ids):
        issues.append('난이도 합 %d ≠ 문항 수 %d' % (sum(levels.values()), len(ids)))
    if expect_levels:
        for lv, n in expect_levels.items():
            if levels.get(lv, 0) != n:
                issues.append('%s %d ≠ 기대 %d' % (lv, levels.get(lv, 0), n))

    # 3) type별 정답 필드 ★ 틀리면 정답이 화면에 안 나온다
    objs = re.split(r'\n\s{2}\{\n', blk)[1:]
    for o in objs:
        m = re.search(r"\bid\s*:\s*'([^']+)'", o)
        pid = m.group(1) if m else '?'
        t = re.search(r"type\s*:\s*'(\w+)'", o)
        t = t.group(1) if t else '?'
        if t == 'short' and 'answerText' not in o:
            issues.append('%s: short 인데 answerText 없음' % pid)
        if t == 'choice':
            if not re.search(r"\banswer\s*:\s*\d", o):
                issues.append('%s: choice 인데 answer(정수) 없음' % pid)
            mc = re.search(r'choices\s*:\s*\[(.*?)\]', o, re.S)
            for c in re.findall(r"'((?:[^'\\]|\\.)*)'", mc.group(1) if mc else ''):
                n = visual_len(c)
                if n > MAX_CHOICE_LEN:
                    issues.append('%s: 선택지 %d자 (>%d) — %s…'
                                  % (pid, n, MAX_CHOICE_LEN, c[:30]))

    # 4) 수식 안 raw 부등호 ★ 태그로 먹혀 수식이 사라진다
    raw = []
    for m in re.finditer(r'\\\\\((.*?)\\\\\)|\\\((.*?)\\\)', blk, re.S):
        t = m.group(1) or m.group(2) or ''
        if '<' in t or '>' in t:
            raw.append(t.strip()[:60])
    info['raw_ineq'] = len(raw)
    for t in raw[:5]:
        issues.append('수식 내 raw 부등호: %s' % t)
    if len(raw) > 5:
        issues.append('… raw 부등호 %d건 더' % (len(raw) - 5))

    # 5) 외부 이미지 참조
    ext = re.findall(r'src="(?!data:)([^"]+\.(?:png|jpg|jpeg|gif|svg))"', blk)
    info['embedded_imgs'] = blk.count('data:image')
    if ext:
        issues.append('외부 이미지 참조 %d건: %s' % (len(ext), ext[0]))

    # 6) 필터 카운트 = 실제 문항 수
    for key, lv in (('cnt-all', None), ('cnt-basic', 'basic'),
                    ('cnt-standard', 'standard'), ('cnt-advanced', 'advanced')):
        m = re.search(r'id="%s"[^>]*>(\d+)<' % key, html)
        if not m:
            continue
        shown = int(m.group(1))
        real = len(ids) if lv is None else levels[lv]
        if shown != real:
            issues.append('필터 %s 표시 %d ≠ 실제 %d' % (key, shown, real))

    # 7) 중복 DOM id
    all_ids = re.findall(r'\sid="([^"]+)"', html)
    dupdom = sorted({x for x in all_ids if all_ids.count(x) > 1})
    info['dup_dom_ids'] = len(dupdom)
    if dupdom:
        issues.append('중복 DOM id %d종: %s' % (len(dupdom), ', '.join(dupdom[:5])))

    return issues, info


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('files', nargs='+')
    ap.add_argument('--expect-count', type=int)
    ap.add_argument('--expect', help='basic=3,standard=6,advanced=2')
    a = ap.parse_args()

    expect_levels = None
    if a.expect:
        expect_levels = {k: int(v) for k, v in
                         (p.split('=') for p in a.expect.split(','))}

    paths = [p for f in a.files for p in sorted(glob.glob(f))] or a.files
    bad = 0
    for p in paths:
        issues, info = check(p, a.expect_count, expect_levels)
        lv = info.get('levels', {})
        head = '%-58s 문항 %s | 기초 %s 기본 %s 도전 %s | 그림 %s' % (
            p.split('/')[-1][:58], info.get('count', '?'),
            lv.get('basic', '?'), lv.get('standard', '?'), lv.get('advanced', '?'),
            info.get('embedded_imgs', '?'))
        if issues:
            bad += 1
            print('❌ ' + head)
            for i in issues:
                print('     · ' + i)
        else:
            print('✅ ' + head)
    print('\n%d개 파일 · 문제 있는 파일 %d개' % (len(paths), bad))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
