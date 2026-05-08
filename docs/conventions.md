# Conventions — 명명·스타일·검수 체크리스트

> 모든 변경에 적용되는 **컨벤션**. 위반 시 PR에서 거부될 수 있습니다.

---

## 1. 파일명 규칙

### 1.1 학습지
```
학습지_NN_주제명.html
```
- `NN`: **두 자리** 숫자 (`01`, `02`, ..., `18`). 한 자리는 절대 사용 X
- `주제명`: 한글 가능, 공백 X (필요 시 언더스코어 또는 그대로 붙여 쓰기)
- 예: `학습지_06_등차수열.html`, `학습지_10_중단원마무리_III_1.html`

### 1.2 해설 SPA
```
수능특강_과목명_단원이름_해설.html
```
- 예: `수능특강_수학I_사인법칙코사인법칙_해설.html`
- 2학기는 `수능특강_미적분I_*_해설.html` 형식 권장

### 1.3 도구
- 짧은 한글 명사: `뽑기.html`, `중간고사_자기평가성찰지.html`
- 새 도구 추가 시 카테고리 접두사 권장 (`도구_타이머.html` 등)

### 1.4 외부 자산
- JS: 기능명-widget.js (예: `timer-widget.js`)
- CSS: 별도 파일 만들지 X (인라인 또는 JS 자체 주입)
- 이미지: `images/` 폴더, 영문 소문자·하이픈

---

## 2. window.name 명명

| 종류 | 패턴 | 예 |
|---|---|---|
| 메인 | `aftermath_main` | (단일) |
| 학습지 | `aftermath_ws_NN` | `aftermath_ws_07` |
| 수능특강 해설 | `aftermath_sol_<짧은이름>` | `aftermath_sol_seq` |
| 도구 | `aftermath_<짧은이름>` | `aftermath_picker`, `aftermath_selfeval` |

⚠️ **새 페이지 만들 때 반드시 `window.name` 등록 + `index.html`의 `target` 추가**.

---

## 3. CSS 클래스 명명

### 3.1 학습지 (Tailwind + 커스텀)
- **Tailwind 우선**: 가능한 만큼 Tailwind 유틸리티로
- **커스텀 클래스**: 의미 단위로만 (예: `.card`, `.section-title`, `.reveal-box`)
- BEM 미사용. 단순 의미 클래스.
- 자주 쓰는 모듈은 `<style>` 블록에 정의 (각 학습지 자급자족)

### 3.2 해설 SPA (디자인 시스템)
- **CSS 변수 우선** (`--color-primary` 등)
- 의미 단위 클래스 (예: `.problem-card`, `.step-btn`, `.formula-box.highlight-blue`)
- 변경자(modifier)는 `.element.modifier` 패턴 (예: `.step-btn.active`)
- BEM-ish 허용하지만 강제 아님

### 3.3 timer-widget.js (외부 JS)
- 충돌 방지 위해 **모든 클래스 prefix `aftermath-timer-`** 필수
- 예: `.aftermath-timer-toggle`, `.aftermath-timer-panel`

---

## 4. JavaScript 컨벤션

### 4.1 모듈화
- **인라인 우선**. 외부 JS는 다중 페이지 공유 시에만 (현재 `timer-widget.js` 1개)
- 외부 JS는 IIFE로 격리, 전역 오염 방지
- 중복 로드 방지 가드: `if (document.getElementById('...')) return;`

### 4.2 변수
- `const` 우선, `let` 다음, `var` 사용 X
- 전역 변수는 의미 있는 명사 (예: `PROBLEMS`, `currentIdx`, `stepState`)

### 4.3 함수
- camelCase
- 상태 변경 동사 (예: `showSteps`, `revealAnswerOnly`, `applyFilter`)
- 순수 함수는 명사 또는 변환 동사 (예: `formatTime`, `renderCard`)

### 4.4 이벤트 핸들러
- `document.addEventListener('keydown', e => {...})` 형태
- IME 충돌 방지: `if (e.isComposing) return;`
- 입력 필드 보호: `if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;`

### 4.5 KaTeX 렌더링
```js
katex.renderToString(math, { throwOnError: false, displayMode: false });
```
- `throwOnError: false` 필수 (사용자 입력 수식 보호)

---

## 5. 한국어 텍스트 검수

### 5.1 자주 발생하는 오타
| 잘못 | 올바름 | 위치 |
|---|---|---|
| 턱치 | 터치 | scratch-label |
| 풀이공간 | 풀이 공간 | 띄어쓰기 |
| 카운터다운 | 카운트다운 | 외래어 |
| 인쇄에 | 인쇄해 | 동사 활용 |

### 5.2 외래어 표기
- "노트", "마우스", "스크롤" — 표준 한국어
- "Pencil"(애플 펜슬은 영문 그대로) vs "펜"

### 5.3 수식 한국어
- $a_n = a_1 + (n-1)d$ — 변수는 영문 수식, 변수 설명은 한글
- "이때, $\frac{1}{2}$ 입니다" — 수식 앞뒤 한 칸 띄움 (가독성)

---

## 6. KaTeX vs MathJax 선택

| 페이지 | 엔진 | 이유 |
|---|---|---|
| 학습지 | MathJax 3 (CDN) | 인쇄 호환성·접근성 우수, 일반 학습용 |
| 수능특강 해설 SPA | KaTeX (인라인) | 빠름, 동적 렌더링 적합, 오프라인 OK |
| 자기평가성찰지 | MathJax | 학습지 패턴 따름 |

⚠️ **한 페이지 안에서 둘을 혼용하지 마세요.**

---

## 7. 인쇄 호환성 체크

### 7.1 새 컴포넌트 추가 시
- [ ] `.no-print` 적절히 표기 (네비·토글·타이머)
- [ ] `@media print` 블록에서 색상·폰트 크기·여백 명시
- [ ] `page-break-inside: avoid` (큰 박스)
- [ ] `box-shadow: none` (인쇄 잉크 절약)
- [ ] 다크모드 색상 → 화이트 배경에 검정 텍스트

### 7.2 timer-widget.js
이미 `display: none !important` 처리됨. 변경 X.

---

## 8. 새 페이지 추가 체크리스트

### 8.1 학습지
- [ ] 파일명 규칙 `학습지_NN_*.html`
- [ ] `<title>` 명확
- [ ] `<meta charset="UTF-8">` `<meta name="viewport">`
- [ ] `<script>window.name = 'aftermath_ws_NN';</script>` (head)
- [ ] MathJax 설정 블록
- [ ] `<script id="MathJax-script" async ...>` 로드
- [ ] Tailwind CDN 로드
- [ ] Noto Sans KR 폰트 로드
- [ ] 다크모드 CSS (각 학습지 자체)
- [ ] 헤더에 단원·차시 표시
- [ ] 메인 nav (target="aftermath_main") + 차시 이동 nav
- [ ] `<body class="...mathjax-process">`
- [ ] `GOOGLE_FORM_BASE_URL` + `LESSON_NAME` 상수
- [ ] H/Esc 단축키 (`window.open + focus`)
- [ ] `<script src="timer-widget.js" defer></script>` (body 끝)
- [ ] index.html의 해당 단원 섹션에 카드 추가 (`target="aftermath_ws_NN"`)

### 8.2 해설 SPA
- [ ] 파일명 `수능특강_*_해설.html`
- [ ] `window.name = 'aftermath_sol_<short>';`
- [ ] KaTeX 인라인 (기존 해설지에서 그대로 복사)
- [ ] CSS 변수 시스템 그대로 유지
- [ ] `PROBLEMS` 배열 정의 (스키마는 `architecture.md` 참조)
- [ ] 헬퍼 함수 그대로 (`showSteps`, `highlightAnswer`, `revealAnswerOnly` 등)
- [ ] 단축키 (←→↑↓ / 1~5 / 0 / A / H / Esc)
- [ ] `lesson-nav-bar` 차시 이동
- [ ] 인쇄 영역 (`.print-area`)
- [ ] index.html에 카드 추가 (`target="aftermath_sol_xxx"`)

### 8.3 새 도구 (선택)
- [ ] 의미 있는 짧은 한글 파일명
- [ ] `window.name = 'aftermath_<short>';`
- [ ] 메인 nav + H 단축키
- [ ] 다크모드 지원
- [ ] index.html "수업 도구" 섹션에 추가

---

## 9. 커밋 메시지 컨벤션

### 9.1 형식
```
<type>(<scope>): <subject>

<body>
```

### 9.2 type
- `feat`: 새 기능
- `fix`: 버그 수정
- `docs`: 문서만
- `refactor`: 동작 동일, 구조만 변경
- `style`: 코드 스타일·들여쓰기·세미콜론 (기능 영향 X)
- `chore`: 빌드·설정·일상 작업

### 9.3 scope (선택)
- `(메인)`, `(학습지)`, `(수능특강)`, `(뽑기)`, `(타이머)`, `(인쇄)`, `(다크모드)`

### 9.4 예
```
feat(수능특강): 정답 자동 highlight 분리 + 오타 수정
fix(학습지): 차시 이동 시 window.name 갱신
docs: CLAUDE.md 안티패턴 섹션 추가
refactor(타이머): timer-widget.js로 외부 JS 추출
```

---

## 10. PR 본문 양식

```md
## Summary
- 한두 줄 핵심 변경
- 배경/이유

## Test plan
- [ ] 검증 항목 1
- [ ] 검증 항목 2
...

## 회귀
- [ ] 기존 기능 X 정상
...

## 후속 (선택)
- 다음에 할 작업 후보
```

---

## 11. 🚫 금지 사항 정리

- ❌ `<canvas>` 그리기 API 사용 (`.scratch-overlay-canvas` 진짜로 만들기)
- ❌ Service Worker / PWA / IndexedDB
- ❌ TypeScript / 빌드 도구 (Webpack, Vite 등)
- ❌ React / Vue / 프레임워크
- ❌ npm install / package.json
- ❌ 학습지에 진짜 정답 노출 (운영 의도)
- ❌ 차시 이동을 명명 윈도우로 (학습 흐름 끊김)
- ❌ 한 페이지에 MathJax + KaTeX 혼용
- ❌ 외부 종속 JS 라이브러리 (필요 시 사용자 컨펌)
- ❌ `--no-verify`, `--force` push (사용자 명시 요청 시만)

---

## 12. ✅ 권장 사항

- ✅ 변경은 작게, PR도 작게
- ✅ 작업 시작 전 사용자에게 의도 한 번 확인
- ✅ 큰 변경 (10+ 파일)은 한 파일 시범 후 일괄
- ✅ sed/awk 일괄 처리 적극 활용 (주의: escape)
- ✅ 새 패턴 도입 시 CLAUDE.md 업데이트
- ✅ 새 컨벤션 도입 시 conventions.md 업데이트

---

*작성: 2026-05-08*
