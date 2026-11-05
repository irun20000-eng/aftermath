/* ============================================================
   판서 계획 — 대수 16차시 삼각함수 사이의 관계
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
  lesson: 'alg_16',
  title: '16 삼각함수 사이의 관계',
  legend: { k: '기본 식', b: '핵심 결과', r: '함정·주의', g: '학생 답' },
  minutes: {'warmup': 5, 'concept': 13, 'level': 18, 'check': 5, 'challenge': 6, 'reflect': 3},
  pages: {
    /* ---------- 생각 열기 ---------- */
    'warmup.1': {
      label: '생각 열기 — 세 각에서 계산해 보기',
      bg: 'grid',
      zones: [
        { t: 'π/6, 2π/3, 5π/4 에서 계산', ex: [
          '\\(\\left(\\frac12\\right)^2+\\left(\\frac{\\sqrt3}2\\right)^2=1\\),  \\(\\left(\\frac{\\sqrt3}2\\right)^2+\\left(-\\frac12\\right)^2=1\\),  \\(\\left(-\\frac{\\sqrt2}2\\right)^2\\times2=1\\)',
          'g:모두 1 · \\(\\frac{\\sin}{\\cos}\\)는 \\(\\tan\\)와 같다'
        ] },
        { t: '이유는?', ex: [
          'b:\\(P(\\cos\\theta,\\sin\\theta)\\)는 \\(x^2+y^2=1\\) 위의 점'
        ] }
      ]
    },

    /* ---------- 개념 구성 ---------- */
    'concept.1': {
      label: '개념 1/4 — tanθ = sinθ / cosθ',
      bg: 'grid',
      zones: [
        { t: '단위원 위의 점', axes: { x: 'x', y: 'y' }, ex: [
          '\\(r=1\\) → \\(x=\\cos\\theta,\\ y=\\sin\\theta\\)'
        ] },
        { t: '나눗셈 관계', ex: [
          '\\(\\tan\\theta=\\dfrac yx\\)',
          'b:\\(\\tan\\theta=\\dfrac{\\sin\\theta}{\\cos\\theta}\\)',
          'r:\\(\\cos\\theta=0\\)이면 \\(\\tan\\theta\\) 정의 안 됨'
        ] }
      ]
    },
    'concept.2': {
      label: '개념 2/4 — sin²θ + cos²θ = 1',
      bg: 'grid',
      zones: [
        { t: '원의 방정식에 대입', ex: [
          '\\(x^2+y^2=1\\),  \\(x=\\cos\\theta,\\ y=\\sin\\theta\\)',
          'b:\\(\\sin^2\\theta+\\cos^2\\theta=1\\)'
        ] },
        { t: '기호', ex: [
          '\\(\\sin^2\\theta=(\\sin\\theta)^2\\)',
          'r:\\(\\sin^2\\theta\\ne\\sin(\\theta^2)\\)'
        ] }
      ]
    },
    'concept.3': {
      label: '개념 3/4 — 예제 3 (제2사분면, sinθ = 4/5)',
      bg: 'grid',
      zones: [
        { t: '① 크기', ex: [
          '\\(\\cos^2\\theta=1-\\frac{16}{25}=\\frac9{25}\\)'
        ] },
        { t: '② 부호', ex: [
          '제2사분면 → \\(\\cos\\theta\\lt0\\)',
          'b:\\(\\cos\\theta=-\\dfrac35\\)'
        ] },
        { t: '③ tan', ex: [
          'b:\\(\\tan\\theta=\\dfrac{4/5}{-3/5}=-\\dfrac43\\)',
          'r:부호 결정을 빼먹으면 ± 두 답'
        ] }
      ]
    },
    'concept.4': {
      label: '개념 4/4 — 예제 4 (sinθ + cosθ = 1/2)',
      bg: 'grid',
      zones: [
        { t: '양변 제곱', ex: [
          '\\(\\sin^2\\theta+2\\sin\\theta\\cos\\theta+\\cos^2\\theta=\\dfrac14\\)'
        ] },
        { t: '관계식 대입', ex: [
          '\\(1+2\\sin\\theta\\cos\\theta=\\dfrac14\\)',
          'b:\\(\\sin\\theta\\cos\\theta=-\\dfrac38\\)'
        ] },
        { t: '연결', h: 0.7, ex: [
          'b:\\((\\sin\\theta\\pm\\cos\\theta)^2=1\\pm2\\sin\\theta\\cos\\theta\\)'
        ] }
      ]
    },

    /* ---------- 수준별 훈련 ---------- */
    'level.1': {
      label: '1번 — 제4사분면, cosθ = 1/3',
      bg: 'grid',
      zones: [
        { t: '크기', ex: [
          '\\(\\sin^2\\theta=1-\\frac19=\\frac89\\)'
        ] },
        { t: '부호·값', ex: [
          '제4사분면 → \\(\\sin\\theta\\lt0\\)',
          'b:\\(\\sin\\theta=-\\dfrac{2\\sqrt2}3,\\ \\tan\\theta=-2\\sqrt2\\)'
        ] }
      ]
    },
    'level.2': {
      label: '2번 — 제3사분면, sinθ = −5/13',
      bg: 'grid',
      zones: [
        { t: '크기', ex: [
          '\\(\\cos^2\\theta=1-\\frac{25}{169}=\\frac{144}{169}\\)'
        ] },
        { t: '부호·값', ex: [
          '제3사분면 → \\(\\cos\\theta\\lt0\\)',
          'b:\\(\\cos\\theta=-\\dfrac{12}{13},\\ \\tan\\theta=\\dfrac5{12}\\)'
        ] }
      ]
    },
    'level.3': {
      label: '3번 — 관계식으로 식 간단히',
      bg: 'grid',
      zones: [
        { t: '(1)', ex: [
          '\\((1+2\\sin\\theta\\cos\\theta)+(1-2\\sin\\theta\\cos\\theta)\\)',
          'b:\\(=2\\)'
        ] },
        { t: '(2)', ex: [
          '\\(\\tan\\theta\\cos\\theta=\\sin\\theta\\)',
          '\\(\\dfrac{\\sin^2\\theta+\\cos^2\\theta}{\\sin\\theta}\\)',
          'b:\\(=\\dfrac1{\\sin\\theta}\\)'
        ] }
      ]
    },
    'level.4': {
      label: '4번 — sinθ − cosθ = √3/3 (제1사분면)',
      bg: 'grid',
      zones: [
        { t: '(1) 곱', ex: [
          '\\(1-2\\sin\\theta\\cos\\theta=\\dfrac13\\)',
          'b:\\(\\sin\\theta\\cos\\theta=\\dfrac13\\)'
        ] },
        { t: '(2) 합', ex: [
          '\\((\\sin\\theta+\\cos\\theta)^2=1+\\dfrac23=\\dfrac53\\)',
          'b:\\(\\sin\\theta+\\cos\\theta=\\dfrac{\\sqrt{15}}3\\)  (제1사분면 → 양수)'
        ] }
      ]
    },
    'level.5': {
      label: '5번 — sinθ + cosθ = 1/3 → 세제곱의 합',
      bg: 'grid',
      zones: [
        { t: '곱', ex: [
          '\\(1+2\\sin\\theta\\cos\\theta=\\dfrac19\\)',
          'b:\\(\\sin\\theta\\cos\\theta=-\\dfrac49\\)'
        ] },
        { t: '세제곱의 합', ex: [
          '\\(a^3+b^3=(a+b)^3-3ab(a+b)\\)',
          '\\(=\\dfrac1{27}-3\\cdot\\left(-\\dfrac49\\right)\\cdot\\dfrac13=\\dfrac1{27}+\\dfrac{12}{27}\\)',
          'b:\\(=\\dfrac{13}{27}\\)'
        ] }
      ]
    },
    'level.6': {
      label: '6번 — 제2사분면, tanθ = −2',
      bg: 'grid',
      zones: [
        { t: 'sin 을 cos 로', ex: [
          '\\(\\sin\\theta=-2\\cos\\theta\\)',
          '\\(4\\cos^2\\theta+\\cos^2\\theta=1\\) → \\(\\cos^2\\theta=\\dfrac15\\)'
        ] },
        { t: '부호·값', ex: [
          'b:\\(\\cos\\theta=-\\dfrac{\\sqrt5}5,\\ \\sin\\theta=\\dfrac{2\\sqrt5}5\\)',
          'r:제2사분면: \\(\\sin\\gt0,\\ \\cos\\lt0\\)'
        ] }
      ]
    },
    'level.7': {
      label: '7번 — 두 근이 sinθ, cosθ',
      bg: 'grid',
      zones: [
        { t: '근과 계수의 관계', ex: [
          '\\(\\sin\\theta+\\cos\\theta=\\dfrac12,\\ \\sin\\theta\\cos\\theta=\\dfrac k2\\)'
        ] },
        { t: '숨은 조건', ex: [
          'r:\\(\\sin^2\\theta+\\cos^2\\theta=1\\)을 꼭 쓴다',
          '\\(1+2\\sin\\theta\\cos\\theta=\\dfrac14\\) → \\(\\sin\\theta\\cos\\theta=-\\dfrac38\\)'
        ] },
        { t: '답', ex: [
          'b:\\(k=-\\dfrac34\\)'
        ] }
      ]
    },

    /* ---------- 형성평가 ---------- */
    'check.1': {
      label: '형성평가 8번 — 제3사분면, tanθ = 3/4',
      bg: 'grid',
      zones: [
        { t: '대입', ex: [
          '\\(\\sin\\theta=\\frac34\\cos\\theta\\) → \\(\\frac{25}{16}\\cos^2\\theta=1\\)'
        ] },
        { t: '부호', ex: [
          '제3사분면: \\(\\cos\\theta=-\\frac45,\\ \\sin\\theta=-\\frac35\\)'
        ] },
        { t: '답', ex: [
          'b:\\(\\sin\\theta+\\cos\\theta=-\\dfrac75\\)',
          'r:\\(\\frac75\\) ✗ (부호)'
        ] }
      ]
    },

    /* ---------- 도전 ---------- */
    'challenge.1': {
      label: '도전 1 — 스넬 법칙 (탐구&융합)',
      bg: 'grid',
      zones: [
        { t: '법칙', ex: [
          '\\(\\dfrac{\\sin\\theta_1}{\\sin\\theta_2}=\\dfrac{n_2}{n_1}\\)'
        ] },
        { t: '(1) 공기 → 물, θ₁ = π/4', ex: [
          '\\(\\sin\\theta_2=\\dfrac34\\times\\dfrac{\\sqrt2}2\\)',
          'b:\\(\\dfrac{3\\sqrt2}8\\)'
        ] },
        { t: '(2) π/3 → π/6', ex: [
          '\\(n_2=\\dfrac{\\sqrt3/2}{1/2}\\)',
          'b:\\(\\sqrt3\\)'
        ] }
      ]
    },
    'challenge.2': {
      label: '도전 2 — tanθ + 1/tanθ = 3 (제3사분면)',
      bg: 'grid',
      zones: [
        { t: '통분', ex: [
          '\\(\\dfrac{\\sin^2\\theta+\\cos^2\\theta}{\\sin\\theta\\cos\\theta}=\\dfrac1{\\sin\\theta\\cos\\theta}=3\\)',
          '\\(\\sin\\theta\\cos\\theta=\\dfrac13\\)'
        ] },
        { t: '제곱·부호', ex: [
          '\\((\\sin\\theta+\\cos\\theta)^2=\\dfrac53\\)',
          'b:제3사분면 → \\(-\\dfrac{\\sqrt{15}}3\\)',
          'g:정답 ①'
        ] }
      ]
    },

    /* ---------- 성찰 ---------- */
    'reflect.1': {
      label: '정리 — 오늘의 핵심과 성찰',
      bg: 'blank',
      zones: [
        { t: '오늘의 핵심', ex: [
          'b:\\(\\tan\\theta=\\frac{\\sin\\theta}{\\cos\\theta}\\),  \\(\\sin^2\\theta+\\cos^2\\theta=1\\)',
          '크기 → 사분면 부호 → 나눗셈'
        ] },
        { t: '성찰 · 다음 차시', ex: [
          'QR 성찰지 유형 1~3 중 하나 이상',
          '다음: 삼각함수의 그래프'
        ] }
      ]
    }
  }
};
