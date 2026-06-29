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
다음을 **반드시** 자체 점검한다:
- [ ] **정답 정합**: 작성한 STEP 풀이의 결론 == `answer` (선택형이면 인덱스, 단답형이면 값)
- [ ] **수식 유효성**: 모든 `\(...\)` / `\[...\]` 가 KaTeX로 렌더 가능한 문법인가 (백슬래시 이스케이프, 중괄호 짝)
- [ ] **그림 정합**: 그림 기준으로 좌표·값·해설이 일치하는가
- [ ] **교육과정 적합**: 풀이에 쓴 도구가 해당 과목 교육과정 내인가 (예: 2026 수학I에서 내적·삼각함수 합성 등 범위 외 도구 사용 금지)
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
{
  id: 'c1-e1',                 // 고유 ID: {단원코드}-{유형}{번호}
  level: 'example',            // basic|example|exercise|standard|advanced
  levelLabel: '예제',          // 기초|예제|유제|기본|실력
  num: 1,                      // 표시 번호
  type: 'choice',              // 'choice'(선택형) | 'short'(단답형)
  subLabel: '함수의 우극한과 좌극한 · 그래프형',  // 유형 설명
  title: '함수 y=f(x)의 그래프 좌·우극한',        // 문제 제목
  question: `<p>...문제 본문 (수식 \\(...\\), 그림 <img base64>)...</p>`,
  choices: ['\\(-2\\)','\\(-1\\)','\\(0\\)','\\(1\\)','\\(2\\)'],  // choice일 때만
  answer: 0,                   // choice: 정답 인덱스(0부터) / short: 정답 값(문자열/숫자)
  keypoint: '우극한·좌극한은 ...핵심 한 줄',
  steps: [
    {tag:'STEP 1', title:'...', body:`<p>...</p><div class="calc purple">\\(...\\)</div>`},
    {tag:'STEP 2', title:'...', body:`...`}
  ]
}
```

규칙:
- 모든 수식은 KaTeX 표기. JS 템플릿 문자열 안에서는 백슬래시를 `\\(` `\\)` 처럼 이스케이프
- `question`·`steps[].body` 는 HTML 문자열 (백틱 템플릿 리터럴 사용)
- 그림은 question 안에 `<div class="graph-box"><img src="data:image/png;base64,..."></div>`

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
