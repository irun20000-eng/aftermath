#!/usr/bin/env python3
"""학습지 수정분을 학습지 전체 묶음에 그대로 옮긴다 (손으로 두 번 고치지 않게)

학습지_전체_묶음_미적분I.html 은 학습지 본문을 이어 붙인 파일인데, 익힘책 섹션 등이 더해져 있어
build_bundle_calc.py 로 통째 재생성하면 그 부분이 사라진다. 그래서 '바뀐 줄만' 옮긴다.

동작: 각 학습지를 기준 커밋(--base, 기본 main)과 비교해 바뀐 덩어리(교체·삭제·삽입)를 찾고,
      묶음 안에서 그 학습지 구간을 찾아(차시 번호 표식) 원래 줄 묶음이 정확히 한 번 나오는 곳만 바꾼다.
      위치가 애매하거나 못 찾으면 바꾸지 않고 ❌ 로 보고한다 (조용히 틀리지 않게).

사용:
  python3 scripts/sync_bundle_from_sheets.py            # 적용
  python3 scripts/sync_bundle_from_sheets.py --dry-run  # 보고만
"""
import argparse, difflib, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BUNDLE = ROOT / "학습지_전체_묶음_미적분I.html"


def git_show(base, rel):
    r = subprocess.run(["git", "show", f"{base}:{rel}"], cwd=ROOT, capture_output=True)
    return r.stdout.decode("utf-8") if r.returncode == 0 else None


def find_block(hay, needle, lo, hi):
    """hay[lo:hi] 안에서 needle(줄 리스트, 공백 정리 비교)이 나오는 시작 위치들"""
    key = [l.strip() for l in needle]
    hits = []
    n = len(key)
    for i in range(lo, max(lo, hi - n + 1)):
        if all(hay[i + k].strip() == key[k] for k in range(n)):
            hits.append(i)
    return hits


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="main")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    raw = BUNDLE.read_text(encoding="utf-8")
    crlf = "\r\n" in raw
    B = raw.replace("\r\n", "\n").split("\n")
    ok = fail = skip = 0
    for sheet in sorted(ROOT.glob("학습지_미적분I_*.html")):
        rel = sheet.name
        old = git_show(a.base, rel)
        if old is None:
            continue
        new = sheet.read_text(encoding="utf-8").replace("\r\n", "\n").split("\n")
        old = old.replace("\r\n", "\n").split("\n")
        if old == new:
            continue
        n = rel[9:11]
        # 묶음 안 이 차시 구간: 'NN차시' 머리표가 처음 나오는 줄 ~ 다음 차시 머리표
        starts = [i for i, l in enumerate(B) if re.search(rf"{int(n):02d}차시[:：]", l)]
        nxt = [i for i, l in enumerate(B) if re.search(rf"{int(n) + 1:02d}차시[:：]", l)]
        lo = max(0, (starts[0] - 400) if starts else 0)
        hi = (nxt[0] if nxt else len(B))
        sm = difflib.SequenceMatcher(a=old, b=new, autojunk=False)
        for tag, i1, i2, j1, j2 in reversed(sm.get_opcodes()):
            if tag == "equal":
                continue
            # 삽입은 바로 앞 줄(앵커)과 함께 교체로 다룬다
            if tag == "insert":
                if i1 == 0:
                    print(f"❌ {n}: 파일 맨 앞 삽입은 처리 안 함")
                    fail += 1
                    continue
                i1, j1 = i1 - 1, j1 - 1
            # 짧은 덩어리는 앞뒤 한 줄씩 붙여 위치를 특정
            ctx_a, ctx_b = 0, 0
            blk_old = old[i1:i2]
            while True:
                hits = find_block(B, old[i1 - ctx_a:i2 + ctx_b], lo, hi)
                if len(hits) == 1 or (ctx_a + ctx_b) >= 6 or not hits:
                    break
                ctx_a = min(ctx_a + 1, i1)
                ctx_b = min(ctx_b + 1, len(old) - i2)
            if len(hits) != 1:
                # 이미 반영된 덩어리(새 줄이 그대로 있음)는 건너뜀 — 재실행 안전
                new_blk = [l for l in new[j1:j2] if l.strip()]
                if new_blk and len(find_block(B, new[j1:j2], lo, hi)) >= 1:
                    skip += 1
                    continue
                # 묶음에 없는 머리 줄(수업 모드·판서 스크립트 include)은 대상 아님
                if blk_old and all(re.search(r"lesson-mode\.|boardplans/|^\s*$", l) for l in blk_old):
                    skip += 1
                    continue
                print(f"❌ {n}: 묶음에서 위치 특정 실패 ({len(hits)}곳) — {blk_old[0].strip()[:70] if blk_old else '(빈 줄)'}")
                fail += 1
                continue
            s = hits[0] + ctx_a
            # 들여쓰기는 묶음 쪽 첫 줄 기준으로 맞춘다
            ind_b = re.match(r"\s*", B[s]).group(0) if s < len(B) else ""
            ind_o = re.match(r"\s*", old[i1]).group(0) if i1 < len(old) else ""
            repl = [(ind_b + l[len(ind_o):]) if l.startswith(ind_o) else l for l in new[j1:j2]]
            B[s:s + (i2 - i1)] = repl
            hi += len(repl) - (i2 - i1)
            ok += 1
    if not a.dry_run:
        out = "\n".join(B)
        BUNDLE.write_text(out.replace("\n", "\r\n") if crlf else out, encoding="utf-8", newline="")
    print(f"\n{'(dry-run) ' if a.dry_run else ''}묶음 반영 {ok}건 · 건너뜀 {skip}건(이미 반영/묶음에 없는 줄) · 실패 {fail}건")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
