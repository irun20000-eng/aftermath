/* ============================================================
   판서 계획 — 대수 05차시 로그의 밑의 변환
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
  lesson: 'alg_05',
  title: '05 로그의 밑의 변환',
  legend: { k: '기본 식', b: '핵심 결과', r: '함정·주의', g: '학생 답' },
  minutes: {'warmup': 4, 'concept': 15, 'level': 16, 'check': 5, 'challenge': 6, 'reflect': 4},
  pages: {
    /* ---------- 생각 열기 ---------- */
    'warmup.1': {
      label: '생각 열기 — 밑이 10인 표로 log₂5를?',
      bg: 'grid',
      zones: [
        { t: '이야기 — 네이피어와 브리그스', ex: [
          '곱셈 → 덧셈으로 바꾸는 표 (네이피어)',
          '\\(\\log 1=0,\\; \\log 10=1\\) — 밑이 10인 로그 (브리그스, 1615)'
        ] },
        { t: '발문', ex: [
          '\\(\\log_2 5=x\\) → \\(2^x=5\\)',
          'g:양변에 \\(\\log_{10}\\) → \\(x\\log 2=\\log 5\\)',
          'b:\\(x=\\dfrac{\\log 5}{\\log 2}\\)'
        ] }
      ]
    },

    /* ---------- 개념 구성 ---------- */
    'concept.1': {
      label: '개념 1/4 — 함께하기: 밑의 변환 유도',
      bg: 'grid',
      zones: [
        { t: '두 로그를 지수로', ex: [
          '\\(\\log_a b=m,\\; \\log_c a=n\\) → \\(b=a^m,\\; a=c^n\\)',
          '\\(b=(c^n)^m=c^{mn}\\) → \\(mn=\\log_c b\\)'
        ] },
        { t: '정리', ex: [
          '\\((\\log_a b)(\\log_c a)=\\log_c b\\)',
          'b:\\(\\log_a b=\\dfrac{\\log_c b}{\\log_c a}\\)',
          'r:나눌 수 있는 이유: \\(a\\ne1\\) → \\(\\log_c a\\ne0\\)'
        ] }
      ]
    },
    'concept.2': {
      label: '개념 2/4 — 밑의 변환 공식',
      bg: 'grid',
      zones: [
        { t: '공식', ex: [
          'b:\\(\\log_a b=\\dfrac{\\log_c b}{\\log_c a}\\)  (\\(c \\gt 0, c\\ne1\\))'
        ] },
        { t: '보기', ex: [
          '\\(\\log_8 16=\\dfrac{\\log_2 2^4}{\\log_2 2^3}=\\dfrac43\\)'
        ] },
        { t: '오개념', ex: [
          'r:\\(\\dfrac{\\log_c b}{\\log_c a}\\ne\\log_c\\dfrac ba\\)',
          'r:\\(\\dfrac{\\log_2 4}{\\log_2 2}=2\\),  \\(\\log_2\\dfrac42=1\\)'
        ] }
      ]
    },
    'concept.3': {
      label: '개념 3/4 — 따름 성질 두 개',
      bg: 'grid',
      zones: [
        { t: '(1) 밑과 진수 바꾸기', ex: [
          '\\(\\dfrac{\\log_c b}{\\log_c a}\\times\\dfrac{\\log_c a}{\\log_c b}=1\\)',
          'b:\\((\\log_a b)(\\log_b a)=1\\)'
        ] },
        { t: '(2) 지수 꺼내기', ex: [
          '\\(\\dfrac{\\log_c b^n}{\\log_c a^m}=\\dfrac{n\\log_c b}{m\\log_c a}\\)',
          'b:\\(\\log_{a^m}b^n=\\dfrac nm\\log_a b\\)',
          'r:밑의 지수 → 분모, 진수의 지수 → 분자'
        ] }
      ]
    },
    'concept.4': {
      label: '개념 4/4 — 예제 3 a, b로 나타내기',
      bg: 'grid',
      zones: [
        { t: '(1)', ex: [
          '\\(\\log_5 24=\\log_5(2^3\\times3)\\)',
          'b:\\(=3a+b\\)'
        ] },
        { t: '(2) 밑을 5로', ex: [
          '\\(\\log_{12}45=\\dfrac{\\log_5(3^2\\times5)}{\\log_5(2^2\\times3)}\\)',
          'b:\\(=\\dfrac{2b+1}{2a+b}\\)',
          'r:\\(\\log_5 5=1\\) 빠뜨리지 않기'
        ] }
      ]
    },

    /* ---------- 수준별 훈련 ---------- */
    'level.1': {
      label: '1번 — 문제 7',
      bg: 'grid',
      zones: [
        { t: '(1)', ex: [ '\\(\\dfrac{\\log_3 3^3}{\\log_3 3^2}=\\)[[b:\\(\\frac32\\)]]' ] },
        { t: '(2)', ex: [ '\\(\\dfrac{\\log_5 5^{1/2}}{\\log_5 5^3}=\\)[[b:\\(\\frac16\\)]]' ] }
      ]
    },
    'level.2': {
      label: '2번 — 밑과 진수의 지수',
      bg: 'grid',
      zones: [
        { t: '규칙', ex: [ '\\(\\log_{a^m}b^n=\\dfrac nm\\log_a b\\)' ] },
        { t: '답', ex: [
          '(1) \\(\\log_{2^2}2^5=\\)[[b:\\(\\frac52\\)]]',
          '(2) \\(\\log_{3^3}3^2=\\)[[b:\\(\\frac23\\)]]',
          '(3) \\(\\log_{2^{1/2}}2^3=\\)[[b:6]]',
          'r:(3) \\(\\dfrac{3}{1/2}=6\\) — \\(\\frac32\\) 아님'
        ] }
      ]
    },
    'level.3': {
      label: '3번 — 로그의 연쇄 곱',
      bg: 'grid',
      zones: [
        { t: '밑을 2로', ex: [
          '\\(\\dfrac{\\log_2 3}{1}\\times\\dfrac{\\log_2 4}{\\log_2 3}\\times\\dfrac{\\log_2 8}{\\log_2 4}\\)'
        ] },
        { t: '약분', ex: [ 'b:\\(=\\log_2 8=3\\)' ] }
      ]
    },
    'level.4': {
      label: '4번 — 문제 9',
      bg: 'grid',
      zones: [
        { t: '(1)', ex: [
          '\\(\\log_2 9-\\log_2 10=2a-(1+b)\\)',
          'b:\\(2a-b-1\\)'
        ] },
        { t: '(2) 밑을 2로', ex: [
          '\\(\\dfrac{\\log_2(3\\times5^2)}{\\log_2(2^3\\times3)}\\)',
          'b:\\(\\dfrac{a+2b}{a+3}\\)'
        ] }
      ]
    },
    'level.5': {
      label: '5번 — 밑이 다른 두 문자',
      bg: 'grid',
      zones: [
        { t: '밑 통일', ex: [
          '\\(\\log_2 5=\\log_2 3\\times\\log_3 5=ab\\)'
        ] },
        { t: '밑을 2로', ex: [
          '\\(\\log_{15}6=\\dfrac{\\log_2 6}{\\log_2 15}=\\dfrac{1+a}{a+ab}\\)',
          'b:\\(\\dfrac{1+a}{a(1+b)}\\)'
        ] }
      ]
    },
    'level.6': {
      label: '6번 — 로그의 곱',
      bg: 'grid',
      zones: [
        { t: '지수 꺼내기', ex: [
          '\\(\\log_8 9=\\dfrac23\\log_2 3\\)',
          '\\(\\log_{27}32=\\dfrac53\\log_3 2\\)'
        ] },
        { t: '곱', ex: [
          '\\(\\dfrac23\\times\\dfrac53\\times1\\)',
          'b:\\(=\\dfrac{10}9\\)'
        ] }
      ]
    },
    'level.7': {
      label: '7번 — 밑이 다른 로그의 합과 곱',
      bg: 'grid',
      zones: [
        { t: '괄호 하나씩 밑 통일', ex: [
          '\\(\\log_2 9+\\log_4 3=2\\log_2 3+\\dfrac12\\log_2 3=\\dfrac52\\log_2 3\\)',
          '\\(\\log_3 4+\\log_9 2=\\dfrac52\\log_3 2\\)'
        ] },
        { t: '곱', ex: [
          '\\(\\dfrac{25}4(\\log_2 3)(\\log_3 2)\\)',
          'b:\\(=\\dfrac{25}4\\)'
        ] },
        { t: '함정', h: 0.6, ex: [ 'r:밑이 다르면 합 → 곱으로 못 합친다' ] }
      ]
    },

    /* ---------- 형성평가 ---------- */
    'check.1': {
      label: '형성평가 8번 — a, b로 나타내기',
      bg: 'grid',
      zones: [
        { t: '(1)', ex: [
          '\\(0.6=\\dfrac35\\)',
          'b:\\(\\log_2 0.6=a-b\\)'
        ] },
        { t: '(2) 밑을 2로', ex: [
          '\\(\\log_6 30=\\dfrac{\\log_2(2\\times3\\times5)}{\\log_2(2\\times3)}\\)',
          'b:\\(\\dfrac{1+a+b}{1+a}\\)'
        ] }
      ]
    },

    /* ---------- 도전 ---------- */
    'challenge.1': {
      label: '도전 1 — 생각 넓히기 a^{log_b c}=c^{log_b a}',
      bg: 'grid',
      zones: [
        { t: '증명', ex: [
          '\\(a^{\\log_b c}=x\\) → \\(\\log_b c=\\log_a x\\)',
          '\\(\\dfrac1{\\log_c b}=\\dfrac{\\log_c x}{\\log_c a}\\) → \\(\\log_c x=\\log_b a\\)',
          'b:\\(x=c^{\\log_b a}\\)'
        ] },
        { t: '활용', ex: [
          '\\(4^{\\log_2 9}=9^{\\log_2 4}=9^2\\)',
          'b:\\(=81\\)',
          '\\(a^{\\log_a b}=b^{\\log_a a}=b\\)'
        ] }
      ]
    },
    'challenge.2': {
      label: '도전 2 — 역수 관계',
      bg: 'grid',
      zones: [
        { t: '뒤집기', ex: [
          '\\(\\log_2 a=\\dfrac13,\\; \\log_2 b=\\dfrac16\\)',
          '\\(\\log_2 ab=\\dfrac12\\)'
        ] },
        { t: '답', ex: [
          'b:\\(\\log_{ab}2=2\\)',
          'g:정답 ④',
          'r:\\(3+6=9\\) (⑤)는 함정'
        ] }
      ]
    },

    /* ---------- 성찰 ---------- */
    'reflect.1': {
      label: '정리 — 오늘의 핵심과 성찰',
      bg: 'blank',
      zones: [
        { t: '오늘의 핵심', ex: [
          'b:\\(\\log_a b=\\dfrac{\\log_c b}{\\log_c a}\\)',
          '\\((\\log_a b)(\\log_b a)=1\\),  \\(\\log_{a^m}b^n=\\dfrac nm\\log_a b\\)'
        ] },
        { t: '성찰 · 다음 차시', ex: [
          'QR로 성찰지 제출 (유형 1~3 중 하나 이상)',
          '다음: 밑이 10인 로그 → 상용로그'
        ] }
      ]
    }
  }
};
