# 모의고사 조판기 문항 데이터 규격 (`scripts/mock_exam_build.js`)

원자료 PDF를 페이지별 PNG로 렌더해 눈으로 읽고 전사한다. **문항 데이터와 PDF는 저장소에 커밋하지 않는다** (원저작물 · 공개 저장소).
- 110dpi: `pages/p-NN.png`, 150dpi(작은 첨자 확인용): `pages150/p-NN.png`
- 원본 그림(추출본): `figs/img-PPP-KKK.png` (PPP = 원자료 페이지 번호)
- 페이지마다 `[문제]` `[정답/모범답안]` `[해설]` 블록이 있다. 텍스트 추출은 수식이 빠지므로 **반드시 이미지를 눈으로 읽고** 수식을 LaTeX로 다시 입력한다.

## 출력: JSON 파일 1개 (배열)

```json
[
  {
    "no": 1,
    "section": "common",            // common | prob(확률과 통계) | calc(미적분) | geom(기하)
    "points": 2,                    // 2 | 3 | 4
    "type": "mc",                   // mc(5지선다) | short(단답형)
    "stem": "$3^{\\frac{4}{3}} \\div \\sqrt[3]{3}$의 값은?",
    "figure": null,                 // 문제용 그림 파일명(예: "img-014-001.png") 또는 null
    "figure_width": 0.55,           // 단 너비 대비 비율(0.3~0.9). 그림 없으면 생략
    "choices": ["$\\frac{1}{3}$", "$1$", "$\\sqrt{3}$", "$3$", "$9$"],  // short이면 []
    "answer": "4",                  // mc는 정답 번호(1~5), short는 정수
    "answer_value": "$3$",          // mc는 정답 보기의 값, short는 정수 그대로
    "concept": "지수법칙",           // 핵심 개념 한 줄
    "solution_steps": [
      {"title": "거듭제곱근을 지수로", "body": "$\\sqrt[3]{3}=3^{\\frac{1}{3}}$"},
      {"title": "지수법칙 적용", "body": "$$3^{\\frac{4}{3}}\\div 3^{\\frac{1}{3}}=3^{\\frac{4}{3}-\\frac{1}{3}}=3^1=3$$"}
    ],
    "solution_figure": null,        // 해설용 그림 파일명, 여러 장이면 배열, 없으면 null
    "pitfall": "…",                 // 흔한 실수 1문장 (없으면 null)
    "verify": "원 해설 정답 4와 직접 계산 3 일치"   // 정답 검증 메모
  }
]
```

## 규칙

1. **수식**: 인라인 `$…$`, 별행 `$$…$$`. KaTeX가 렌더할 수 있는 문법만(`\dfrac`, `\displaystyle`, `\lim\limits_{x\to1}`, `\sum\limits_{k=1}^{n}`, `\int_{0}^{1}`, `\overline{AB}`, `\angle`, `\triangle`, `\left(\right)`, `\begin{cases}`, `\begin{aligned}`). JSON 문자열이므로 백슬래시는 `\\`로 쓴다.
2. 분수·극한·적분·시그마가 있는 인라인 수식은 `\displaystyle`을 붙여 수능 문제지처럼 크게 쓴다.
3. **문제 본문(stem)은 원문을 정확하게 옮긴다.** 문구·조건·기호를 바꾸지 않는다. 배점 표기 `[2점]` 등은 stem에서 빼고 `points`에만 넣는다.
4. 조건 박스(가)(나), <보기> ㄱ·ㄴ·ㄷ 같은 블록은 HTML로 쓴다.
   - 조건 박스: `<div class=\"cond\">(가) …<br>(나) …</div>`
   - 보기: `<div class=\"bogi\"><div class=\"bogi-t\">&lt;보 기&gt;</div>ㄱ. …<br>ㄴ. …<br>ㄷ. …</div>`
   - 문단 줄바꿈은 `<br>`.
5. 단답형(수능 16~22, 29~30번 성격)은 `type:"short"`, `choices: []`.
6. **해설은 원 해설을 바탕으로 다시 쓴다(옮겨 적기 금지).** 3~6 STEP. 각 STEP마다 짧은 제목과 핵심 식 위주. 학생이 따라갈 수 있게 논리 비약 없이.
7. **정답 검증**: 직접 다시 풀어 원자료 정답과 비교한다. 불일치하면 `verify`에 `"MISMATCH: …"`로 남기고 근거를 쓴다(임의로 고치지 않는다).
8. 그림 파일은 그 문항이 실린 페이지 번호(PPP)로 찾는다. 해설 블록 안에 있는 그림은 `solution_figure`.
9. 확실히 읽을 수 없는 기호가 있으면 150dpi 이미지를 확인하고, 그래도 불확실하면 `verify`에 `"UNCERTAIN: …"`로 표시한다.

## 빌드

```bash
npm install            # katex, @fontsource/nanum-myeongjo, playwright
node scripts/mock_exam_build.js --data <json 폴더> --figs <그림 폴더> --meta <meta.json> --out <출력 폴더> [--paper B4|A4] [--html]
```

`meta.json` 예: `{"year":"2027","title":"…모의고사","subtitle":"수업용 재구성본 …","copyright":"이 문제지에 관한 저작권은 …에 있습니다.","file_stem":"2027_…_수학"}`

빌드 보고서의 `colOverflow` 와 `katexErrors` 는 반드시 빈 배열·0이어야 한다 (PITFALLS C-10).
산출 PDF(`*.pdf`)는 `.gitignore` 대상이다.
