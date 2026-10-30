"""전사 데이터의 정답을 원자료 정답과 기계적으로 대조한다.

사용: python3 -I scripts/mock_exam_check_answers.py <set_dir>
  set_dir/src/src.pdf 가 있으면 [정답/모범답안] 순서(공통 1~22, 확통, 미적, 기하 23~30)로,
  set_dir/ext/text.txt 가 있으면 정답표(⟦TABLE: 번호 | 정답 | …⟧)로 대조한다.
"""
import glob
import json
import os
import re
import subprocess
import sys

CIRC = {'①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5'}
ORDER = [('common', range(1, 23)), ('prob', range(23, 31)), ('calc', range(23, 31)), ('geom', range(23, 31))]


def source_answers(d):
    pdf, txt = os.path.join(d, 'src/src.pdf'), os.path.join(d, 'ext/text.txt')
    if os.path.exists(txt):
        tables = []
        for m in re.finditer(r'⟦TABLE: ([^⟧]*)⟧', open(txt, encoding='utf-8').read()):
            cells = [c.strip() for c in m.group(1).split('|')]
            if len(cells) >= 4 and cells[0] in ('1', '23') and cells[1] in CIRC:
                tables.append(cells)
        out = []
        for cells in tables[:4]:
            out += [CIRC.get(v, v) for v in cells[1::2]]
        return out
    t = subprocess.run(['pdftotext', pdf, '-'], capture_output=True, text=True).stdout
    return re.findall(r'\[정답/모범답안\]\s*\n\s*(\S+)', t)


def main(d):
    src = source_answers(d)
    data = {}
    for f in glob.glob(os.path.join(d, 'data/*.json')):
        for p in json.load(open(f, encoding='utf-8')):
            data[(p['section'], p['no'])] = p
    i, bad, missing, pts = 0, [], [], {}
    for sec, rng in ORDER:
        pts[sec] = 0
        for n in rng:
            p = data.get((sec, n))
            if p is None:
                missing.append((sec, n))
            else:
                pts[sec] += p['points']
                if i < len(src) and str(p['answer']) != src[i]:
                    bad.append((sec, n, p['answer'], src[i]))
            i += 1
    print(json.dumps({'source_answers': len(src), 'problems': len(data), 'missing': missing,
                      'mismatch': bad, 'points': pts}, ensure_ascii=False))


if __name__ == '__main__':
    main(sys.argv[1])
