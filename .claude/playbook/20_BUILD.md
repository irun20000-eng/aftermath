# 2단계 · 실행 — 추출과 제작

> 단원 단위로 독립 진행한다. 이 문서의 절차를 단원마다 반복한다.

---

## 2-1. 원자료 추출

### 텍스트

```python
import fitz
doc = fitz.open(PDF)
for i in range(doc.page_count):
    print(i, doc[i].get_text()[:200])   # 먼저 페이지 지도를 만든다
```

**페이지 지도부터 만든다.** 어느 페이지가 문제이고 어느 페이지가 해설인지 확정한 뒤에 본격 추출.
이 단계를 건너뛰면 나중에 정답을 못 찾아 헤맨다.

### 난이도 판정

문제집은 대개 **페이지 상단 탭이나 단 구분**으로 난이도를 표시한다.
텍스트 순서만 보면 뒤섞여 나온다. **페이지를 이미지로 렌더해서 눈으로 확인**하는 게 가장 빠르다.

```python
doc[i].get_pixmap(dpi=110).save(f'page{i}.png')   # 그리고 직접 본다
```

> 실제 사례: 좌측 단이 기초, 우측 단이 기본이었는데 텍스트 추출 순서로는
> `기본 → 도전 → 기초 → 기초 → 도전 → 기본` 으로 나와 판정이 불가능했다.

### 그림 크롭

```python
pm = doc[i].get_pixmap(dpi=300, clip=fitz.Rect(x0, y0, x1, y1))
pm.save(out)
```

1. 텍스트 블록 bbox로 대략의 영역을 잡는다
2. **여유 있게 크롭한다**
3. **이미지를 직접 본다** ← 생략 금지 (PITFALLS A-6)
4. 위/아래에 남의 텍스트가 걸렸으면 좌표를 6~8pt 단위로 깎고 다시 본다

### 정답

- 해설 페이지에서 추출
- **문항의 20% 이상은 직접 재계산해 대조.** 도전 문항은 100%
- 원본 해설의 OCR 깨짐·오탈자를 그대로 옮기지 않는다 (PITFALLS A-8)

---

## 2-2. 제작

### 빌드 스크립트 패턴

문항 데이터를 **파이썬 문자열로 두고 템플릿에 주입**하는 방식이 가장 다루기 쉬웠다.
HTML을 직접 편집하는 것보다 재생성이 쉽고, 오류가 나면 스크립트만 고쳐 다시 돌리면 된다.

```python
import base64, os, re

TPL = '.claude/skills/exam-solution-sheet/reference/template.html'
OUT = '수학익힘책_..._해설.html'

def b64(path):
    return base64.b64encode(open(path,'rb').read()).decode()

def graph(fn, alt):
    return ('<div class="graph-box"><img src="data:image/png;base64,' + b64(fn) +
            '" alt="' + alt + '" style="max-width:100%;height:auto;" /></div>')

PROBLEMS = r"""[
  { id:'u1-b1', level:'basic', levelLabel:'기초', num:1, type:'short',
    subLabel:'유형명', title:'문항 제목',
    question:`<p>...</p>__GRAPH01__`,
    answerText:'\\(9\\)',
    keypoint:'이 문제의 급소 한 줄',
    steps:[ {tag:'STEP 1', title:'...', body:`...`} ] },
]"""

for key, fn, alt in [('__GRAPH01__', 'q01.png', '1번 그림 — 출처 표기')]:
    PROBLEMS = PROBLEMS.replace(key, graph(fn, alt))

html = open(TPL, encoding='utf-8').read()
html = html.replace('const PROBLEMS = [ /* 여기에 문제 객체들을 채운다 */ ];',
                    'const PROBLEMS = ' + PROBLEMS + ';')
# 제목·단원명·문항수·필터 카운트·네비게이션 링크·다운로드 파일명 치환
open(OUT, 'w', encoding='utf-8').write(html)
```

**스크립트는 `scripts/` 에 남긴다.** 재빌드가 필요할 때 다시 돌릴 수 있어야 한다.
(이번에 익힘책 6단원을 각각 `build_XX.py` 로 남겨 두어 수정 재생성이 쉬웠다.)

### 문항 데이터 작성 규칙

| 항목 | 규칙 |
|---|---|
| `type` | `choice`(오지선다) / `short`(단답·서술) |
| 정답 필드 | `choice` → `answer`(0부터 정수) / `short` → `answerText`(문자열) |
| 부등호 | 수식 안에서 **반드시** `\lt` `\gt` `\le` `\ge` |
| 선택지 | **20자 이내.** 길면 `short`로 바꾸고 ①~⑤를 본문에 |
| 그림 | base64 임베드. 외부 참조 금지 |
| `keypoint` | 이 문제의 급소 한 줄. 학생이 "아 그거"라고 할 수 있게 |
| `steps` | STEP 단위. 마지막 STEP에 결론 + `hint`로 흔한 실수 |
| 라벨 | **내부 분류를 화면에 노출하지 않는다** (DECISIONS D-3) |

### 해설 작성 원칙

- **교육과정 안의 도구만 쓴다.** 과목 프로파일의 허용 도구 목록을 따른다
- STEP은 "무엇을 했는가"가 아니라 **"왜 그것을 했는가"**를 적는다
- 마지막에 `hint`로 **가장 흔한 오답 경로**를 명시한다
  > 예: "부호를 무시하면 2/3(변위)이 나옵니다. 거리는 1입니다."
- 계산 단축법이 있으면 정공법과 **나란히** 보여 준다 (신뢰가 생겨야 쓴다)

---

## 2-3. 통합 (모든 단원 완료 후)

이 단계만 모든 단원 결과가 필요하다.

| 대상 | 할 일 |
|---|---|
| 개별 산출물 | 이전/다음 단원 링크 연결. 양 끝은 비활성 표기 |
| 모음 페이지 | "준비 중" → 활성 카드. 문항 수 요약 갱신 |
| 메인 인덱스 | 지정된 위치에 행 삽입 (수업 진행 순서) |
| 교사용 인덱스 | 같은 위치·같은 순서 |
| 교사용 Nav 인덱스 | 독립 행 + `[Nav][해설]` |
| 묶음 PDF | 같은 순서로 섹션 삽입. **합성 충돌 3종 주의** (PITFALLS C) |

### 교사용 사본 만들기

학생용에서 기계적으로 변환한다. 손으로 만들지 않는다.

```python
s = open(student_file, encoding='utf-8').read()
s = s.replace('<title>', '<title>[교사용] ', 1)
s = s.replace(SCHOOL_NAME, '[교사용] ' + SCHOOL_NAME)
s = s.replace(HOME_LINK_STUDENT, HOME_LINK_TEACHER)
for f in ALL_UNITS:                       # 단원 간 링크도 교사용끼리 연결
    s = s.replace(f'href="{student(f)}"', f'href="{teacher(f)}"')
s = re.sub(r"a\.download = '[^']*'", f"a.download = '{teacher_name}'", s)
```

**주의** 교사용 사본은 학생용이 **최종 확정된 뒤에** 만든다.
학생용을 나중에 고치면 사본을 다시 생성해야 한다.

---

## 2-4. 산출물 체크

단원 하나가 끝날 때마다 확인한다. 다 모은 뒤에 확인하면 늦다.

- [ ] 문항 수가 기획안과 일치
- [ ] 난이도 분포가 기획안과 일치
- [ ] 그림 개수가 기획안과 일치
- [ ] 필터 바 카운트가 실제 문항 수와 일치
- [ ] 진행 표시(1 / N)의 N이 맞음
- [ ] 다운로드 파일명이 실제 파일명과 일치
- [ ] 홈·이전·다음 링크가 올바른 대상을 가리킴

→ 여기까지 되면 **3단계 검증**으로 넘어간다. 검증 없이 완료를 보고하지 않는다.
