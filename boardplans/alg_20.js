/* ============================================================
   판서 계획 — 대수 20차시 중단원 마무리 II-1 (삼각함수)
   ------------------------------------------------------------
   형식은 calc_04.js 와 같다.
   · 학습지 수업 모드 : zones[].t (구역 제목)는 흐리게, zones[].ex 는 숨겨 두고 누르면 한 줄씩
   · 교사용 Nav       : zones[].ex (판서 예시)까지 미니 칠판으로 표시
   페이지 키 = <탭키>.<번호>  (마무리 차시: summary 1 · practice 1~17 · advanced 1~2 · reflect)
   ex 한 줄 앞의 색 표시 — b: 파랑(핵심 결과) · r: 빨강(함정·주의)
                          g: 초록(학생 답·발표) · 없음: 검정(기본 식)
   줄 중간 일부만 색을 바꿀 때는 [[b:…]] 처럼 감싼다
   zone.axes / zone.plot / zone.h — calc_19.js 머리 주석 참고
   ============================================================ */
window.LM_BOARD_PLAN = {
  lesson: 'alg_20',
  title: '20 중단원 마무리 II-1 (삼각함수)',
  legend: { k: '기본 식', b: '핵심 결과', r: '함정·주의', g: '학생 답' },
  minutes: {'summary': 5, 'practice': 33, 'advanced': 7, 'reflect': 5},
  pages: {
    /* ---------- 개념 정리 ---------- */
    'summary.1': {
      label: '개념 구조화 — 삼각함수 한눈에',
      bg: 'grid',
      zones: [
        { t: '호도법 · 부채꼴 · 정의', ex: [
          '\\(180^\\circ=\\pi\\)   \\(l=r\\theta,\\ S=\\frac12r^2\\theta=\\frac12rl\\)',
          '\\(\\sin\\theta=\\frac{y}{r},\\ \\cos\\theta=\\frac{x}{r},\\ \\tan\\theta=\\frac{y}{x}\\)',
          'b:\\(\\tan\\theta=\\frac{\\sin\\theta}{\\cos\\theta},\\ \\sin^2\\theta+\\cos^2\\theta=1\\)'
        ] },
        { t: '그래프', axes: { x: 'x', y: 'y' }, plot: { f: 'Math.sin(t)', t: [-3.1416, 6.283], marks: [[1.5708, '최댓값 1']] }, ex: [
          '\\(y=a\\sin(bx+c)+d\\): 주기 \\(\\frac{2\\pi}{|b|}\\), 최대 \\(|a|+d\\), 최소 \\(-|a|+d\\)',
          '\\(\\tan\\): 주기 \\(\\pi\\), 점근선 \\(x=n\\pi+\\frac{\\pi}{2}\\)'
        ] },
        { t: '방정식·부등식', h: 0.6, ex: [
          'b:해 = 교점의 x좌표 / 위·아래의 범위'
        ] }
      ]
    },

    /* ---------- 실전 훈련 — 기본 ---------- */
    'practice.1': {
      label: '1번 — 일반각과 사분면',
      bg: 'grid',
      zones: [
        { t: '(1) 1004°', ex: [
          '\\(1004^\\circ=360^\\circ\\times2+284^\\circ\\)',
          'b:\\(360^\\circ\\times n+284^\\circ\\), 제4사분면'
        ] },
        { t: '(2) −16π/3', ex: [
          '\\(-\\frac{16}{3}\\pi=2\\pi\\times(-3)+\\frac23\\pi\\)',
          'b:\\(2n\\pi+\\frac23\\pi\\), 제2사분면',
          'r:\\(\\alpha\\)는 \\(0\\le\\alpha\\lt2\\pi\\)가 되도록'
        ] }
      ]
    },
    'practice.2': {
      label: '2번 — 육십분법 ↔ 호도법',
      bg: 'grid',
      zones: [
        { t: '기준', h: 0.6, ex: [
          '\\(180^\\circ=\\pi\\)'
        ] },
        { t: '변환', ex: [
          'b:(1) \\(\\frac{\\pi}{6}\\)   (2) \\(-\\frac34\\pi\\)',
          'b:(3) \\(90^\\circ\\)   (4) \\(-120^\\circ\\)'
        ] }
      ]
    },
    'practice.3': {
      label: '3번 — 부채꼴의 중심각과 넓이',
      bg: 'grid',
      zones: [
        { t: '중심각', ex: [
          '\\(l=r\\theta\\): \\(6\\pi=10\\theta\\)',
          'b:\\(\\theta=\\frac35\\pi\\)'
        ] },
        { t: '넓이', ex: [
          '\\(S=\\frac12rl=\\frac12\\cdot10\\cdot6\\pi\\)',
          'b:\\(S=30\\pi\\)'
        ] }
      ]
    },
    'practice.4': {
      label: '4번 — 점 P(−2, 1) 의 삼각함수',
      bg: 'grid',
      zones: [
        { t: 'r 구하기', axes: { x: 'x', y: 'y' }, ex: [
          '\\(r=\\sqrt{(-2)^2+1^2}=\\sqrt5\\)'
        ] },
        { t: '값', ex: [
          'b:\\(\\sin\\theta=\\frac{\\sqrt5}{5},\\ \\cos\\theta=-\\frac{2\\sqrt5}{5},\\ \\tan\\theta=-\\frac12\\)',
          'r:\\(x\\)좌표가 음수 → cos, tan 음수'
        ] }
      ]
    },
    'practice.5': {
      label: '5번 — 삼각함수의 성질로 값 구하기',
      bg: 'grid',
      zones: [
        { t: '변형', ex: [
          '(1) \\(\\sin(\\pi+\\frac{\\pi}{6})=-\\sin\\frac{\\pi}{6}\\)',
          '(2) \\(\\cos(-\\frac54\\pi)=\\cos(\\pi+\\frac{\\pi}{4})=-\\cos\\frac{\\pi}{4}\\)',
          '(3) \\(\\tan(3\\pi+\\frac{\\pi}{3})=\\tan\\frac{\\pi}{3}\\)'
        ] },
        { t: '답', h: 0.7, ex: [
          'b:(1) \\(-\\frac12\\)   (2) \\(-\\frac{\\sqrt2}{2}\\)   (3) \\(\\sqrt3\\)'
        ] }
      ]
    },

    /* ---------- 실전 훈련 — 표준 ---------- */
    'practice.6': {
      label: '6번 — θ 와 4θ 의 동경이 일치',
      bg: 'grid',
      zones: [
        { t: '조건', ex: [
          '\\(4\\theta-\\theta=2n\\pi\\) → \\(\\theta=\\frac{2n\\pi}{3}\\)'
        ] },
        { t: '범위로 n 결정', ex: [
          '\\(\\frac{\\pi}{2}\\lt\\frac{2n\\pi}{3}\\lt\\pi\\) → \\(\\frac34\\lt n\\lt\\frac32\\), \\(n=1\\)',
          'b:\\(\\theta=\\frac23\\pi\\)'
        ] }
      ]
    },
    'practice.7': {
      label: '7번 — 부호로 사분면 판정',
      bg: 'grid',
      zones: [
        { t: '(i) sin θ < 0', ex: [
          '\\(\\cos\\theta\\gt0,\\ \\tan\\theta\\gt0\\) 필요',
          'r:sin<0, cos>0 이면 tan<0 → 모순'
        ] },
        { t: '(ii) sin θ > 0', ex: [
          '\\(\\cos\\theta\\lt0,\\ \\tan\\theta\\lt0\\)',
          'b:제2사분면'
        ] }
      ]
    },
    'practice.8': {
      label: '8번 — tan θ = 3/4, 제3사분면',
      bg: 'grid',
      zones: [
        { t: '관계식', ex: [
          '\\(\\cos\\theta=\\frac43\\sin\\theta\\)',
          '\\(\\sin^2\\theta+\\frac{16}{9}\\sin^2\\theta=1\\) → \\(\\sin^2\\theta=\\frac{9}{25}\\)'
        ] },
        { t: '부호', ex: [
          'r:제3사분면 → sin, cos 모두 음수',
          'b:\\(\\sin\\theta=-\\frac35,\\ \\cos\\theta=-\\frac45\\)'
        ] }
      ]
    },
    'practice.9': {
      label: '9번 — sin³θ + cos³θ',
      bg: 'grid',
      zones: [
        { t: '제곱', ex: [
          '\\(1+2\\sin\\theta\\cos\\theta=\\frac49\\)',
          '\\(\\sin\\theta\\cos\\theta=-\\frac{5}{18}\\)'
        ] },
        { t: '세제곱의 합', ex: [
          '\\(a^3+b^3=(a+b)^3-3ab(a+b)\\)',
          '\\(\\frac{8}{27}-3\\cdot(-\\frac{5}{18})\\cdot\\frac23=\\frac{8}{27}+\\frac{15}{27}\\)',
          'b:\\(\\frac{23}{27}\\)'
        ] }
      ]
    },
    'practice.10': {
      label: '10번 — 주기와 최댓값·최솟값',
      bg: 'grid',
      zones: [
        { t: '(1) y = 2 sin(x − π/3)', axes: { x: 'x', y: 'y' }, plot: { f: '2*Math.sin(t-1.0472)', t: [0, 6.283], marks: [[2.618, '최댓값 2']] }, ex: [
          'b:주기 \\(2\\pi\\), 최댓값 \\(2\\), 최솟값 \\(-2\\)'
        ] },
        { t: '(2) y = −cos(6x + π/2) + 1', ex: [
          '주기 \\(\\frac{2\\pi}{6}\\),  \\(0\\le -\\cos(\\cdots)+1\\le2\\)',
          'b:주기 \\(\\frac{\\pi}{3}\\), 최댓값 \\(2\\), 최솟값 \\(0\\)'
        ] }
      ]
    },
    'practice.11': {
      label: '11번 — 그래프에서 a, b, c (서술형)',
      bg: 'grid',
      zones: [
        { t: '그래프 읽기', axes: { x: 'x', y: 'y' }, plot: { f: '2*Math.cos(t-1.5708)', t: [-2, 8.5], marks: [[1.5708, '(π/2, 2)'], [7.854, '5π/2']] }, ex: [
          '최댓값 2, 최솟값 −2, 주기 \\(\\frac52\\pi-\\frac{\\pi}{2}=2\\pi\\)'
        ] },
        { t: 'a, b, c', ex: [
          '\\(a=2\\),  \\(\\frac{2\\pi}{b}=2\\pi\\) → \\(b=1\\)',
          '\\(2\\cos(\\frac{\\pi}{2}-c)=2\\) → \\(\\sin c=1\\) → \\(c=\\frac{\\pi}{2}\\)'
        ] },
        { t: '답', h: 0.6, ex: [
          'b:\\(abc=\\pi\\)'
        ] }
      ]
    },
    'practice.12': {
      label: '12번 — π + θ 의 성질과 식의 값',
      bg: 'grid',
      zones: [
        { t: '성질', ex: [
          '\\(\\cos(\\pi+\\theta)=-\\cos\\theta,\\ \\sin(\\pi+\\theta)=-\\sin\\theta\\)'
        ] },
        { t: '통분', ex: [
          '\\(\\frac{\\cos\\theta}{1+\\sin\\theta}-\\frac{\\cos\\theta}{1-\\sin\\theta}=\\frac{-2\\sin\\theta\\cos\\theta}{\\cos^2\\theta}\\)',
          '\\(=-2\\tan\\theta\\)',
          'b:\\(-2\\cdot(-\\frac13)=\\frac23\\)'
        ] }
      ]
    },
    'practice.13': {
      label: '13번 — 삼각방정식과 부등식',
      bg: 'grid',
      zones: [
        { t: '(1) tan(x/2) = √3', ex: [
          '\\(0\\le\\frac{x}{2}\\lt\\pi\\) → \\(\\frac{x}{2}=\\frac{\\pi}{3}\\)',
          'b:\\(x=\\frac23\\pi\\)'
        ] },
        { t: '(2) −1/2 < cos x ≤ √2/2', axes: { x: 'x', y: 'y' }, plot: { f: 'Math.cos(t)', t: [0, 6.283], marks: [[0.7854, 'π/4'], [2.0944, '2π/3'], [4.1888, '4π/3'], [5.4978, '7π/4']] }, ex: [
          'b:\\(\\frac{\\pi}{4}\\le x\\lt\\frac23\\pi\\) 또는 \\(\\frac43\\pi\\lt x\\le\\frac74\\pi\\)',
          'r:등호 있는 쪽만 포함'
        ] }
      ]
    },

    /* ---------- 실전 훈련 — 발전 ---------- */
    'practice.14': {
      label: '14번 — 부채꼴 넓이의 최대',
      bg: 'grid',
      zones: [
        { t: '식 세우기', ex: [
          '\\(2r+l=20\\) → \\(l=20-2r\\)',
          '\\(S=\\frac12r(20-2r)=-(r-5)^2+25\\)'
        ] },
        { t: '중심각', ex: [
          '\\(r=5\\)일 때 \\(S=25\\)',
          '\\(\\frac12\\cdot5^2\\cdot\\theta=25\\)',
          'b:\\(\\theta=2\\)'
        ] }
      ]
    },
    'practice.15': {
      label: '15번 — 그래프에 내접한 직사각형',
      bg: 'grid',
      zones: [
        { t: '대칭축', axes: { x: 'x', y: 'y' }, plot: { f: '2*Math.sin(Math.PI*t/4)', t: [0, 4], marks: [[1, 'A(1, √2)'], [3, 'D']] }, ex: [
          '주기 8 → 산은 \\(0\\le x\\le4\\), 축 \\(x=2\\)',
          'B(1, 0), C(3, 0)'
        ] },
        { t: '넓이', ex: [
          '\\(2\\sin\\frac{\\pi}{4}=\\sqrt2\\)',
          'b:\\(2\\times\\sqrt2=2\\sqrt2\\)'
        ] }
      ]
    },
    'practice.16': {
      label: '16번 — cos²x + sin x + 1 의 최댓값',
      bg: 'grid',
      zones: [
        { t: '치환', ex: [
          '\\(y=-t^2+t+2\\)  (\\(t=\\sin x,\\ -1\\le t\\le1\\))',
          '\\(=-(t-\\frac12)^2+\\frac94\\)'
        ] },
        { t: '최댓값과 a', axes: { x: 't', y: 'y' }, plot: { f: '-t*t+t+2', t: [-1, 1], marks: [[0.5, '9/4']] }, ex: [
          '\\(b=\\frac94\\),  \\(\\sin a=\\frac12\\) → \\(a=\\frac{\\pi}{6}\\)',
          'b:\\(ab=\\frac38\\pi\\)'
        ] }
      ]
    },
    'practice.17': {
      label: '17번 — 판별식과 삼각부등식 (서술형)',
      bg: 'grid',
      zones: [
        { t: '판별식', ex: [
          '\\(\\frac{D}{4}=2\\cos^2\\theta+\\sin\\theta-1\\lt0\\)',
          '\\((2\\sin\\theta+1)(\\sin\\theta-1)\\gt0\\)'
        ] },
        { t: 'sin θ < −1/2', axes: { x: 'θ', y: 'y' }, plot: { f: 'Math.sin(t)', t: [0, 6.283], marks: [[3.6652, '7π/6'], [5.7596, '11π/6']] }, ex: [
          'r:\\(\\sin\\theta\\gt1\\)은 불가능',
          'b:\\(\\frac76\\pi\\lt\\theta\\lt\\frac{11}{6}\\pi\\)'
        ] }
      ]
    },

    /* ---------- 고난도 ---------- */
    'advanced.1': {
      label: '18번 — cos x 이차방정식의 해의 합',
      bg: 'grid',
      zones: [
        { t: 'cos 하나로', ex: [
          '\\(4\\cos^2x+4\\cos x-3=0\\)',
          '\\((2\\cos x-1)(2\\cos x+3)=0\\)'
        ] },
        { t: '범위 확인', ex: [
          'r:\\(\\cos x=-\\frac32\\)은 버린다',
          '\\(\\cos x=\\frac12\\) → \\(x=\\frac{\\pi}{3},\\ \\frac53\\pi\\)',
          'b:합 \\(2\\pi\\)'
        ] }
      ]
    },
    'advanced.2': {
      label: '19번 — 두 곡선의 교점과 삼각형 OAB',
      bg: 'grid',
      zones: [
        { t: '교점', axes: { x: 'x', y: 'y' }, plot: { f: 'Math.sin(t)', t: [0, 6.283], marks: [[0.7854, 'π/4'], [3.927, '5π/4']] }, ex: [
          '\\(\\tan x=1\\) → \\(x=\\frac{\\pi}{4},\\ \\frac54\\pi\\)',
          'A\\((\\frac{\\pi}{4},\\frac{\\sqrt2}{2})\\), B\\((\\frac54\\pi,-\\frac{\\sqrt2}{2})\\)'
        ] },
        { t: '넓이', ex: [
          'AB 중점 M\\((\\frac34\\pi, 0)\\) — x축 위',
          '\\(\\frac12\\cdot\\frac34\\pi\\cdot\\frac{\\sqrt2}{2}\\cdot2\\)',
          'b:\\(\\frac{3\\sqrt2}{8}\\pi\\)'
        ] }
      ]
    },

    /* ---------- 성찰 ---------- */
    'reflect.1': {
      label: '성찰 — 중단원 오답 성찰',
      bg: 'blank',
      zones: [
        { t: '오늘의 핵심', ex: [
          'b:치환하면 범위(−1 ≤ t ≤ 1)도 함께',
          'b:대칭·주기로 해와 값을 찾는다'
        ] },
        { t: '성찰 안내', h: 0.6, ex: [
          'QR 성찰지 — 가장 결정적인 오답 1문항'
        ] }
      ]
    }
  }
};
