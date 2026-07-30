---
name: exam-solution-sheet
description: >-
  수능·모의고사·수능특강·교과서 등 한국 고교 수학 문제(PDF/이미지/텍스트)를
  단계별 해설지 단일 HTML로 생성한다. 그림은 캡처하여 base64로 임베드(단일 파일 완결),
  풀이는 STEP 단위로 작성하고 정답·수식·그림 정합성을 검증한다.
  "이 문제로 해설지 만들어줘", "해설 HTML 생성", "수능특강 PDF 해설지화" 등에 사용.
---

# 수학 해설지 생성 (exam-solution-sheet)

한국 고교 수학 문제를 입력받아, **단계별(STEP) 풀이 + 그림 임베드 + 풀이공간 모달**을 갖춘
단일 HTML 해설지를 생성한다. 출력은 `reference/template.html` 골격과 동일한 구조를 따른다.

## 입력
- 수능·모의고사·수능특강·교과서 등 **수학 문제** (PDF, 이미지, 텍스트 중 무엇이든)
- 문제에 그림이 있으면 그림도 함께 (PDF/이미지)

## 출력
- **단일 HTML 파일** 1개 (그림 포함, 외부 의존 없음)
- 파일명: `{과목}_{단원}_해설.html` 형식 (예: `수능특강_미적분I_함수의극한_해설.html`)

---

## 절차 (반드시 순서대로)

### 1. 문제 추출
- PDF/이미지에서 문제를 하나씩 식별: **문제 본문 · 선택지 · 정답 · 그림 · 출처**
- 수식은 모두 KaTeX 인라인 `\( ... \)` / 디스플레이 `\[ ... \]` 로 표기
- 출처(예: "2027 수능특강 수학 II P.5 예제 1")를 주석으로 남긴다

### 2. 그림 처리 — **캡처 후 base64 임베드** (외부파일 X)
- 그림이 있는 문제는 PDF/이미지에서 **해당 그림 영역만 잘라(crop)** 낸다
- 잘라낸 그림을 **base64로 인코딩**해 `<img src="data:image/png;base64,...">` 로 본문에 직접 임베드
  - ❌ `src="images/xxx.png"` 외부 파일 참조 금지 (단일 HTML 원칙 위배)
  - ✅ `<div class="graph-box"><img src="data:image/png;base64,..." style="max-width:100%;height:auto;"></div>`
- 자동 crop 영역이 부정확할 수 있으면 **사용자에게 영역을 확인**받는다 (페이지 전체 이미지를 받았다면 문제별 영역 추정 → 확인)
- 그림이 단순한 좌표평면/도형이면 인라인 **SVG**로 직접 그려도 된다 (좌표 정확성 필수)
- **중요**: 그림이 있는 문제의 정답·STEP 해설은 반드시 **그 그림 기준**으로 작성한다 (그림과 해설이 어긋나면 안 됨)

### 3. 난이도 분류
- `level` / `levelLabel` 부여. 수능특강 관례: `example`(예제) · `exercise`(유제) · `basic`(기초) · `standard`(기본) · `advanced`(실력)
- 문제 묶음의 난이도 흐름이 자연스럽도록 정렬

### 4. 단계별(STEP) 풀이 작성 — 핵심
- 각 문제를 **STEP 1, 2, 3…** 으로 분해. 한 STEP = 한 가지 사고 단위
- 각 STEP: `{tag:'STEP N', title:'...', body:'...HTML...'}`
- 풀이 본문에서 쓰는 CSS 클래스(템플릿에 정의됨):
  - `<div class="calc">계산식</div>` / `<div class="calc purple">강조 계산</div>`
  - `<div class="hint">📌 함정·주의·검토 안내</div>`
  - `<p>설명</p>`
- **정통 풀이 우선** (교육과정 내 도구). 시험 기교는 별해로 분리
- `keypoint`(핵심 개념 한 줄)와 `subLabel`(유형 설명), `title`(문제 제목) 채운다

### 5. 검증 (생략 금지)

**A. 필드·문법 자동 점검** — 아래를 스크립트로 확인한다:
- [ ] **정답 필드명**: `choice`는 `answer`(인덱스), `short`는 **`answerText`**(문자열). 섞이면 정답이 안 보인다
      → `P.filter(p=>p.type==='short' && !p.answerText).length === 0` 이어야 함
- [ ] **정답 정합**: STEP 풀이의 결론 == 정답값
- [ ] **부등호**: `question`·`steps[].body`에 **생( raw ) `<` 가 수식 안에 없는가** (`\lt`/`\gt` 사용)
      → `/\\\(.*?[<>].*?\\\)/` 매칭이 0이어야 함
- [ ] **선택지 길이**: 각 `choices` 항목 20자 이내 (넘치면 `short`로 전환)
- [ ] **수식 짝**: `\(` 개수 == `\)` 개수, 중괄호 균형
- [ ] **그림**: 외부 참조 0 (`src="images/` 금지), base64만
- [ ] `node --check` 로 JS 구문 통과

**B. 렌더 확인 (필수 — 생략하면 위 A를 통과해도 화면이 깨질 수 있다)**
- [ ] Playwright(Chromium 사전 설치됨)로 실제 페이지를 열어 **스크린샷을 찍고 눈으로 확인**한다
- [ ] 확인 항목: ① 문제 본문 수식이 렌더되는가(원시 `\(...\)` 노출 없음) ② 선택지가 한 화면에 들어오는가
      ③ **'정답' 버튼을 눌렀을 때 정답이 실제로 표시되는가** ④ 그림이 보이고 잘림/불필요 영역이 없는가
      ⑤ STEP 배치가 문항마다 일관된가
- [ ] 최소 **선택형 1개 + 단답형 1개 + 그림 있는 문항 1개**는 반드시 렌더 확인

**C. 그림 crop 정확성**
- [ ] 캡처 이미지를 **직접 열어 확인** — 위/아래에 다른 문제의 텍스트가 섞이지 않았는지
- [ ] 섞였으면 crop 좌표를 조정해 다시 캡처 (문제 본문 텍스트는 제외, 그래프만)

**D. 교육과정 적합**
- [ ] 풀이에 쓴 도구가 해당 과목 교육과정 내인가 (예: 2026 수학I에서 내적·삼각함수 합성 등 범위 외 금지)
- 가능하면 에이전트로 교차 검수:
  - `problem-evaluator` (난이도·핵심개념·실수포인트)
  - `worksheet-auditor` (HTML/수식/링크 정합성, 최종 단계)
- **불확실한 부분**(자동 crop 영역, 출처 추정, 정답 등)은 HTML 주석 `<!-- ⚠️ 검토 필요: ... -->` 로 표시해 사용자 확인을 유도한다

### 6. 템플릿 주입 → 출력
- `reference/template.html` 을 골격으로 복사
- `const PROBLEMS = [ ... ];` 자리에 작성한 문제 객체 배열을 채운다
- `<title>` 을 `{과목} · {단원} — 단계별 해설` 로 설정
- head의 CSS/JS(풀이공간 모달, KaTeX 렌더, 난이도 필터 등)는 **그대로 유지** — 손대지 않는다

---

## PROBLEMS 객체 스키마

`reference/example_problems.js` 에 실제 작성 예시(choice형·short형)가 있다. 구조:

```js
// 선택형(choice) — answer = 정답 인덱스(0부터)
{
  id: 'c1-e1',                 // 고유 ID: {단원코드}-{유형}{번호}
  level: 'example',            // basic|example|exercise|standard|advanced
  levelLabel: '예제',          // 기초|예제|유제|기본|실력
  num: 1,                      // 표시 번호
  type: 'choice',
  subLabel: '함수의 우극한과 좌극한 · 그래프형',  // 유형 설명
  title: '함수 y=f(x)의 그래프 좌·우극한',        // 문제 제목
  question: `<p>...문제 본문 (수식 \\(...\\), 그림 <img base64>)...</p>`,
  choices: ['\\(-2\\)','\\(-1\\)','\\(0\\)','\\(1\\)','\\(2\\)'],
  answer: 0,                   // ← choice는 answer(인덱스)만. answerText 불필요
  keypoint: '우극한·좌극한은 ...핵심 한 줄',
  steps: [
    {tag:'STEP 1', title:'...', body:`<p>...</p><div class="calc purple">\\(...\\)</div>`},
    {tag:'STEP 2', title:'...', body:`...`}
  ]
}

// 단답형(short) — answerText = 정답 문자열 (KaTeX 표기)
{
  id: 'c1-b1', level: 'basic', levelLabel: '기초', num: 2,
  type: 'short',
  subLabel: '...', title: '...',
  question: `<p>...</p>`,
  answerText: '\\(2\\)',       // ← short는 반드시 answerText. answer 아님!
  keypoint: '...',
  steps: [ ... ]
}
```

### ⚠️ 필드명 규칙 (틀리면 정답이 화면에 안 나옴)
| 유형 | 정답 필드 | 예 |
|---|---|---|
| `choice` | **`answer`** (0부터의 인덱스) | `answer: 3` → ④ |
| `short` | **`answerText`** (KaTeX 문자열) | `answerText: '\\(\\frac{1}{2}\\)'` |

`short`에 `answer`를 쓰면 템플릿이 `problem.answerText`를 읽으므로 **정답 칸이 빈 채로 표시**된다.
정답이 여러 개면 한 문자열로: `answerText: '\\(a=-2,\\ b=-2\\)'`

### ⚠️ 부등호는 `\lt` / `\gt` 로 쓴다 (필수)
`question`·`steps[].body`는 `innerHTML`로 삽입되므로, 수식 안의 `<`·`>`가 **HTML 태그로 파싱되어 수식이 깨진다.**

```
❌ \\(3-\\frac{5}{x}<f(x)<3+\\frac{10}{x}\\)      → 태그로 먹혀 사라짐
✅ \\(3-\\frac{5}{x}\\lt f(x)\\lt 3+\\frac{10}{x}\\)
✅ \\(x\\gt 0\\) / \\(x\\le 1\\)은 \\(\\le\\) 그대로 사용 가능
```

### ⚠️ 선택지(choices)는 짧게 — 5열 그리드
`.choices`는 `grid-template-columns:repeat(5,1fr)` 고정이다. 항목이 길면 **옆으로 넘쳐 잘린다.**
- 각 항목 **20자 이내**를 목표로 한다 (원본 해설지 실측 최대 17자)
- 선택지가 긴 수식·문장이면 `type:'short'`로 바꾸고, 선택지 내용을 `question` 본문의 목록으로 옮긴다
  (예: "다음 중 옳지 않은 것은?" + ①~⑤를 `<div class="calc">` 목록으로 나열 → `answerText:'④'`)

### 기타 규칙
- 모든 수식은 KaTeX 표기. JS 템플릿 문자열 안에서는 백슬래시를 `\\(` `\\)` 처럼 이스케이프
- `question`·`steps[].body` 는 HTML 문자열 (백틱 템플릿 리터럴 사용)
- 그림은 question 안에 `<div class="graph-box"><img src="data:image/png;base64,..."></div>`
- `keypoint`·`subLabel`·`title`에는 **긴 수식을 넣지 않는다** (레이아웃 깨짐)

---

## 산출물 점검 (마무리)
- 단일 HTML 파일을 브라우저로 열었을 때: 문제·그림·STEP·정답·풀이공간 모달이 모두 동작
- 그림이 외부 파일이 아니라 **base64로 임베드**되어 파일 하나로 완결되는지 확인
- `node --check` 로 PROBLEMS 포함 스크립트의 JS 구문 통과 확인
- 검증 체크리스트(5단계) 통과 + 불확실 항목 주석 표시 완료
- 사용자에게 **검토가 필요한 항목**(그림 영역, 정답 확신도 등)을 명시적으로 안내

## 참고 파일
- `reference/template.html` — 골격 (head CSS/JS + 빈 PROBLEMS). 이걸 복사해 PROBLEMS만 채운다
- `reference/example_problems.js` — 작성된 문제 객체 예시 (choice·short)
