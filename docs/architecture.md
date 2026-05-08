# Architecture — 페이지·데이터·헬퍼 카탈로그

> CLAUDE.md의 보조 문서. **세부 구조 참조용**입니다.

---

## 1. 페이지 카탈로그

| 파일 | 유형 | 핵심 |
|---|---|---|
| `index.html` | 메인 대시보드 | 진도·다크모드·메인 타이머·외향 링크 허브 |
| `학습지_01~03_*.html` | 일반 차시 | 개념·예제·연습·Exit Ticket |
| `학습지_04_중단원마무리.html` | 중단원 마무리 | 개념 구조화 + 실전 훈련 |
| `학습지_05_대단원평가.html` | 대단원 평가 | 모의고사 풀이 |
| `학습지_06~09_*.html` | 일반 차시 | 등차·등비 |
| `학습지_10_중단원마무리_III_1.html` | 중단원 마무리 | III-1 정리 |
| `학습지_11~13_*.html` | 일반 차시 | 수열의 합 |
| `학습지_14_중단원마무리_III_2.html` | 중단원 마무리 | III-2 정리 |
| `학습지_15~16_*.html` | 일반 차시 | 귀납적 정의·수학적 귀납법 |
| `학습지_17_중단원마무리_III_3.html` | 중단원 마무리 | III-3 정리 |
| `학습지_18_대단원평가_III.html` | 대단원 평가 | III 종합 |
| `수능특강_수학I_*_해설.html` | 해설 SPA | 수능특강 단원별 단계별 풀이 |
| `뽑기.html` | 도구 | 학생 모둠 추첨 (반별 1·4·7·10) |
| `중간고사_자기평가성찰지.html` | 시험 회고 | 문항별 자기 채점 + 단원별 성취도 |
| `timer-widget.js` | 공유 JS | 학습지용 floating 카운트다운 |

---

## 2. 학습지 4가지 유형

### 2.1 일반 차시 (가장 많음)
**섹션 순서**:
1. `00. 생각 열기 (Warm-up & Connection)` — 흥미 발문 + 이전 차시 복습
2. `01. 개념 구성 (Concept)` — 정의·정리·증명. 검은 배경 강조 박스
3. `02. 예제·훈련` — `.reveal-box` 답 토글로 단계별 풀이
4. `03. 형성평가` — Google Form 연동 객관식
5. `04. Exit Ticket` — 메타인지 회고 (자기평가 + 성찰 텍스트)

**대표 파일**: `학습지_01_사인법칙.html`, `학습지_06_등차수열.html`

### 2.2 중단원 마무리
**섹션**:
1. `00. 단원 개념 구조화` — 마인드맵·핵심 정리
2. `01. 실전 훈련` — 교과서·기출 선별 문항

**대표**: `학습지_04_중단원마무리.html`

### 2.3 대단원 평가
**섹션**:
1. `00. 배경 — 시험·실전 안내`
2. `01. 실전 모의고사 풀이` — 다수 문항

**대표**: `학습지_18_대단원평가_III.html`

### 2.4 시험 성찰 (단일)
**섹션** (자기평가성찰지):
1. `00. 시험 개관`
2. `01. 문항별 자기 채점` (O/△/X → 자동 점수 합산)
3. `02. 단원별 성취도`
4. `03~06. 오답 유형 / 성장 기록`

---

## 3. 학습지 공통 컴포넌트

### 3.1 마크업 클래스
| 클래스 | 용도 |
|---|---|
| `.card` | 섹션 래퍼 (white·rounded·shadow) |
| `.section-title` | 섹션 제목 (large·bold + 하단 보더) |
| `.reveal-box` + `.ans` | 답 토글 버튼 (기본 `?`, `.active` 시 답 표시) |
| `.thinking-space` | 자작 공간 (점선 보더 + `::before` 라벨) |
| `.badge-l1/l2/l3` | 난이도 배지 (초록/황색/빨강) |
| `.hint-box` | 힌트박스 (좌측 6px 황색 보더) |
| `.no-print` | 인쇄 시 숨김 |
| `.mathjax-process` | MathJax 처리 대상 (body) |
| `.mathjax-ready` | MathJax 로드 완료 (FOUC 방지) |

### 3.2 답 토글 JS (학습지 공용)
```js
function toggleReveal(el) {
  el.classList.toggle('active');
}
```

### 3.3 Tailwind 사용
- `grid grid-cols-1 md:grid-cols-N gap-6` (반응형)
- `bg-gradient-to-br from-X-50 to-Y-50` (섹션별 배경)
- `border-l-[8px] border-COLOR` (섹션 좌측 강조선)

---

## 4. 해설 SPA 데이터 스키마

### 4.1 PROBLEMS 배열
파일 상단 `<script>` 안에 정의된 전역 배열. 한 객체가 한 문제.

```js
const PROBLEMS = [
  {
    id: 's4-b1',                // 유일 ID. 's<단원번호>-<레벨첫글자><번호>'
    level: 'basic',             // 'basic'|'example'|'exercise'|'standard'|'advanced'
    levelLabel: '기초',          // 한글 레벨명
    num: 1,                     // 레벨 내 일련번호
    type: 'choice',             // 'choice' | 'short'
    question: '...',            // HTML 가능 (KaTeX `$...$`, <img>, <br> 등)

    // type === 'choice'일 때:
    choices: ['$x$', '$y$', ...],  // 5개 (KaTeX 가능)
    answer: 0,                     // 정답 인덱스 (0-based)

    // type === 'short'일 때:
    // (choices/answer 생략, 답안은 풀이 내 .blank-btn으로 표시)

    steps: [
      {
        tag: 'STEP 1',          // 단계 태그 (보통 'STEP N')
        title: '풀이 방향',       // 단계 제목
        body: `<p class="step-hint">...</p>
               <div class="formula-box highlight-blue">...</div>
               <div class="calc-line">...</div>
               <span class="blank-wrap">
                 <button class="blank-btn" data-answer="$x = 5$">
                   <span class="blank-placeholder">?</span>
                   <span class="blank-answer"></span>
                 </button>
               </span>
               <div class="answer-reveal">정답: ① $5$</div>`
      },
      // ... 더 많은 STEP
    ]
  },
  // ... 더 많은 문제
];
```

### 4.2 step.body 안의 컴포넌트 클래스

| 클래스 | 용도 |
|---|---|
| `.formula-box.highlight-blue/green/yellow` | 공식 박스 (좌측 4px 보더) |
| `.calc-line` | 계산 줄 (flex, gap) |
| `.blank-wrap` + `.blank-btn` | 클릭으로 reveal되는 빈칸 (KaTeX 자동 렌더) |
| `.calc-tip` | 경고/팁 박스 (빨강) |
| `.key-concept` | 핵심 개념 박스 (파랑) |
| `.answer-reveal` | 결론 정답 박스 (초록) |

### 4.3 빈칸 버튼 동작
```js
function revealBlank(btn) {
  btn.classList.add('revealed');  // .blank-placeholder 숨기고 .blank-answer 표시
  // data-answer의 KaTeX `$...$`를 자동 렌더링
}
```

---

## 5. 해설 SPA 헬퍼 함수 카탈로그

### 5.1 전역 상태
| 변수 | 타입 | 의미 |
|---|---|---|
| `PROBLEMS` | Array | 모든 문제 |
| `filteredList` | Array | 현재 필터 적용 후 |
| `currentIdx` | Number | 현재 보고 있는 문제 인덱스 (filteredList 기준) |
| `stepState` | `{ pid: Set<stepNum> }` | 펼친 STEP 추적 |
| `currentFilter` | String | 'all'/'basic'/'example'/... |

### 5.2 함수 목록

| 함수 | 역할 |
|---|---|
| `applyFilter(filter)` | 난이도 필터 적용, filteredList 재구성, 0번째로 이동 |
| `showCard(idx)` | viewport에 문제 카드 렌더 + KaTeX + 스텝 상태 복원 |
| `goTo(idx)` | 인덱스 이동, nav·진도 업데이트 |
| `renderCard(problem)` | 단일 문제 HTML 문자열 생성 |
| `showSteps(pid, target)` | STEP 토글: target≥1=해당 STEP 토글, target=0=초기화 |
| `restoreStepState(pid)` | 카드 이동 후 stepState[pid]의 모든 stepNum 펼침 |
| `updateStepBtns(pid)` | stepState 기준으로 STEP 버튼 active 동기화 |
| `highlightAnswer(pid, problem)` | 선지의 정답에 인라인 스타일 형광펜 4종 적용 |
| `revealAnswerOnly(pid)` | highlightAnswer 호출 + "정답" 버튼 active |
| `revealBlank(btn)` | 빈칸 버튼 클릭 시 답 표시 + KaTeX 렌더 |
| `renderMath(el)` | KaTeX `renderMathInElement` 호출 |
| `openScratchOverlay(e)` | 풀이 공간 오버레이 열기 (전자칠판용) |
| `buildPrintArea(problems, withSolution)` | 인쇄 영역 HTML 생성 |
| `closePrintModal()` | 인쇄 모달 닫기 |
| `applyDarkMode(theme)` | 다크모드 적용 (`data-theme` 속성) |

### 5.3 이벤트 바인딩 위치
파일 하단 단일 `<script>` 블록:
1. 초기 PROBLEMS 정의
2. 상태 변수 초기화
3. 함수 정의
4. DOMContentLoaded → applyFilter('all') + 키보드/터치 이벤트 등록

---

## 6. 해설 SPA 단축키 흐름

```js
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(currentIdx + 1);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(currentIdx - 1);
  if (['1','2','3','4','5'].includes(e.key)) showSteps(pid, parseInt(e.key));
  if (e.key === '0') showSteps(pid, 0);
  if (e.key === 'a' || e.key === 'A') revealAnswerOnly(pid);
});

// 별도 핸들러: H/Esc → 메인 탭으로
document.addEventListener('keydown', e => {
  if (e.isComposing) return;
  if (e.key === 'h' || e.key === 'H' || e.key === 'Escape') {
    const w = window.open('index.html', 'aftermath_main');
    if (w) w.focus();
  }
});
```

---

## 7. CSS 변수 시스템 (해설 SPA)

해설 SPA의 `<style>` 상단 `:root`에 정의. 다크모드는 `:root[data-theme="dark"]`로 오버라이드.

### 7.1 색상 토큰
```css
--color-bg, --color-surface, --color-surface-2, --color-surface-offset
--color-border, --color-divider
--color-text, --color-text-muted, --color-text-faint
--color-primary, --color-primary-hover, --color-primary-light, --color-primary-subtle

/* 강조 색상군 (각각 -bg/-border/-text) */
--color-blue-*, --color-green-*, --color-yellow-*, --color-red-*

/* 정답 표시 */
--color-answer-bg, --color-answer-border, --color-answer-text
--color-success

/* 난이도 배지 */
--level-basic-*, --level-example-*, --level-exercise-*, --level-standard-*, --level-advanced-*
```

### 7.2 간격
```css
--space-1: 4px;  --space-2: 8px;  --space-3: 12px;
--space-4: 16px; --space-5: 20px; --space-6: 24px; --space-8: 32px;
```

### 7.3 타이포그래피
```css
--text-xs: .75rem; --text-sm: .875rem;
--text-base: 1rem; --text-lg: 1.125rem; --text-xl: 1.25rem;
--font-body: 'Noto Sans KR', sans-serif;
--font-display: ...;
--font-math: 'KaTeX_Math', monospace;
```

### 7.4 반경·그림자·전환
```css
--radius-sm/md/lg/xl/full
--shadow-sm/md
--transition-fast: 120ms;
--transition-base: 200ms;
```

### 7.5 레이아웃
```css
--header-h: 96px;  /* 고정 헤더 높이 */
--footer-h: 64px;
```

---

## 8. timer-widget.js 구조

### 8.1 IIFE 패턴
```js
(function () {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    if (document.getElementById('aftermathTimer')) return; // 중복 방지
    injectCSS();   // <style> 태그 head에 추가
    injectDOM();   // floating 위젯을 body에 추가
    bindEvents();
    update();
  }
  // ... 내부 함수: injectCSS, injectDOM, getAudioCtx, playTick, playEnd,
  //                fmt, update, start, pause, reset, bindEvents
})();
```

### 8.2 상태
```js
const timer = { total: 0, remaining: 0, running: false, intervalId: null };
```

### 8.3 마크업 (자동 주입)
```html
<div class="aftermath-timer" id="aftermathTimer">
  <button class="aftermath-timer-toggle" id="aftermathTimerToggle">
    <span class="aftermath-timer-icon">⏱</span>
    <span class="aftermath-timer-mini" id="aftermathTimerMini"></span>
  </button>
  <div class="aftermath-timer-panel" hidden>
    <!-- 디스플레이, 프리셋, 입력, 시작/일시정지/리셋 -->
  </div>
</div>
```

### 8.4 시각적 단계
- `> 30초`: 일반
- `≤ 30초`: `.warning` 클래스 (주황색 표시)
- `≤ 10초`: `.danger` 클래스 (빨강 + 깜빡임 + 매초 비프 5초부터)
- `0초`: 알림음 4번 (880-660-880-660)

### 8.5 이벤트
- 토글 버튼 클릭 → 패널 hidden 토글
- 패널 외부 클릭 → 패널 닫기
- `Esc` (capture phase, stopPropagation) → 패널 닫기 (메인 이동 핸들러보다 우선)

---

## 9. localStorage 키

| 키 | 값 | 사용처 |
|---|---|---|
| `aftermath_progress` | JSON `{ filename: true, ... }` | index.html 진도 체크 |
| `aftermath_theme` | `'dark'` 또는 빈 값 | 모든 페이지 다크모드 |

⚠️ 도메인별 격리. `localhost`와 `127.0.0.1`은 다른 origin이라 진도가 분리됨.

---

## 10. 인쇄 (@media print) 정책

### 10.1 학습지
```css
@media print {
  .no-print { display: none !important; }
  body { opacity: 1; background: white; }
  .card { box-shadow: none; border: none; padding: 1rem 0; }
  .thinking-space { min-height: 100~150px; }  /* 풀이 공간 유지 */
}
```
- 숨김: 네비게이션, 타이머, 토글 버튼
- 표시: 문제 + Thinking Space (학생이 손으로 쓸 공간)

### 10.2 해설 SPA
```css
@media print {
  .site-header, .bottom-nav, .main-area, .footer-attr { display: none !important; }
  .print-area { display: block !important; }
  .print-card { page-break-after: always; padding: 14pt 16pt; }
  .print-step-tag { font-size: 7.5pt; background: #2563eb; color: #fff; }
  .print-blank-answer { background: #fefce8; border-bottom: 1.5pt solid #ca8a04; }
}
```
- 별도 `.print-area` 영역 (DOM 위에 숨겨져 있음)
- 모든 문제·풀이를 한 번에 인쇄 (단원 종합본)

### 10.3 timer-widget.js
```css
@media print { .aftermath-timer { display: none !important; } }
```

---

## 11. 메인 인덱스 카드 시스템

### 11.1 섹션 순서
1. **수업 도구** — 학생 뽑기 (반별 4개) + 즉석 타이머 + 외부 도구
2. **시험 성찰** — 자기평가성찰지
3. **II-2 삼각함수의 활용** — 학습지 01~05
4. **III-1 등차수열·등비수열** — 학습지 06~10
5. **III-2 수열의 합** — 학습지 11~14
6. **III-3 수학적 귀납법** — 학습지 15~18
7. **수능특강 수학 I** — 해설 SPA 3개

### 11.2 카드 클래스
- `.unit-card` — 단원 래퍼
- `.unit-title` — 단원 제목
- `.lesson-row` (`.done` 시 초록 배경) — 학습지 행
- `.lesson-link` — 학습지 링크
- `.lesson-num` — 차시 번호 배지
- `.progress-check` (`.completed` 시 체크 표시)
- `.progress-badge` — "교과서 N / 19 · 수능특강 N / 3"

### 11.3 진도 동기화
체크박스 토글 → localStorage 업데이트 → 배지 카운트 갱신.

---

## 12. 유효한 외부 의존성

| 자원 | URL | 사용처 |
|---|---|---|
| MathJax 3 | `cdn.jsdelivr.net/npm/mathjax@3/...` | 학습지 |
| Tailwind CSS | `cdn.tailwindcss.com` | index, 학습지, 자기평가 |
| Noto Sans KR | `fonts.googleapis.com/...Noto+Sans+KR` | 학습지 |
| KaTeX | (인라인 base64 임베드) | 해설 SPA |
| Google Form | `docs.google.com/forms/...` | 학습지 답안 제출 |
| 외부 전자교과서 | `m-teacher.co.kr/...` | index.html에서 외부 링크 |

해설 SPA는 KaTeX를 인라인으로 가져 **오프라인에서도 동작**합니다. 학습지는 MathJax CDN 의존.

---

## 13. 자주 사용되는 sed 패턴 (작업자 참고)

```bash
# 모든 학습지에 한 줄 추가 (</body> 직전)
for f in 학습지_*.html; do
  sed -i 's|</body>|<script src="..."></script>\n</body>|' "$f"
done

# 메인 단축키 location.href를 명명 윈도우로
sed -i "s|location.href = 'index.html';|window.open('index.html', 'aftermath_main')|" "$f"

# 한 줄 인서트 (특정 매칭 라인 다음)
sed -i "/<title>.*<\/title>/a\\<script>window.name = '...';</script>" "$f"
```

---

*작성: 2026-05-08*
