"""HWP 5.0 → 읽기 순서 텍스트 (수식 스크립트·그림·표 포함) + 그림 PNG 추출.

사용: python3 -I scripts/hwp_extract.py <src.hwp> <out_dir>   (필요: pip install olefile pillow)
LibreOffice·pyhwp 는 HWP 5.0 수식(EQEDIT 레코드)을 버리므로 레코드를 직접 읽는다.
출력: out_dir/text.txt, out_dir/figs/BINxxxx.png
수식은 ⟦EQ: 한글수식스크립트⟧, 그림은 ⟦FIG: BINxxxx.png⟧, 표는 ⟦TABLE ... ⟧ 로 표시한다.
"""
import io
import os
import re
import struct
import sys
import zlib

import olefile
from PIL import Image

PARA_HEADER, PARA_TEXT, CTRL_HEADER, LIST_HEADER = 66, 67, 71, 72
SHAPE_PICTURE, EQEDIT = 85, 88
BIN_DATA = 18
EXT_CTRL = {1, 2, 3, 11, 12, 14, 15, 16, 17, 18, 21, 22, 23}
INLINE_CTRL = {4, 5, 6, 7, 8, 9, 19, 20}


def records(data):
    i = 0
    while i < len(data):
        h, = struct.unpack_from('<I', data, i)
        tag, level, size = h & 0x3FF, (h >> 10) & 0x3FF, h >> 20
        i += 4
        if size == 0xFFF:
            size, = struct.unpack_from('<I', data, i)
            i += 4
        yield tag, level, data[i:i + size]
        i += size


def parse_text(b):
    """PARA_TEXT → [str | ('ctrl', id)]"""
    out, i, n = [], 0, len(b) // 2
    w = struct.unpack('<%dH' % n, b[:n * 2])
    while i < n:
        c = w[i]
        if c in EXT_CTRL:
            cid = bytes(b[i * 2 + 2:i * 2 + 6])[::-1].decode('latin1')
            out.append(('ctrl', cid))
            i += 8
        elif c in INLINE_CTRL:
            out.append('\t' if c == 9 else '')
            i += 8
        elif c < 32:
            out.append('\n' if c in (10, 13) else '')
            i += 1
        else:
            out.append(chr(c))
            i += 1
    return out


class Node:
    def __init__(self, kind, level):
        self.kind, self.level, self.children, self.tokens, self.cid, self.data = kind, level, [], [], None, None


def bin_names(ole, compressed):
    """그림 레코드의 BinItem ID(1부터) → BinData 스트림 이름.
    ID 는 스트림 번호가 아니라 DocInfo 의 BIN_DATA 목록 순번이다 (첫 항목이 jpg면 번호가 밀린다)."""
    raw = ole.openstream('DocInfo').read()
    data = zlib.decompress(raw, -15) if compressed else raw
    names = []
    for tag, _, body in records(data):
        if tag == BIN_DATA:
            attr, = struct.unpack_from('<H', body, 0)
            names.append('BIN%04X' % struct.unpack_from('<H', body, 2)[0] if attr & 0xF in (1, 2) else None)
    return names


def build(ole):
    sections = sorted((e for e in ole.listdir() if e[0] == 'BodyText'), key=lambda e: int(e[1][7:]))
    header = ole.openstream('FileHeader').read()
    compressed = struct.unpack_from('<I', header, 36)[0] & 1
    roots = []
    for sec in sections:
        raw = ole.openstream(sec).read()
        data = zlib.decompress(raw, -15) if compressed else raw
        para_at, ctrl_at = {}, {}
        for tag, level, body in records(data):
            if tag == PARA_HEADER:
                p = Node('para', level)
                if level == 0:
                    roots.append(p)
                else:
                    parent = ctrl_at.get(level - 1)
                    (parent.children if parent else roots).append(p)
                para_at[level] = p
            elif tag == PARA_TEXT:
                p = para_at.get(level - 1)
                if p:
                    p.tokens = parse_text(body)
            elif tag == CTRL_HEADER:
                c = Node('ctrl', level)
                c.cid = bytes(body[:4])[::-1].decode('latin1')
                p = para_at.get(level - 1)
                if p:
                    p.children.append(c)
                ctrl_at[level] = c
                for k in [k for k in ctrl_at if k > level]:
                    del ctrl_at[k]
            elif tag == EQEDIT:
                c = ctrl_at.get(level - 1)
                if c and len(body) >= 6:
                    ln, = struct.unpack_from('<H', body, 4)
                    c.data = body[6:6 + ln * 2].decode('utf-16le', 'replace')
            elif tag == SHAPE_PICTURE:
                owner = next((ctrl_at[k] for k in sorted(ctrl_at, reverse=True) if k < level and ctrl_at[k].cid == 'gso '), None)
                if owner and len(body) >= 73:
                    owner.data = struct.unpack_from('<H', body, 71)[0]
    return roots


def render(node, names=()):
    if node.kind == 'para':
        ctrls = iter([c for c in node.children if c.kind == 'ctrl'])
        out = []
        for t in node.tokens:
            if isinstance(t, tuple):
                c = next(ctrls, None)
                out.append(render(c, names) if c else '')
            else:
                out.append(t)
        return ''.join(out).rstrip()
    cid = node.cid
    if cid == 'eqed':
        return ' ⟦EQ: %s⟧ ' % (node.data or '').strip()
    if cid == 'gso ':
        inner = ' '.join(render(p, names) for p in node.children if p.kind == 'para').strip()
        name = names[node.data - 1] if node.data and node.data <= len(names) else None
        fig = ' ⟦FIG: %s.png⟧ ' % name if name else ''
        return fig + (' ⟦BOX: %s⟧ ' % inner if inner else '')
    if cid == 'tbl ':
        cells = [render(p, names) for p in node.children if p.kind == 'para']
        return '\n⟦TABLE: ' + ' | '.join(c for c in cells if c.strip()) + ' ⟧\n'
    return ''


def main(src, out):
    os.makedirs(os.path.join(out, 'figs'), exist_ok=True)
    ole = olefile.OleFileIO(src)
    header = ole.openstream('FileHeader').read()
    compressed = struct.unpack_from('<I', header, 36)[0] & 1
    roots = build(ole)
    names = bin_names(ole, compressed)
    text = '\n'.join(render(p, names) for p in roots)
    text = re.sub(r'\n\s*\n+', '\n', text)
    open(os.path.join(out, 'text.txt'), 'w', encoding='utf-8').write(text)
    n = 0
    for e in ole.listdir():
        if e[0] != 'BinData':
            continue
        raw = ole.openstream(e).read()
        try:
            raw = zlib.decompress(raw, -15) if compressed else raw
        except zlib.error:
            pass
        name = os.path.splitext(e[1])[0]
        try:
            Image.open(io.BytesIO(raw)).convert('RGB').save(os.path.join(out, 'figs', name + '.png'))
            n += 1
        except Exception:
            open(os.path.join(out, 'figs', e[1]), 'wb').write(raw)
    print('chars', len(text), 'eq', text.count('⟦EQ:'), 'fig refs', text.count('⟦FIG:'), 'images', n)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
