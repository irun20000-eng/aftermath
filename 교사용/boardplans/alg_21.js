/* ============================================================
   판서 계획 — 대수 21차시 사인법칙
   ------------------------------------------------------------
   한 파일을 두 곳에서 쓴다.
   · 학습지 수업 모드 : zones[].t (구역 제목)는 흐리게, zones[].ex 는 숨겨 두고 누르면 한 줄씩
   · 교사용 Nav       : zones[].ex (판서 예시)까지 미니 칠판으로 표시 (제목 = label)
   페이지 키 = <탭키>.<번호>  (탭키: warmup·concept·level·check·challenge·reflect)
   ex 한 줄 앞의 색 표시 — b: 파랑(핵심 결과) · r: 빨강(함정·주의)
                          g: 초록(학생 답·발표) · 없음: 검정(기본 식)
   줄 중간 일부만 색을 바꿀 때는 [[b:…]] 처럼 감싼다
   bg: blank | grid | axes   zone.axes: {x:'x', y:'y'}   zone.h: 구역 높이 비율(기본 1)
   zone.plot: 교사용 예시에만 그리는 개형 {f:'t에 대한 식', t:[시작,끝], marks:[[t,'표시',색]]}
   ============================================================ */
window.LM_BOARD_PLAN = {
  lesson: 'alg_21',
  title: '21 사인법칙',
  legend: { k: '기본 식', b: '핵심 결과', r: '함정·주의', g: '학생 답' },
  minutes: {'warmup': 5, 'concept': 15, 'level': 18, 'check': 4, 'challenge': 5, 'reflect': 3},
  pages: {
    'warmup.1': {
      label: '생각 열기 — 석탑 꼭대기까지의 거리',
      bg: 'grid',
      zones: [
        { t: '준비 학습 — 원주각', ex: [
          '같은 호의 원주각은 같다,  지름의 원주각 \\(=90^\\circ\\)',
          '내접사각형: 대각의 합 \\(=180^\\circ\\)'
        ] },
        { t: '석탑 (높이 10 m, 45°·60°)', ex: [
          '\\(\\overline{AB}=\\dfrac{10}{\\sin45^\\circ}=10\\sqrt2\\),  \\(\\overline{AC}=\\dfrac{10}{\\sin60^\\circ}=\\dfrac{20\\sqrt3}{3}\\)',
          'g:\\(\\dfrac{\\overline{AC}}{\\sin B}=\\dfrac{\\overline{AB}}{\\sin C}=\\dfrac{20\\sqrt6}{3}\\) — 같다!'
        ] },
        { t: '오늘의 질문', h: 0.7, ex: [
          'b:변 ÷ 대각의 사인 = 일정? 그 값은?'
        ] }
      ]
    },
    'concept.1': {
      label: '개념 1/5 — a / sin A = 2R 보이기',
      bg: 'grid',
      zones: [
        { t: '(i) A 예각', ex: [
          '지름 \\(BA\'\\): \\(A=A\'\\), \\(\\angle A\'CB=90^\\circ\\)',
          '\\(\\sin A=\\sin A\'=\\dfrac{a}{2R}\\)'
        ] },
        { t: '(ii) 직각 · (iii) 둔각', ex: [
          '(ii) \\(a=2R\\), \\(\\sin A=1=\\dfrac{a}{2R}\\)',
          '(iii) \\(A=180^\\circ-A\'\\) → \\(\\sin A=\\sin A\'=\\dfrac{a}{2R}\\)'
        ] },
        { t: '결론', h: 0.7, ex: [
          'b:\\(\\dfrac{a}{\\sin A}=2R\\)  (A의 크기와 무관)'
        ] }
      ]
    },
    'concept.2': {
      label: '개념 2/5 — 사인법칙과 변형',
      bg: 'grid',
      zones: [
        { t: '사인법칙', ex: [
          'b:\\(\\dfrac{a}{\\sin A}=\\dfrac{b}{\\sin B}=\\dfrac{c}{\\sin C}=2R\\)'
        ] },
        { t: '변형', ex: [
          'A: \\(a=2R\\sin A\\)   B: \\(\\sin A=\\dfrac{a}{2R}\\)',
          'C: \\(a:b:c=\\sin A:\\sin B:\\sin C\\)'
        ] },
        { t: '오개념', h: 0.7, ex: [
          'r:\\(a:b:c\\ne A:B:C\\)'
        ] }
      ]
    },
    'concept.3': {
      label: '개념 3/5 — 예제 1 a = 4, A = 45°, B = 60°',
      bg: 'grid',
      zones: [
        { t: '(1) b', ex: [
          '\\(b=\\dfrac{a\\sin B}{\\sin A}=\\dfrac{4\\sin60^\\circ}{\\sin45^\\circ}\\)',
          'b:\\(b=2\\sqrt6\\)'
        ] },
        { t: '(2) R', ex: [
          '\\(R=\\dfrac{a}{2\\sin A}=\\dfrac{4}{2\\sin45^\\circ}\\)',
          'b:\\(R=2\\sqrt2\\)'
        ] }
      ]
    },
    'concept.4': {
      label: '개념 4/5 — 예제 2 모양 판정',
      bg: 'grid',
      zones: [
        { t: '사인 → 변', ex: [
          '\\(\\sin A=\\dfrac{a}{2R}\\) 등을 \\(\\sin^2A=\\sin^2B+\\sin^2C\\)에 대입'
        ] },
        { t: '정리', ex: [
          '\\(\\dfrac{a^2}{4R^2}=\\dfrac{b^2}{4R^2}+\\dfrac{c^2}{4R^2}\\) → \\(a^2=b^2+c^2\\)',
          'b:\\(A=90^\\circ\\)인 직각삼각형'
        ] }
      ]
    },
    'concept.5': {
      label: '개념 5/5 — 예제 3 건물의 높이',
      bg: 'grid',
      zones: [
        { t: '각 찾기', ex: [
          '\\(\\angle ABC=150^\\circ\\) → \\(\\angle ACB=3^\\circ\\)'
        ] },
        { t: '사인법칙', ex: [
          '\\(\\overline{BC}=\\dfrac{123\\times0.45}{0.05}=1107\\)'
        ] },
        { t: '높이', ex: [
          '\\(\\overline{CD}=1107\\sin30^\\circ\\)',
          'b:\\(553.5\\,\\mathrm{m}\\)'
        ] }
      ]
    },
    'level.1': {
      label: '1번 — a = 10, A = 45°, B = 60°',
      bg: 'grid',
      zones: [
        { t: '식', ex: [
          '\\(\\dfrac{10}{\\sin45^\\circ}=\\dfrac{b}{\\sin60^\\circ}\\)'
        ] },
        { t: '계산 · 답', ex: [
          '\\(b=\\dfrac{10\\cdot\\frac{\\sqrt3}{2}}{\\frac{\\sqrt2}{2}}=\\dfrac{10\\sqrt3}{\\sqrt2}\\)',
          'b:\\(b=5\\sqrt6\\)'
        ] }
      ]
    },
    'level.2': {
      label: '2번 — R = 8, A = 30°',
      bg: 'grid',
      zones: [
        { t: '변형 A', ex: [
          '\\(a=2R\\sin A=16\\times\\dfrac12\\)'
        ] },
        { t: '답', ex: [
          'b:\\(a=8\\)'
        ] }
      ]
    },
    'level.3': {
      label: '3번 — 교과서 문제 1',
      bg: 'grid',
      zones: [
        { t: '(1)', ex: [
          '\\(\\sin A=\\dfrac{2\\sin120^\\circ}{2\\sqrt3}=\\dfrac12\\) → [[b:\\(A=30^\\circ\\)]]'
        ] },
        { t: '(2)', ex: [
          '\\(C=60^\\circ\\), \\(2R=\\dfrac{3}{\\sin60^\\circ}=2\\sqrt3\\) → [[b:\\(R=\\sqrt3\\)]]'
        ] },
        { t: '(3)', ex: [
          '\\(A=45^\\circ\\), \\(c=\\dfrac{3\\sin30^\\circ}{\\sin45^\\circ}\\) → [[b:\\(\\dfrac{3\\sqrt2}{2}\\)]]',
          'r:모르는 각은 180°로 먼저'
        ] }
      ]
    },
    'level.4': {
      label: '4번 — 모양 판정',
      bg: 'grid',
      zones: [
        { t: '(1) a sin A = b sin B', ex: [
          '\\(\\dfrac{a^2}{2R}=\\dfrac{b^2}{2R}\\) → \\(a=b\\)',
          'b:\\(a=b\\)인 이등변삼각형'
        ] },
        { t: '(2) a sin A + b sin B = c sin C', ex: [
          '\\(a^2+b^2=c^2\\)',
          'b:\\(C=90^\\circ\\)인 직각삼각형'
        ] }
      ]
    },
    'level.5': {
      label: '5번 — A:B:C = 1:2:3',
      bg: 'grid',
      zones: [
        { t: '각', ex: [
          '\\(A=30^\\circ,\\ B=60^\\circ,\\ C=90^\\circ\\)'
        ] },
        { t: '사인의 비', ex: [
          '\\(\\dfrac12:\\dfrac{\\sqrt3}{2}:1\\)',
          'b:\\(a:b:c=1:\\sqrt3:2\\)',
          'r:\\(1:2:3\\) ✗'
        ] }
      ]
    },
    'level.6': {
      label: '6번 — 사인의 합 3/2, 둘레 12',
      bg: 'grid',
      zones: [
        { t: '변형 A 합치기', ex: [
          '\\(a+b+c=2R(\\sin A+\\sin B+\\sin C)\\)'
        ] },
        { t: '대입', ex: [
          '\\(12=2R\\times\\dfrac32=3R\\)',
          'b:\\(R=4\\)'
        ] }
      ]
    },
    'level.7': {
      label: '7번 — 골프공이 날아간 거리',
      bg: 'grid',
      zones: [
        { t: '각', ex: [
          '\\(\\angle TAG=100^\\circ\\),  \\(\\sin100^\\circ=\\sin80^\\circ=0.98\\)'
        ] },
        { t: '사인법칙', ex: [
          '\\(\\overline{TA}=\\dfrac{250\\times0.77}{0.98}=196.428\\cdots\\)',
          'b:\\(196.43\\,\\mathrm{m}\\)'
        ] }
      ]
    },
    'level.8': {
      label: '8번 — b = 2, c = 2√3, B = 30° 일 때 C',
      bg: 'grid',
      zones: [
        { t: '사인값', ex: [
          '\\(\\sin C=\\dfrac{2\\sqrt3\\sin30^\\circ}{2}=\\dfrac{\\sqrt3}{2}\\)'
        ] },
        { t: '두 해', ex: [
          'b:\\(C=60^\\circ\\) 또는 \\(120^\\circ\\)',
          'r:예각만 쓰면 오답 — \\(B+C\\lt180^\\circ\\) 확인'
        ] }
      ]
    },
    'check.1': {
      label: '형성평가 9번 — a = 4, A = 30°, B = 45°',
      bg: 'grid',
      zones: [
        { t: '① 2R', ex: [
          '\\(2R=\\dfrac{4}{\\sin30^\\circ}=8\\) → [[b:\\(R=4\\)]]'
        ] },
        { t: '② b', ex: [
          '\\(b=8\\sin45^\\circ\\) → [[b:\\(4\\sqrt2\\)]]'
        ] },
        { t: '③ 점검', h: 0.6, ex: [
          'r:한 변과 그 대각 쌍부터 찾기'
        ] }
      ]
    },
    'challenge.1': {
      label: '도전 1 — 두 삼각형의 사인법칙 곱하기',
      bg: 'grid',
      zones: [
        { t: '두 식', ex: [
          '\\(\\triangle ADC\\): \\(\\overline{CD}=6\\sin\\theta\\)',
          '\\(\\triangle ABC\\): \\(\\dfrac{8}{\\sin\\theta}=\\dfrac{\\overline{CA}}{2/3}\\) → \\(\\overline{CD}=\\dfrac{16}{3\\sin\\theta}\\)'
        ] },
        { t: '곱해서 소거', ex: [
          '\\(\\overline{CD}^2=32\\)',
          'b:\\(4\\sqrt2\\)  (⑤)'
        ] }
      ]
    },
    'challenge.2': {
      label: '도전 2 — R = 4, A = 30°, AC = 4√3',
      bg: 'grid',
      zones: [
        { t: '(1) 두 해', ex: [
          '\\(\\sin B=\\dfrac{4\\sqrt3}{8}=\\dfrac{\\sqrt3}{2}\\) → \\(B=60^\\circ\\) 또는 \\(120^\\circ\\)'
        ] },
        { t: '(2) 둘레', ex: [
          '\\(B=60^\\circ\\): \\(a=4,\\ c=8\\) → [[b:\\(12+4\\sqrt3\\)]]',
          '\\(B=120^\\circ\\): \\(a=c=4\\) → [[b:\\(8+4\\sqrt3\\)]]'
        ] }
      ]
    },
    'reflect.1': {
      label: '정리 — 오늘의 핵심과 성찰',
      bg: 'blank',
      zones: [
        { t: '오늘의 핵심', ex: [
          'b:\\(\\dfrac{a}{\\sin A}=\\dfrac{b}{\\sin B}=\\dfrac{c}{\\sin C}=2R\\) — 한 변과 그 대각이 열쇠'
        ] },
        { t: '성찰 · 다음 차시', ex: [
          'QR 성찰지 유형 1~3 중 하나 이상',
          '다음: 두 변과 끼인각 → 코사인법칙'
        ] }
      ]
    }
  }
};
