/* ============================================================
   판서 계획 — 대수 23차시 삼각형의 넓이
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
  lesson: 'alg_23',
  title: '23 삼각형의 넓이',
  legend: { k: '기본 식', b: '핵심 결과', r: '함정·주의', g: '학생 답' },
  minutes: {'warmup': 5, 'concept': 15, 'level': 17, 'check': 4, 'challenge': 6, 'reflect': 3},
  pages: {
    'warmup.1': {
      label: '생각 열기 — 높이를 재지 않고 넓이',
      bg: 'grid',
      zones: [
        { t: '준비 학습', ex: [
          '\\(\\frac12\\cdot8\\cdot12\\sin60^\\circ=24\\sqrt3\\),  \\(\\frac12\\cdot6\\cdot6\\sin135^\\circ=9\\sqrt2\\)'
        ] },
        { t: '협소 주택 AB = 8, BC = 10, B = 30°', ex: [
          '\\(\\overline{AH}=8\\sin30^\\circ=4\\)',
          'g:넓이 \\(\\frac12\\cdot10\\cdot4=20\\,\\mathrm{m}^2\\)'
        ] },
        { t: '오늘의 방향', h: 0.7, ex: [
          'b:높이 = 변 × 사인값'
        ] }
      ]
    },
    'concept.1': {
      label: '개념 1/5 — h = b sin C 와 넓이 공식',
      bg: 'grid',
      zones: [
        { t: '세 경우', ex: [
          '예각 \\(h=b\\sin C\\),  직각 \\(h=b\\),  둔각 \\(h=b\\sin(180^\\circ-C)=b\\sin C\\)'
        ] },
        { t: '공식', ex: [
          'b:\\(S=\\dfrac12ab\\sin C=\\dfrac12bc\\sin A=\\dfrac12ca\\sin B\\)',
          'r:두 변과 그 끼인각'
        ] },
        { t: '보기', h: 0.7, ex: [
          '\\(\\frac12\\cdot4\\cdot6\\sin30^\\circ=6\\)'
        ] }
      ]
    },
    'concept.2': {
      label: '개념 2/5 — 예제 1 세 변 5, 7, 8',
      bg: 'grid',
      zones: [
        { t: '① cos → ② sin', ex: [
          '\\(\\cos A=\\dfrac{49+64-25}{112}=\\dfrac{11}{14}\\)',
          '\\(\\sin A=\\dfrac{5\\sqrt3}{14}\\)  (\\(\\sin A\\gt0\\))'
        ] },
        { t: '③ 넓이', ex: [
          '\\(\\frac12\\cdot7\\cdot8\\cdot\\dfrac{5\\sqrt3}{14}\\)',
          'b:\\(10\\sqrt3\\)'
        ] },
        { t: '헤론', h: 0.7, ex: [
          '\\(s=10\\): \\(\\sqrt{10\\cdot5\\cdot3\\cdot2}=10\\sqrt3\\)'
        ] }
      ]
    },
    'concept.3': {
      label: '개념 3/5 — 예제 2 한 변과 두 각',
      bg: 'grid',
      zones: [
        { t: '① 각 · ② 변', ex: [
          '\\(A=30^\\circ\\),  \\(b=\\dfrac{20\\times0.95}{0.5}=38\\)'
        ] },
        { t: '③ 넓이', ex: [
          '\\(\\frac12\\cdot20\\cdot38\\cdot0.98\\)',
          'b:\\(372.4\\)'
        ] }
      ]
    },
    'concept.4': {
      label: '개념 4/5 — 외접원의 반지름으로 넓이',
      bg: 'grid',
      zones: [
        { t: '활동 1', ex: [
          '\\(\\sin A=\\dfrac{a}{2R}\\) 대입',
          'b:\\(S=\\dfrac{abc}{4R}\\)'
        ] },
        { t: '활동 2', ex: [
          '\\(a=2R\\sin A\\) 등 대입',
          'b:\\(S=2R^2\\sin A\\sin B\\sin C\\)'
        ] }
      ]
    },
    'concept.5': {
      label: '개념 5/5 — 사각형으로 넓히기',
      bg: 'grid',
      zones: [
        { t: '평행사변형', ex: [
          'b:\\(S=ab\\sin\\theta\\)  (삼각형 2개)'
        ] },
        { t: '두 대각선', ex: [
          'b:\\(S=\\dfrac12pq\\sin\\theta\\)',
          'r:평행사변형엔 \\(\\frac12\\)이 없다'
        ] }
      ]
    },
    'level.1': {
      label: '1번 — b = 8, c = 10, A = 30°',
      bg: 'grid',
      zones: [
        { t: '식', ex: [
          '\\(\\frac12\\cdot8\\cdot10\\cdot\\frac12\\)'
        ] },
        { t: '답', ex: [
          'b:\\(20\\)'
        ] }
      ]
    },
    'level.2': {
      label: '2번 — 교과서 문제 1',
      bg: 'grid',
      zones: [
        { t: '(1) A = 135°', ex: [
          '\\(\\frac12\\cdot6\\cdot4\\sqrt2\\cdot\\frac{\\sqrt2}{2}\\) → [[b:\\(12\\)]]'
        ] },
        { t: '(2) B = 120°', ex: [
          '\\(\\frac12\\cdot10\\cdot12\\cdot\\frac{\\sqrt3}{2}\\) → [[b:\\(30\\sqrt3\\)]]',
          'r:둔각도 사인은 양수'
        ] }
      ]
    },
    'level.3': {
      label: '3번 — 대각선 6, 8, 사이각 45°',
      bg: 'grid',
      zones: [
        { t: '식', ex: [
          '\\(\\frac12\\cdot6\\cdot8\\cdot\\frac{\\sqrt2}{2}\\)'
        ] },
        { t: '답', ex: [
          'b:\\(12\\sqrt2\\)'
        ] }
      ]
    },
    'level.4': {
      label: '4번 — 텃밭 4 m, 6 m, 8 m',
      bg: 'grid',
      zones: [
        { t: 'cos → sin', ex: [
          '\\(\\cos\\theta=\\dfrac{16+36-64}{48}=-\\dfrac14\\)',
          '\\(\\sin\\theta=\\dfrac{\\sqrt{15}}{4}\\)'
        ] },
        { t: '넓이', ex: [
          '\\(\\frac12\\cdot4\\cdot6\\cdot\\dfrac{\\sqrt{15}}{4}\\)',
          'b:\\(3\\sqrt{15}\\,\\mathrm{m}^2\\)'
        ] }
      ]
    },
    'level.5': {
      label: '5번 — 간척지의 넓이',
      bg: 'grid',
      zones: [
        { t: '변 BC', ex: [
          '\\(A=130^\\circ\\),  \\(\\overline{BC}=\\dfrac{600\\sin130^\\circ}{\\sin30^\\circ}=1200\\times0.77=924\\)'
        ] },
        { t: '넓이', ex: [
          '\\(\\frac12\\cdot600\\cdot924\\cdot0.34\\)',
          'b:\\(94248\\,\\mathrm{m}^2\\)'
        ] }
      ]
    },
    'level.6': {
      label: '6번 — S = abc/4R 로 R',
      bg: 'grid',
      zones: [
        { t: '식', ex: [
          '\\(R=\\dfrac{abc}{4S}=\\dfrac{280}{40\\sqrt3}\\)'
        ] },
        { t: '답·검산', ex: [
          'b:\\(R=\\dfrac{7\\sqrt3}{3}\\)',
          '검산: \\(B=60^\\circ\\), \\(2R=\\dfrac{7}{\\sin60^\\circ}\\)'
        ] }
      ]
    },
    'level.7': {
      label: '7번 — 원에 내접하는 사각형',
      bg: 'grid',
      zones: [
        { t: '대각선 AC', ex: [
          '\\(\\overline{AC}^2=9+25-15=19\\),  \\(D=120^\\circ\\)'
        ] },
        { t: 'AD = x', ex: [
          '\\(19=x^2+4x+16\\) → \\(x=\\sqrt7-2\\)'
        ] },
        { t: '넓이의 합', ex: [
          '\\(\\dfrac{15\\sqrt3}{4}+(\\sqrt{21}-2\\sqrt3)\\)',
          'b:\\(\\dfrac{7\\sqrt3}{4}+\\sqrt{21}\\)',
          'r:대각의 합 180° 를 놓치지 않기'
        ] }
      ]
    },
    'check.1': {
      label: '형성평가 8번 — 평행사변형 넓이 12√2',
      bg: 'grid',
      zones: [
        { t: '① 식', ex: [
          '\\(4\\cdot6\\sin A=12\\sqrt2\\) → \\(\\sin A=\\dfrac{\\sqrt2}{2}\\)'
        ] },
        { t: '② 답', ex: [
          'b:\\(A=45^\\circ\\)  (예각)',
          'r:\\(\\frac12\\)을 붙이면 오답'
        ] }
      ]
    },
    'challenge.1': {
      label: '도전 1 — 닮음 + 넓이비 + 코사인법칙',
      bg: 'grid',
      zones: [
        { t: '닮음·이등변', ex: [
          '\\(\\overline{BD}=8,\\ \\overline{CD}=4\\),  \\(\\overline{AE}:\\overline{EC}=1:2\\)'
        ] },
        { t: '넓이비', ex: [
          '\\(\\triangle EBC=18\\sqrt5\\) → \\(\\overline{EH}=3\\sqrt5\\), \\(\\cos\\theta=\\frac23,\\ a=9\\)'
        ] },
        { t: '코사인법칙', ex: [
          '\\(\\overline{AD}^2=\\frac{729}{4}+16-72=\\frac{505}{4}\\)',
          'b:\\(\\dfrac{\\sqrt{505}}{2}\\)  (⑤)'
        ] }
      ]
    },
    'challenge.2': {
      label: '도전 2 — 평행사변형 대각선의 최댓값',
      bg: 'grid',
      zones: [
        { t: '넓이 → sin', ex: [
          '\\(\\overline{AE}=4\\),  \\(8\\sin A=4\\sqrt3\\) → \\(A=60^\\circ\\) 또는 \\(120^\\circ\\)'
        ] },
        { t: '두 경우', ex: [
          '\\(\\angle B=120^\\circ\\): \\(\\overline{AC}^2=76\\);  \\(\\angle B=60^\\circ\\): \\(28\\)',
          'b:최댓값 \\(2\\sqrt{19}\\)'
        ] }
      ]
    },
    'reflect.1': {
      label: '정리 — 오늘의 핵심과 성찰',
      bg: 'blank',
      zones: [
        { t: '오늘의 핵심', ex: [
          'b:\\(S=\\frac12ab\\sin C\\) — 없는 변·각은 사인법칙·코사인법칙으로 채운다'
        ] },
        { t: '성찰 · 다음 차시', ex: [
          'QR 성찰지 유형 1~3 중 하나 이상',
          '다음: 중단원 마무리'
        ] }
      ]
    }
  }
};
