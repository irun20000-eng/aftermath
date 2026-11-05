/* ============================================================
   판서 계획 — 대수 22차시 코사인법칙
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
  lesson: 'alg_22',
  title: '22 코사인법칙',
  legend: { k: '기본 식', b: '핵심 결과', r: '함정·주의', g: '학생 답' },
  minutes: {'warmup': 5, 'concept': 15, 'level': 18, 'check': 4, 'challenge': 5, 'reflect': 3},
  pages: {
    'warmup.1': {
      label: '생각 열기 — 건널 수 없는 두 섬 사이',
      bg: 'grid',
      zones: [
        { t: '복습', ex: [
          '직각: \\(a^2+b^2=c^2\\),  사인법칙: 한 변과 그 대각'
        ] },
        { t: '발문 — OP = 70, OQ = 124, ∠O = 120°', ex: [
          'g:120°의 대변이 구하려는 PQ → 사인법칙으로는 막힘',
          '두 변과 끼인각만 안다'
        ] },
        { t: '오늘의 방향', h: 0.7, ex: [
          'b:피타고라스를 확장한 코사인법칙'
        ] }
      ]
    },
    'concept.1': {
      label: '개념 1/5 — 수선의 발 H 로 증명',
      bg: 'grid',
      zones: [
        { t: '(i) C 예각', ex: [
          '\\(\\overline{AH}=b\\sin C\\),  \\(\\overline{BH}=a-b\\cos C\\)'
        ] },
        { t: '(iii) C 둔각 · (ii) 직각', ex: [
          '\\(\\overline{AH}=b\\sin C\\),  \\(\\overline{BH}=a+\\overline{CH}=a-b\\cos C\\)',
          '(ii) \\(\\cos90^\\circ=0\\) → 피타고라스'
        ] },
        { t: '피타고라스', ex: [
          '\\(c^2=(a-b\\cos C)^2+(b\\sin C)^2\\)',
          'b:\\(c^2=a^2+b^2-2ab\\cos C\\)'
        ] }
      ]
    },
    'concept.2': {
      label: '개념 2/5 — 코사인법칙과 변형',
      bg: 'grid',
      zones: [
        { t: '두 변·끼인각 → 변', ex: [
          'b:\\(a^2=b^2+c^2-2bc\\cos A\\)'
        ] },
        { t: '세 변 → 각', ex: [
          'b:\\(\\cos A=\\dfrac{b^2+c^2-a^2}{2bc}\\)'
        ] },
        { t: '부호', ex: [
          '\\(a^2\\lt b^2+c^2\\) ⇔ 예각,  \\(a^2\\gt b^2+c^2\\) ⇔ 둔각',
          'r:\\(-2bc\\cos A\\)의 부호 실수 주의'
        ] }
      ]
    },
    'concept.3': {
      label: '개념 3/5 — 예제 4',
      bg: 'grid',
      zones: [
        { t: '(1) A = 60°, b = 6, c = 4', ex: [
          '\\(a^2=36+16-48\\cdot\\frac12=28\\)',
          'b:\\(a=2\\sqrt7\\)'
        ] },
        { t: '(2) a = 7, b = 3, c = 5', ex: [
          '\\(\\cos A=\\dfrac{9+25-49}{30}=-\\dfrac12\\)',
          'b:\\(A=120^\\circ\\)  (답이 하나)'
        ] }
      ]
    },
    'concept.4': {
      label: '개념 4/5 — 예제 5 a cos B = b cos A',
      bg: 'grid',
      zones: [
        { t: '대입', ex: [
          '\\(a\\cdot\\dfrac{c^2+a^2-b^2}{2ca}=b\\cdot\\dfrac{b^2+c^2-a^2}{2bc}\\)'
        ] },
        { t: '정리', ex: [
          '\\(c^2+a^2-b^2=b^2+c^2-a^2\\) → \\(a^2=b^2\\)',
          'b:\\(a=b\\)인 이등변삼각형'
        ] }
      ]
    },
    'concept.5': {
      label: '개념 5/5 — 예제 6 범퍼카와 회전목마',
      bg: 'grid',
      zones: [
        { t: '식', ex: [
          '\\(\\overline{AB}^2=20^2+30^2-2\\cdot20\\cdot30\\cdot0.17=1096\\)'
        ] },
        { t: '답', ex: [
          '\\(\\sqrt{1096}=33.105\\cdots\\)',
          'b:\\(33.11\\,\\mathrm{m}\\)'
        ] }
      ]
    },
    'level.1': {
      label: '1번 — b = 3, c = 5, A = 60°',
      bg: 'grid',
      zones: [
        { t: '식', ex: [
          '\\(a^2=9+25-2\\cdot3\\cdot5\\cdot\\frac12\\)'
        ] },
        { t: '답', ex: [
          'b:\\(a=\\sqrt{19}\\)'
        ] }
      ]
    },
    'level.2': {
      label: '2번 — a = 7, b = 3, c = 8',
      bg: 'grid',
      zones: [
        { t: '식', ex: [
          '\\(\\cos A=\\dfrac{9+64-49}{48}=\\dfrac12\\)'
        ] },
        { t: '답', ex: [
          'b:\\(A=60^\\circ\\)'
        ] }
      ]
    },
    'level.3': {
      label: '3번 — 교과서 문제 4',
      bg: 'grid',
      zones: [
        { t: '(1)', ex: [
          '\\(b^2=64+49+56=169\\) → [[b:\\(b=13\\)]]',
          'r:\\(\\cos120^\\circ=-\\frac12\\) → 빼기가 더하기'
        ] },
        { t: '(2)', ex: [
          '\\(\\cos C=\\dfrac{16+2-10}{8\\sqrt2}=\\dfrac{1}{\\sqrt2}\\) → [[b:\\(C=45^\\circ\\)]]'
        ] }
      ]
    },
    'level.4': {
      label: '4번 — 교과서 문제 5 모양 판정',
      bg: 'grid',
      zones: [
        { t: '(1) a cos B − b cos A = c', ex: [
          '\\(\\dfrac{2a^2-2b^2}{2c}=c\\) → \\(a^2=b^2+c^2\\)',
          'b:\\(A=90^\\circ\\)인 직각삼각형'
        ] },
        { t: '(2) sin A = 2 cos B sin C', ex: [
          '\\(a=\\dfrac{c^2+a^2-b^2}{a}\\) → \\(b^2=c^2\\)',
          'b:\\(b=c\\)인 이등변삼각형'
        ] }
      ]
    },
    'level.5': {
      label: '5번 — a = 5, b = 4, cos C = 1/5 → R',
      bg: 'grid',
      zones: [
        { t: '① c', ex: [
          '\\(c^2=41-8=33\\) → \\(c=\\sqrt{33}\\)'
        ] },
        { t: '② sin C', ex: [
          '\\(\\sin C=\\dfrac{2\\sqrt6}{5}\\)'
        ] },
        { t: '③ 사인법칙', ex: [
          '\\(2R=\\dfrac{5\\sqrt{33}}{2\\sqrt6}\\)',
          'b:\\(R=\\dfrac{5\\sqrt{22}}{8}\\)'
        ] }
      ]
    },
    'level.6': {
      label: '6번 — a:b:c = 3:5:7',
      bg: 'grid',
      zones: [
        { t: '가장 큰 각 = 가장 긴 변의 대각', ex: [
          '\\(a=3k,\\ b=5k,\\ c=7k\\)'
        ] },
        { t: '계산', ex: [
          '\\(\\cos C=\\dfrac{9+25-49}{30}=-\\dfrac12\\)',
          'b:\\(C=120^\\circ\\)'
        ] }
      ]
    },
    'level.7': {
      label: '7번 — 빙산 A-76 의 길이',
      bg: 'grid',
      zones: [
        { t: '식', ex: [
          '\\(\\overline{PQ}^2=4900+15376+8680=28956\\)'
        ] },
        { t: '답', ex: [
          '\\(\\sqrt{28956}=170.16\\cdots\\)',
          'b:\\(170\\,\\mathrm{km}\\)'
        ] }
      ]
    },
    'level.8': {
      label: '8번 — 4, 5, 6 삼각형 판별',
      bg: 'grid',
      zones: [
        { t: '가장 큰 각 하나만', ex: [
          '\\(\\cos C=\\dfrac{16+25-36}{40}=\\dfrac18\\gt0\\)'
        ] },
        { t: '답', ex: [
          'b:예각삼각형',
          'r:작은 각이 예각인 것으로는 판정 불가'
        ] }
      ]
    },
    'check.1': {
      label: '형성평가 9번 — a cos A = b cos B (a ≠ b)',
      bg: 'grid',
      zones: [
        { t: '① 대입·정리', ex: [
          '\\(a^2(b^2+c^2-a^2)=b^2(c^2+a^2-b^2)\\)',
          '\\(c^2(a^2-b^2)=(a^2-b^2)(a^2+b^2)\\)'
        ] },
        { t: '② 나누기', ex: [
          '\\(a\\ne b\\) → \\(c^2=a^2+b^2\\)',
          'b:\\(C=90^\\circ\\)인 직각삼각형'
        ] }
      ]
    },
    'challenge.1': {
      label: '도전 1 — 조건식에서 직각 찾기',
      bg: 'grid',
      zones: [
        { t: '분기', ex: [
          '\\(\\sin B-2\\cos A\\sin C=\\pm\\sin B\\)',
          '+ : \\(A=90^\\circ\\) → \\(9\\lt16\\) 모순'
        ] },
        { t: '− 경우', ex: [
          '\\(b=c\\cos A\\) → \\(a^2+b^2=c^2\\), \\(C=90^\\circ\\)',
          'b:\\(b=\\sqrt7\\), 넓이 \\(\\dfrac{3\\sqrt7}{2}\\)  (①)'
        ] }
      ]
    },
    'challenge.2': {
      label: '도전 2 — 삼각형 DEC 의 외접원',
      bg: 'grid',
      zones: [
        { t: '흐름', ex: [
          '\\(\\cos A\\) 결정 → \\(\\overline{BC}\\) → \\(\\sin C\\)',
          '\\(\\triangle DEC\\): \\(2R=\\dfrac{\\overline{DE}}{\\sin C}\\)'
        ] },
        { t: '답', ex: [
          'b:\\(R=\\dfrac{4\\sqrt{14}}{7}\\)'
        ] }
      ]
    },
    'reflect.1': {
      label: '정리 — 오늘의 핵심과 성찰',
      bg: 'blank',
      zones: [
        { t: '오늘의 핵심', ex: [
          'b:\\(a^2=b^2+c^2-2bc\\cos A\\),  \\(\\cos A=\\dfrac{b^2+c^2-a^2}{2bc}\\)'
        ] },
        { t: '성찰 · 다음 차시', ex: [
          'QR 성찰지 유형 1~3 중 하나 이상',
          '다음: 삼각형의 넓이 \\(\\frac12ab\\sin C\\)'
        ] }
      ]
    }
  }
};
