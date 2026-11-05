/* ============================================================
   판서 계획 — 대수 15차시 삼각함수의 뜻과 값의 부호
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
  lesson: 'alg_15',
  title: '15 삼각함수의 뜻과 값의 부호',
  legend: { k: '기본 식', b: '핵심 결과', r: '함정·주의', g: '학생 답' },
  minutes: {'warmup': 5, 'concept': 15, 'level': 17, 'check': 5, 'challenge': 5, 'reflect': 3},
  pages: {
    /* ---------- 생각 열기 ---------- */
    'warmup.1': {
      label: '생각 열기 — 크기가 다른 두 직각삼각형',
      bg: 'grid',
      zones: [
        { t: '표 완성', ex: [
          '\\(\\sin A=\\frac35=\\frac6{10}\\),  \\(\\cos A=\\frac45=\\frac8{10}\\),  \\(\\tan A=\\frac34=\\frac68\\)',
          'g:두 삼각형에서 값이 같다'
        ] },
        { t: '발문 — 90°보다 큰 각이라면?', ex: [
          '직각삼각형은 \\(0^\\circ\\lt A\\lt90^\\circ\\)만',
          'b:원 위의 점의 좌표로 정의를 넓힌다'
        ] }
      ]
    },

    /* ---------- 개념 구성 ---------- */
    'concept.1': {
      label: '개념 1/4 — 삼각함수의 정의',
      bg: 'grid',
      zones: [
        { t: '원 위의 점 P(x, y), 반지름 r', axes: { x: 'x', y: 'y' }, ex: [
          '동경 \\(OP\\)가 나타내는 각 \\(\\theta\\)',
          'b:\\(\\sin\\theta=\\dfrac yr,\\ \\cos\\theta=\\dfrac xr,\\ \\tan\\theta=\\dfrac yx\\ (x\\ne0)\\)'
        ] },
        { t: '왜 함수인가', ex: [
          '비는 \\(r\\)에 관계없이 \\(\\theta\\)에 따라 하나로 결정'
        ] },
        { t: '생각 톡톡', h: 0.7, ex: [
          '\\(x\\)축 위 동경: \\(\\sin\\theta=0\\)',
          'r:\\(y\\)축 위 동경: \\(x=0\\) → \\(\\tan\\theta\\) 정의 안 됨'
        ] }
      ]
    },
    'concept.2': {
      label: '개념 2/4 — 예제 1 P(3, −4)',
      bg: 'grid',
      zones: [
        { t: 'r 구하기', ex: [
          '\\(r=\\sqrt{3^2+(-4)^2}=5\\)'
        ] },
        { t: '대입', ex: [
          'b:\\(\\sin\\theta=-\\dfrac45,\\ \\cos\\theta=\\dfrac35,\\ \\tan\\theta=-\\dfrac43\\)'
        ] },
        { t: '주의', h: 0.6, ex: [
          'r:\\(r\\)은 항상 양수 — 부호는 \\(x,y\\)가 가져온다'
        ] }
      ]
    },
    'concept.3': {
      label: '개념 3/4 — 예제 2 θ = 4π/3 (단위원)',
      bg: 'grid',
      zones: [
        { t: '단위원과 기준 삼각형', axes: { x: 'x', y: 'y' }, ex: [
          '\\(\\overline{OP}=1,\\ \\angle POH=\\dfrac{\\pi}{3}\\)',
          '\\(\\overline{OH}=\\dfrac12,\\ \\overline{PH}=\\dfrac{\\sqrt3}2\\)'
        ] },
        { t: '제3사분면 → 부호', ex: [
          '\\(P\\left(-\\dfrac12,-\\dfrac{\\sqrt3}{2}\\right)\\)',
          'b:\\(\\sin\\theta=-\\dfrac{\\sqrt3}2,\\ \\cos\\theta=-\\dfrac12,\\ \\tan\\theta=\\sqrt3\\)'
        ] }
      ]
    },
    'concept.4': {
      label: '개념 4/4 — 삼각함수의 값의 부호',
      bg: 'grid',
      zones: [
        { t: '부호표', ex: [
          'sin: + + − −   cos: + − − +   tan: + − + −  (제1~4사분면)'
        ] },
        { t: '양수인 것만', axes: { x: 'x', y: 'y' }, ex: [
          'b:제1 전부 · 제2 \\(\\sin\\) · 제3 \\(\\tan\\) · 제4 \\(\\cos\\)'
        ] },
        { t: '보기', ex: [
          '\\(110^\\circ\\) 제2: \\(\\sin\\gt0,\\ \\cos\\lt0,\\ \\tan\\lt0\\)',
          '\\(\\frac{10}3\\pi\\) 제3: \\(\\sin\\lt0,\\ \\cos\\lt0,\\ \\tan\\gt0\\)'
        ] }
      ]
    },

    /* ---------- 수준별 훈련 ---------- */
    'level.1': {
      label: '1번 — P(−√3, 1)',
      bg: 'grid',
      zones: [
        { t: 'r', ex: [
          '\\(r=\\sqrt{3+1}=2\\)'
        ] },
        { t: '값', ex: [
          'b:\\(\\sin\\theta=\\dfrac12,\\ \\cos\\theta=-\\dfrac{\\sqrt3}2,\\ \\tan\\theta=-\\dfrac{\\sqrt3}3\\)',
          'r:\\(\\tan\\theta=\\frac{1}{-\\sqrt3}\\) 유리화'
        ] }
      ]
    },
    'level.2': {
      label: '2번 — P(−5, −12)',
      bg: 'grid',
      zones: [
        { t: 'r', ex: [
          '\\(r=\\sqrt{25+144}=13\\)'
        ] },
        { t: '값', ex: [
          'b:\\(\\sin\\theta=-\\dfrac{12}{13},\\ \\cos\\theta=-\\dfrac5{13},\\ \\tan\\theta=\\dfrac{12}5\\)',
          '제3사분면 → \\(\\tan\\)만 양수 ✓'
        ] }
      ]
    },
    'level.3': {
      label: '3번 — 2π/3, −π/4, 390°',
      bg: 'grid',
      zones: [
        { t: '(1) 2π/3', ex: [
          '\\(P\\left(-\\frac12,\\frac{\\sqrt3}2\\right)\\): \\(\\sin=\\frac{\\sqrt3}2,\\ \\cos=-\\frac12,\\ \\tan=-\\sqrt3\\)'
        ] },
        { t: '(2) −π/4', ex: [
          '\\(P\\left(\\frac{\\sqrt2}2,-\\frac{\\sqrt2}2\\right)\\): \\(\\sin=-\\frac{\\sqrt2}2,\\ \\cos=\\frac{\\sqrt2}2,\\ \\tan=-1\\)'
        ] },
        { t: '(3) 390° = 360° + 30°', ex: [
          '\\(\\sin=\\frac12,\\ \\cos=\\frac{\\sqrt3}2,\\ \\tan=\\frac{\\sqrt3}3\\)'
        ] }
      ]
    },
    'level.4': {
      label: '4번 — 부호 판정',
      bg: 'grid',
      zones: [
        { t: '(1)(2)', ex: [
          '(1) \\(220^\\circ\\) 제3: \\(-,-,+\\)',
          '(2) \\(430^\\circ=360^\\circ+70^\\circ\\) 제1: \\(+,+,+\\)'
        ] },
        { t: '(3)(4)', ex: [
          '(3) \\(\\frac{11}6\\pi\\) 제4: \\(-,+,-\\)',
          '(4) \\(-\\frac54\\pi=-2\\pi+\\frac34\\pi\\) 제2: \\(+,-,-\\)',
          'r:음수 각은 \\(2\\pi\\)를 더해 위치부터'
        ] }
      ]
    },
    'level.5': {
      label: '5번 — 부호 조건 → 사분면',
      bg: 'grid',
      zones: [
        { t: '(1)', ex: [
          '\\(\\sin\\gt0\\): 제1·2,  \\(\\cos\\lt0\\): 제2·3',
          'b:제2사분면'
        ] },
        { t: '(2) sinθ tanθ > 0', ex: [
          '같은 부호 → 둘 다 + (제1) 또는 둘 다 − (제4)',
          'b:제1사분면 또는 제4사분면'
        ] }
      ]
    },
    'level.6': {
      label: '6번 — sinθcosθ < 0, cosθtanθ > 0',
      bg: 'grid',
      zones: [
        { t: '첫 조건', ex: [
          '\\(\\sin,\\cos\\) 다른 부호 → 제2 또는 제4'
        ] },
        { t: '둘째 조건', ex: [
          '\\(\\cos\\theta\\tan\\theta=\\sin\\theta\\gt0\\) → 제1 또는 제2'
        ] },
        { t: '공통', ex: [
          'b:제2사분면'
        ] }
      ]
    },
    'level.7': {
      label: '7번 — 제2사분면, 식 간단히',
      bg: 'grid',
      zones: [
        { t: '부호부터', ex: [
          '\\(\\sin\\theta\\gt0,\\ \\cos\\theta\\lt0\\) → \\(\\sin\\theta-\\cos\\theta\\gt0\\)',
          'r:\\(\\sqrt{\\sin^2\\theta}=|\\sin\\theta|\\)'
        ] },
        { t: '벗기기', ex: [
          '\\(\\sin\\theta+(-\\cos\\theta)-(\\sin\\theta-\\cos\\theta)\\)',
          'b:\\(=0\\)'
        ] }
      ]
    },

    /* ---------- 형성평가 ---------- */
    'check.1': {
      label: '형성평가 8번 — θ = −5π/6',
      bg: 'grid',
      zones: [
        { t: '위치', ex: [
          '\\(-\\frac56\\pi=-2\\pi+\\frac76\\pi\\) → 제3사분면'
        ] },
        { t: '단위원 위의 점', ex: [
          '\\(P\\left(-\\frac{\\sqrt3}2,-\\frac12\\right)\\)'
        ] },
        { t: '값', ex: [
          'b:\\(\\sin\\theta=-\\frac12,\\ \\cos\\theta=-\\frac{\\sqrt3}2,\\ \\tan\\theta=\\frac{\\sqrt3}3\\)'
        ] }
      ]
    },

    /* ---------- 도전 ---------- */
    'challenge.1': {
      label: '도전 1 — 직선 y = −2x (x < 0) 위의 동경',
      bg: 'grid',
      zones: [
        { t: '점 잡기', axes: { x: 'x', y: 'y' }, ex: [
          '\\(P(-1,2)\\), \\(r=\\sqrt5\\)',
          'r:\\(x\\lt0\\) 조건 — \\(P(1,-2)\\) ✗'
        ] },
        { t: '값', ex: [
          '\\(\\sin\\theta=\\frac{2\\sqrt5}5,\\ \\cos\\theta=-\\frac{\\sqrt5}5\\)',
          'b:\\(\\sin\\theta+\\cos\\theta=\\dfrac{\\sqrt5}5\\)',
          'g:정답 ③'
        ] }
      ]
    },
    'challenge.2': {
      label: '도전 2 — 부호 조건과 식의 정리',
      bg: 'grid',
      zones: [
        { t: '사분면', ex: [
          '곱 \\(\\gt0\\): 같은 부호,  합 \\(\\lt0\\): 둘 다 음 → 제3사분면'
        ] },
        { t: '정리', ex: [
          '\\(-(\\sin\\theta+\\cos\\theta)+\\sin\\theta+\\tan\\theta\\)',
          'b:\\(=-\\cos\\theta+\\tan\\theta\\)',
          'g:정답 ②'
        ] }
      ]
    },

    /* ---------- 성찰 ---------- */
    'reflect.1': {
      label: '정리 — 오늘의 핵심과 성찰',
      bg: 'blank',
      zones: [
        { t: '오늘의 핵심', ex: [
          'b:\\(\\sin\\theta=\\frac yr,\\ \\cos\\theta=\\frac xr,\\ \\tan\\theta=\\frac yx\\) · 부호는 사분면이 정한다'
        ] },
        { t: '성찰 · 다음 차시', ex: [
          'QR 성찰지 유형 1~3 중 하나 이상',
          '다음: 단위원 \\(x^2+y^2=1\\) → \\(\\sin^2\\theta+\\cos^2\\theta=1\\)'
        ] }
      ]
    }
  }
};
