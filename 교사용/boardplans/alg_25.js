/* ============================================================
   판서 계획 — 대수 25 대단원 평가 (II. 삼각함수)
   ------------------------------------------------------------
   형식은 calc_04.js 와 같다.
   · 학습지 수업 모드 : zones[].t (구역 제목)는 흐리게, zones[].ex 는 숨겨 두고 누르면 한 줄씩
   · 교사용 Nav       : zones[].ex (판서 예시)까지 미니 칠판으로 표시
   페이지 키 = <탭키>.<번호>  (마무리 차시: summary 1 · practice 1~18 · advanced 1~2 · reflect)
   ex 한 줄 앞의 색 표시 — b: 파랑(핵심 결과) · r: 빨강(함정·주의)
                          g: 초록(학생 답·발표) · 없음: 검정(기본 식)
   줄 중간 일부만 색을 바꿀 때는 [[b:…]] 처럼 감싼다
   zone.axes / zone.plot / zone.h — calc_19.js 머리 주석 참고
   ============================================================ */
window.LM_BOARD_PLAN = {
  'lesson': 'alg_25',
  'title': '25 대단원 평가 (II. 삼각함수)',
  'legend': {
    'k': '기본 식',
    'b': '핵심 결과',
    'r': '함정·주의',
    'g': '학생 답'
  },
  'minutes': {
    'summary': 5,
    'practice': 35,
    'advanced': 5,
    'reflect': 5
  },
  'pages': {
    'summary.1': {
      'label': '대단원 구조화 — II. 삼각함수',
      'bg': 'grid',
      'zones': [
        {
          't': '호도법 · 삼각함수',
          'ex': ['\\(180^\\circ=\\pi\\),  \\(l=r\\theta,\\ S=\\frac12rl\\)', 'b:\\(\\sin^2\\theta+\\cos^2\\theta=1\\)']
        },
        {
          't': '그래프',
          'ex': ['주기: sin·cos \\(\\frac{2\\pi}{|b|}\\), tan \\(\\frac{\\pi}{|b|}\\)'],
          'axes': {
            'x': 'x',
            'y': 'y'
          },
          'plot': {
            'f': 'Math.sin(t)',
            't': [0, 6.283],
            'marks': [
              [1.5708, '1']
            ]
          }
        },
        {
          't': '삼각형',
          'ex': ['b:\\(\\frac{a}{\\sin A}=2R\\),  \\(a^2=b^2+c^2-2bc\\cos A\\),  \\(S=\\frac12bc\\sin A\\)']
        }
      ]
    },
    'practice.1': {
      'label': '1번 — 사분면이 다른 하나',
      'bg': 'grid',
      'zones': [
        {
          't': '정리',
          'ex': ['820°=720°+100°,  −600°=−720°+120°', '\\(\\frac83\\pi=2\\pi+\\frac23\\pi\\),  \\(-\\frac{11}{4}\\pi=-4\\pi+\\frac54\\pi\\)']
        },
        {
          't': '답',
          'ex': ['b:⑤ (제3사분면, 나머지는 제2사분면)']
        }
      ]
    },
    'practice.2': {
      'label': '2번 — 부채꼴의 넓이',
      'bg': 'grid',
      'zones': [
        {
          't': '반지름',
          'ex': ['\\(9\\pi=\\frac34\\pi r\\) → \\(r=12\\)']
        },
        {
          't': '넓이',
          'ex': ['\\(\\frac12\\cdot12\\cdot9\\pi\\)', 'b:\\(54\\pi\\)']
        }
      ]
    },
    'practice.3': {
      'label': '3번 — sin θ cos θ',
      'bg': 'grid',
      'zones': [
        {
          't': 'r',
          'ex': ['\\(r=\\sqrt{1+4}=\\sqrt5\\)'],
          'axes': {
            'x': 'x',
            'y': 'y'
          }
        },
        {
          't': '값',
          'ex': ['\\(\\sin\\theta=-\\frac{2}{\\sqrt5},\\ \\cos\\theta=-\\frac{1}{\\sqrt5}\\)', 'b:③ \\(\\frac25\\)']
        }
      ]
    },
    'practice.4': {
      'label': '4번 — 식 간단히',
      'bg': 'grid',
      'zones': [
        {
          't': '부호',
          'ex': ['제4사분면: \\(\\sin\\theta\\lt0,\\ \\cos\\theta\\gt0\\)', 'r:\\(\\sqrt{x^2}=|x|\\)']
        },
        {
          't': '계산',
          'ex': ['\\(-\\sin\\theta-(\\cos\\theta-\\sin\\theta)+\\cos\\theta\\)', 'b:\\(0\\)']
        }
      ]
    },
    'practice.5': {
      'label': '5번 — tan θ',
      'bg': 'grid',
      'zones': [
        {
          't': '통분',
          'ex': ['\\(\\frac{2}{1-\\cos^2\\theta}=\\frac{2}{\\sin^2\\theta}=8\\)', '\\(\\sin^2\\theta=\\frac14\\)']
        },
        {
          't': '제2사분면',
          'ex': ['\\(\\sin\\theta=\\frac12,\\ \\cos\\theta=-\\frac{\\sqrt3}{2}\\)', 'b:\\(\\tan\\theta=-\\frac{\\sqrt3}{3}\\)']
        }
      ]
    },
    'practice.6': {
      'label': '6번 — 근과 계수의 관계',
      'bg': 'grid',
      'zones': [
        {
          't': '관계',
          'ex': ['\\(\\sin\\theta+\\cos\\theta=-\\frac13,\\ \\sin\\theta\\cos\\theta=\\frac k3\\)']
        },
        {
          't': '제곱',
          'ex': ['\\(1+\\frac{2k}{3}=\\frac19\\)', 'b:\\(k=-\\frac43\\)']
        }
      ]
    },
    'practice.7': {
      'label': '7번 — 주기가 다른 하나',
      'bg': 'grid',
      'zones': [
        {
          't': '주기',
          'ex': ['①②⑤ \\(\\frac{2\\pi}{2}=\\pi\\),  ③ \\(\\pi\\)', 'r:tan 의 주기는 \\(\\frac{\\pi}{|b|}\\)']
        },
        {
          't': '답',
          'ex': ['b:④ \\(\\frac{\\pi}{1/2}=2\\pi\\)']
        }
      ]
    },
    'practice.8': {
      'label': '8번 — sin² 의 합',
      'bg': 'grid',
      'zones': [
        {
          't': '짝짓기',
          'ex': ['\\(\\sin^2 80^\\circ=\\cos^2 10^\\circ\\)', '\\(\\sin^2 10^\\circ+\\sin^2 80^\\circ=1\\)  … 4쌍']
        },
        {
          't': '답',
          'ex': ['\\(4+\\sin^2 90^\\circ\\)', 'b:③ \\(5\\)']
        }
      ]
    },
    'practice.9': {
      'label': '9번 — M + m',
      'bg': 'grid',
      'zones': [
        {
          't': '치환',
          'ex': ['\\(t=\\cos x,\\ -1\\le t\\le1\\)', '\\(y=-2(t-\\frac14)^2+\\frac{17}{8}\\)']
        },
        {
          't': '최대·최소',
          'ex': ['\\(M=\\frac{17}{8}\\ (t=\\frac14),\\ m=-1\\ (t=-1)\\)', 'b:\\(\\frac98\\)']
        }
      ]
    },
    'practice.10': {
      'label': '10번 — 해의 대칭',
      'bg': 'grid',
      'zones': [
        {
          't': '그래프',
          'ex': ['\\(\\sin x=\\frac34\\)'],
          'axes': {
            'x': 'x',
            'y': 'y'
          },
          'plot': {
            'f': 'Math.sin(t)',
            't': [0, 7.854],
            'marks': [
              [0.848, 'α'],
              [2.294, 'β'],
              [7.131, 'γ']
            ]
          }
        },
        {
          't': '계산',
          'ex': ['\\(\\beta=\\pi-\\alpha,\\ \\gamma=2\\pi+\\alpha\\) → \\(\\frac{\\beta+\\gamma}{2}=\\frac32\\pi\\)', '\\(\\cos(\\alpha+\\frac32\\pi)=\\sin\\alpha\\)', 'b:\\(\\frac34\\)']
        }
      ]
    },
    'practice.11': {
      'label': '11번 — 삼각부등식',
      'bg': 'grid',
      'zones': [
        {
          't': '치환',
          'ex': ['\\(t=x-\\frac{\\pi}{4}\\),  \\(-\\frac{\\pi}{4}\\le t\\lt\\frac74\\pi\\)', 'r:치환하면 범위도 바뀐다']
        },
        {
          't': '풀이',
          'ex': ['\\(-\\frac{\\pi}{6}\\lt t\\lt\\frac{\\pi}{6}\\)', 'b:\\(\\frac{\\pi}{12}\\lt x\\lt\\frac{5}{12}\\pi\\)']
        }
      ]
    },
    'practice.12': {
      'label': '12번 — 사인값의 비',
      'bg': 'grid',
      'zones': [
        {
          't': '변의 비',
          'ex': ['\\(a:b:c=4:5:6\\)']
        },
        {
          't': '코사인',
          'ex': ['\\(\\cos A=\\frac{25+36-16}{60}\\)', 'b:\\(\\frac34\\)']
        }
      ]
    },
    'practice.13': {
      'label': '13번 — 강 건너 두 지점',
      'bg': 'grid',
      'zones': [
        {
          't': 'AC, BC',
          'ex': ['△ACD 직각이등변 → \\(AC=2\\)', '\\(BC=\\frac{2\\sin105^\\circ}{\\sin45^\\circ}=\\sqrt3+1\\)']
        },
        {
          't': 'AB',
          'ex': ['\\(\\angle ACB=60^\\circ\\)', '\\(AB^2=4+(4+2\\sqrt3)-2(\\sqrt3+1)=6\\)', 'b:\\(\\sqrt6\\) km']
        }
      ]
    },
    'practice.14': {
      'label': '14번 — 각의 이등분선 AD',
      'bg': 'grid',
      'zones': [
        {
          't': '넓이의 합',
          'ex': ['\\(\\frac12\\cdot6\\cdot4\\sin120^\\circ=\\frac12\\cdot6x\\sin60^\\circ+\\frac12\\cdot4x\\sin60^\\circ\\)']
        },
        {
          't': '답',
          'ex': ['\\(24=10x\\)', 'b:\\(\\frac{12}{5}\\)']
        }
      ]
    },
    'practice.15': {
      'label': '15번 — a − b (서술형)',
      'bg': 'grid',
      'zones': [
        {
          't': '두 식',
          'ex': ['\\(a+b=4\\)', '\\(\\frac a2+b=\\frac52\\)']
        },
        {
          't': '답',
          'ex': ['\\(a=3,\\ b=1\\)', 'b:\\(a-b=2\\)']
        }
      ]
    },
    'practice.16': {
      'label': '16번 — 근의 합 (서술형)',
      'bg': 'grid',
      'zones': [
        {
          't': 'sin 하나로',
          'ex': ['\\(8\\sin^2x-2\\sin x-1=0\\)', '\\((4\\sin x+1)(2\\sin x-1)=0\\)']
        },
        {
          't': '범위',
          'ex': ['r:\\(0\\lt x\\lt\\pi\\) → \\(\\sin x\\gt0\\)', '\\(x=\\frac{\\pi}{6},\\ \\frac56\\pi\\)', 'b:합 \\(\\pi\\)']
        }
      ]
    },
    'practice.17': {
      'label': '17번 — 변 CA (서술형)',
      'bg': 'grid',
      'zones': [
        {
          't': 'cos B',
          'ex': ['\\(k,\\ 2k,\\ \\sqrt2k\\)', '\\(\\cos B=\\frac{k^2+4k^2-2k^2}{4k^2}=\\frac34\\)', '\\(\\sin B=\\frac{\\sqrt7}{4}\\)']
        },
        {
          't': 'R 과 CA',
          'ex': ['\\(\\pi R^2=28\\pi\\) → \\(R=2\\sqrt7\\)', 'b:\\(CA=2R\\sin B=7\\)']
        }
      ]
    },
    'practice.18': {
      'label': '18번 — 사각형의 넓이 (서술형)',
      'bg': 'grid',
      'zones': [
        {
          't': 'BD 와 C',
          'ex': ['\\(BD^2=25+9+15=49\\),  \\(BD=7\\)', '\\(\\cos C=\\frac{64+9-49}{48}=\\frac12\\)']
        },
        {
          't': '넓이',
          'ex': ['\\(\\frac{15\\sqrt3}{4}+6\\sqrt3\\)', 'b:\\(\\frac{39\\sqrt3}{4}\\)']
        }
      ]
    },
    'advanced.1': {
      'label': '19번 — 창의 Up: 각의 크기 비교',
      'bg': 'grid',
      'zones': [
        {
          't': '∠ABC',
          'ex': ['\\(\\sqrt{10},\\ 1,\\ \\sqrt{13}\\)', '\\(\\cos=\\frac{10+1-13}{2\\sqrt{10}}=-\\frac{\\sqrt{10}}{10}\\)']
        },
        {
          't': '∠DEF',
          'ex': ['\\(\\sqrt5,\\ \\sqrt2,\\ 3\\)', '\\(\\cos=\\frac{5+2-9}{2\\sqrt{10}}=-\\frac{\\sqrt{10}}{10}\\)', 'b:코사인 값이 같다 → 두 각은 같다', 'r:눈대중은 믿을 수 없다']
        }
      ]
    },
    'advanced.2': {
      'label': '20번 — 삼각방정식 + 코사인법칙',
      'bg': 'grid',
      'zones': [
        {
          't': 'A 정하기',
          'ex': ['\\((\\sin A-\\frac12)^2=0\\)', '\\(A=30^\\circ\\) 또는 \\(150^\\circ\\)', 'r:두 경우 모두 삼각형이 된다']
        },
        {
          't': 'a',
          'ex': ['\\(30^\\circ\\): \\(a^2=28-24=4\\),  \\(a=2\\)', '\\(150^\\circ\\): \\(a^2=28+24=52\\),  \\(a=2\\sqrt{13}\\)', 'b:곱 \\(4\\sqrt{13}\\)']
        }
      ]
    },
    'reflect.1': {
      'label': '성찰 — 대단원 오답 성찰',
      'bg': 'blank',
      'zones': [
        {
          't': '오늘의 핵심',
          'ex': ['b:치환하면 범위도 함께 / 대칭으로 해를 찾는다', 'b:삼각형은 조건 보고 사인·코사인·넓이 선택']
        },
        {
          't': '성찰 안내',
          'ex': ['QR 성찰지 — 단원 전체 개념도 + 결정적 오답 1문항'],
          'h': 0.6
        }
      ]
    }
  }
};
