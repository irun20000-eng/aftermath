# Aftermath — 대수 수업 학습 자료 사이트

> **2026학년도 고등학교 대수·미적분 수업용 정적 HTML 사이트.**
> GitHub Pages 배포. 브라우저만 있으면 열림.

이 문서는 **다음 작업자(또는 다음 Claude 세션)** 가 처음 읽는 첫 컨텍스트입니다. 시작하기 전 반드시 끝까지 읽어주세요.

---

## 🎯 운영 의도 — 가장 중요

**수업 중 활용 > 학생 배포.**

- 교사가 메인 페이지(`index.html`)를 띄워놓고 학생들과 함께 보는 흐름.
- 한 페이지에서 모든 자료(학습지·해설·뽑기·타이머·전자책)로 진입.
- 학습지 18개는 인쇄 배포 가능하지만, 점차 메인 페이지 운영 중심으로 발전 중.
- 1학기 대수가 정착됐으니 **2학기 미적분I**도 같은 시스템으로 확장 예정.

---

## ⚠️ 안티패턴 — 절대 하지 말 것

UX 리뷰에서 자주 나오는 잘못된 권유들. 의도된 설계를 망가뜨리지 마세요.

### 1. "풀이 공간(.scratch-overlay-canvas)을 진짜 `<canvas>`로 만들자"
**❌ 금지.** 격자 배경 div는 의도된 디자인.
- 실제 사용 흐름: 교사가 **전자칠판**에서 활용 (분필/터치펜으로 학생 앞에서 직접 풀이)
- 학생이 손으로 그리는 기능은 필요 X
- "가짜 캔버스" 비판은 자기주도 학습 시나리오 가정의 오해

### 2. "학습지 정답·해설을 인라인 reveal로 추가"
교사 운영 의도와 충돌. 학생 자기학습 모드는 우선순위 낮음.
변경 전 사용자 의사 확인 필수.

### 3. "차시 이동을 명명 윈도우로 변경"
같은 탭에서 자연스럽게 이어가야 함. 현재 동작 유지.

### 4. "학습지 인쇄에 학생용/교사용 토글"
당장 필요 없음. 사용자가 별도 요청하면 그때 진행.

### 5. "Service Worker / PWA 도입"
정적 HTML이라는 단순함이 미덕. 복잡도 추가하지 말 것.

---

## 📁 디렉토리 구조

```
aftermath/
├── index.html                          # 메인 대시보드 (수업 진행 허브)
├── timer-widget.js                     # 학습지용 floating 타이머 (외부 JS)
│
├── 학습지_01~18_*.html                 # 1학기 대수 학습지 18개
├── 수능특강_수학I_*_해설.html          # 수능특강 해설 SPA 3개
│   ├── 사인법칙코사인법칙_해설         # II-2
│   ├── 등차수열등비수열_해설           # III-1
│   └── 수열의합귀납법_해설             # III-2/3
│
├── 뽑기.html                           # 학생 모둠 추첨 도구
├── 중간고사_자기평가성찰지.html        # 시험 후 메타인지 회고지
│
├── images/                             # 이미지 자산
├── docs/
│   ├── architecture.md                 # 상세 구조·데이터·헬퍼 카탈로그
│   └── conventions.md                  # 파일명·클래스·체크리스트
└── .claude/
    └── agents/
        └── worksheet-builder.md        # 새 학습지 제작 서브에이전트
```

---

## 🧱 핵심 패턴 카탈로그

### A. 명명 윈도우 탭 재활용
모든 페이지는 로드 시 자기 이름을 자동 등록.

```html
<head>
  <script>window.name = 'aftermath_ws_01';</script>
</head>
```

| 페이지 | window.name |
|---|---|
| index.html | `aftermath_main` |
| 학습지_NN_*.html | `aftermath_ws_NN` |
| 뽑기.html | `aftermath_picker` |
| 중간고사_자기평가성찰지 | `aftermath_selfeval` |
| 수능특강 사인코사인 / 등차등비 / 합귀납법 | `aftermath_sol_sin` / `_seq` / `_sum` |

링크는 `target="aftermath_xxx"`로 → 같은 이름 탭 있으면 그쪽 포커스, 없으면 새 탭.

**예외**: 차시 이동(이전/다음 학습지)은 **target 없이** 같은 탭에서 이동 (학습 흐름 유지).

### B. 단축키 (전역 또는 페이지별)

| 키 | 페이지 | 동작 |
|---|---|---|
| `H` `Esc` | 학습지·해설·뽑기·자기평가 | 메인으로 (또는 메인 탭 포커스) |
| `←` `↑` | 해설 SPA | 이전 문제 |
| `→` `↓` | 해설 SPA | 다음 문제 |
| `1`~`5` | 해설 SPA | 해당 STEP 토글 (펼침/닫힘) |
| `0` | 해설 SPA | 모든 STEP 닫고 초기화 |
| `A` | 해설 SPA | 정답 선지 강조 (수동 reveal) |
| `Space` | index.html | 메인 타이머 시작/정지 |

`INPUT/TEXTAREA` 안에서는 무시 (`e.isComposing` + `tagName` 체크).

### C. STEP 독립 토글 모드 (해설 SPA)
- `stepState[pid]` = `Set<stepNum>` (펼친 STEP 번호들)
- 각 STEP 버튼 = 독립 토글 (펼침 ↔ 닫힘), 누적 X
- "STEP 2만 따로" 가능
- `0` 또는 "초기화" 버튼 = 모두 닫고 부수 상태(빈칸·정답 선지 강조) 리셋

### D. 정답 수동 reveal
- 마지막 STEP 누른다고 정답 자동 표시 ❌
- 별도 **"정답" 버튼** (녹색) 또는 **A키** → 선지에 형광펜
- 학생이 자기 답 정해본 후 의식적으로 확인하는 흐름

### E. floating 타이머 (timer-widget.js)
- 학습지에만 적용 (해설지·뽑기·자기평가는 제외)
- `<script src="timer-widget.js" defer></script>` 한 줄로 사용
- 자체적으로 CSS·DOM·JS 주입. 중복 로드 방지.
- 우측 하단 원형 버튼 → 클릭으로 패널 펼침/접기
- 카운트다운만 (스톱워치 아님), 프리셋 1·3·5·10분
- 각 페이지 독립 (페이지 이동 시 리셋)

### F. 진도 체크 + 다크모드 (localStorage)

| 키 | 값 |
|---|---|
| `aftermath_progress` | `{ "학습지_01_사인법칙.html": true, ... }` (JSON) |
| `aftermath_theme` | `'dark'` 또는 빈 값 |

다크모드는 FOUC 방지 위해 `<head>` 첫 스크립트에서 즉시 적용.

### G. 수학 렌더링
- **학습지**: MathJax 3 (CDN)
- **해설 SPA**: KaTeX (인라인 base64 폰트 임베드 — 오프라인 OK)
- 둘을 혼용하지 말 것 (페이지 단위로 일관)

### H. Google Form 자동 링크 (학습지)
각 학습지 head에:
```js
const GOOGLE_FORM_BASE_URL = "https://docs.google.com/forms/.../viewform?usp=pp_url&entry.234011956=";
const LESSON_NAME = "01차시 사인법칙";
const GOOGLE_FORM_URL = GOOGLE_FORM_BASE_URL + encodeURIComponent(LESSON_NAME);
```
QR 코드 + "성찰지 제출" 버튼이 이 URL을 사용.

---

## 🚀 새 학습지 추가 빠른 가이드

상세는 `docs/architecture.md`와 `.claude/agents/worksheet-builder.md` 참조. 요약:

1. **파일명**: `학습지_NN_주제.html` (NN은 두 자리 숫자, 한글 파일명 OK)
2. **템플릿 출처**: 같은 유형의 기존 학습지 복사
   - 일반 차시 → `학습지_01_사인법칙.html`
   - 중단원 마무리 → `학습지_04_중단원마무리.html`
   - 대단원 평가 → `학습지_05_대단원평가.html`
3. **수정해야 할 곳**:
   - `<title>`
   - `window.name = 'aftermath_ws_NN'`
   - 헤더의 단원·차시명
   - 차시 이동 nav (이전·다음 차시 href)
   - `LESSON_NAME` 상수
   - 본문 섹션 (생각 열기 / 개념 / 훈련 / Exit Ticket)
4. **불변 요소** (절대 빼지 말 것):
   - MathJax 설정 블록
   - `<script src="timer-widget.js" defer></script>` (학습지에만)
   - 메인 버튼 `target="aftermath_main"`
   - 다크모드 CSS (학습지엔 자체 다크 적용)
5. **메인 등록**: `index.html`의 해당 단원 섹션에 카드 추가, `target="aftermath_ws_NN"`

---

## 🚀 새 해설 SPA 추가 빠른 가이드

1. **파일명**: `수능특강_과목명_단원이름_해설.html`
2. **템플릿 출처**: 가장 비슷한 기존 해설지 복사 (보통 `등차수열등비수열_해설.html`)
3. **수정**:
   - `<title>`, `window.name`
   - `차시 이동` nav (lesson-nav-bar)
   - **`PROBLEMS` 배열 전체 교체** (이게 가장 큰 작업)
   - 메인의 수능특강 섹션 카드 추가
4. **PROBLEMS 객체 스키마**: `docs/architecture.md` 참조

---

## ✅ 검증 체크리스트 (모든 변경 후 필수)

- [ ] **MathJax/KaTeX 렌더 정상** — `\(...\)` 또는 `$...$` 수식이 깨지지 않는지
- [ ] **다크모드 정상** — 시스템 설정 또는 토글 버튼
- [ ] **H/Esc 단축키** → 메인 탭으로 이동 (또는 새 탭)
- [ ] **차시 이동** → 같은 탭에서 다음 차시 로드
- [ ] **메인에서 같은 페이지 재클릭** → 기존 탭 재활용 (탭 폭발 X)
- [ ] **인쇄 미리보기** → no-print 클래스 요소 안 보이는지
- [ ] **모바일 폭(<768px)** → 5지선다 2칸, 레이아웃 안 깨짐
- [ ] **콘솔 에러 없음** — `Cannot read properties of null` 등
- [ ] **timer-widget.js 로드** (학습지일 때) — 우측 하단 ⏱ 버튼 보임
- [ ] **오타 점검** — 한글 (특히 "터치"·"풀이" 등 자주 쓰는 단어)

---

## 🔄 작업 흐름

### 브랜치
- `main` — 배포 브랜치 (GitHub Pages)
- `claude/...` — 작업 브랜치 (PR로 main에 머지)

### 커밋 메시지 컨벤션
- `feat:` 새 기능
- `fix:` 버그 수정
- `docs:` 문서만 변경
- `refactor:` 동작 동일, 구조만 변경
- `feat(수능특강):` 또는 `fix(학습지):` 처럼 스코프 명시 권장

### PR 머지
- 리뷰 코멘트 응답 후 머지
- 머지 후 작업 브랜치는 보존 (재사용)

---

## 🤖 서브에이전트 사용

`.claude/agents/worksheet-builder.md` 정의됨.

```
Agent(
  description="새 학습지 1차시 생성",
  subagent_type="worksheet-builder",
  prompt="..."
)
```

호출 시 자동으로 학습지 패턴을 따라 새 파일을 만듦. 자세한 입력 스펙은 에이전트 정의 파일 참조.

---

## 🆘 도움이 필요할 때

- **사이트 구조 의문** → `docs/architecture.md`
- **명명/스타일 규칙** → `docs/conventions.md`
- **새 학습지 만들기** → `worksheet-builder` 서브에이전트
- **PR 검토** → `/ultrareview` (사용자 명령)

---

## 📜 변경 이력 (주요 PR)

| PR | 핵심 |
|---|---|
| #9 | 자체 SPA → body scroll 변환 (PC/태블릿 스크롤 정상화) |
| #10 | 명명 윈도우 탭 재활용 + 초기화 글자색 잔존 픽스 |
| #11 | 정답 분리·STEP 토글·5지선다 모바일 그리드·오타 수정 |
| #12 | 학습지 floating 카운트다운 타이머 (timer-widget.js 신설) |

---

*작성: 2026-05-08 1학기 머지 후 인계 시점*
