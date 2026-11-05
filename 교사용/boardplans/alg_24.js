/* ============================================================
   판서 계획 — 대수 24 중단원 마무리 II-2 (사인법칙과 코사인법칙)
   ------------------------------------------------------------
   형식은 calc_04.js 와 같다.
   · 학습지 수업 모드 : zones[].t (구역 제목)는 흐리게, zones[].ex 는 숨겨 두고 누르면 한 줄씩
   · 교사용 Nav       : zones[].ex (판서 예시)까지 미니 칠판으로 표시
   페이지 키 = <탭키>.<번호>  (마무리 차시: summary 1 · practice 1~16 · advanced 1~2 · reflect)
   ex 한 줄 앞의 색 표시 — b: 파랑(핵심 결과) · r: 빨강(함정·주의)
                          g: 초록(학생 답·발표) · 없음: 검정(기본 식)
   줄 중간 일부만 색을 바꿀 때는 [[b:…]] 처럼 감싼다
   zone.axes / zone.plot / zone.h — calc_19.js 머리 주석 참고
   ============================================================ */
window.LM_BOARD_PLAN = {
  'lesson': 'alg_24',
  'title': '24 중단원 마무리 II-2 (사인법칙과 코사인법칙)',
  'legend': {
    'k': '기본 식',
    'b': '핵심 결과',
    'r': '함정·주의',
    'g': '학생 답'
  },
  'minutes': {
    'summary': 5,
    'practice': 33,
    'advanced': 7,
    'reflect': 5
  },
  'pages': {
    'summary.1': {
      'label': '개념 구조화 — 사인법칙·코사인법칙·넓이',
      'bg': 'grid',
      'zones': [
        {
          't': '사인법칙',
          'ex': ['\\(\\frac{a}{\\sin A}=\\frac{b}{\\sin B}=\\frac{c}{\\sin C}=2R\\)', 'b:\\(a:b:c=\\sin A:\\sin B:\\sin C\\)']
        },
        {
          't': '코사인법칙',
          'ex': ['\\(a^2=b^2+c^2-2bc\\cos A\\)', 'b:\\(\\cos A=\\frac{b^2+c^2-a^2}{2bc}\\)']
        },
        {
          't': '넓이 · 도구 고르기',
          'ex': ['b:\\(S=\\frac12bc\\sin A\\)', 'r:두 각+한 변 → 사인 / 두 변+끼인각·세 변 → 코사인']
        }
      ]
    },
    'practice.1': {
      'label': '1번 — a = 8 sin A',
      'bg': 'grid',
      'zones': [
        {
          't': '사인법칙',
          'ex': ['\\(\\frac{a}{\\sin A}=8=2R\\)']
        },
        {
          't': '답',
          'ex': ['b:\\(R=4\\)'],
          'h': 0.6
        }
      ]
    },
    'practice.2': {
      'label': '2번 — b 와 R',
      'bg': 'grid',
      'zones': [
        {
          't': '2R 구하기',
          'ex': ['\\(2R=\\frac{4\\sqrt3}{\\sin60^\\circ}=8\\)']
        },
        {
          't': '답',
          'ex': ['b:(1) \\(b=8\\sin45^\\circ=4\\sqrt2\\)', 'b:(2) \\(R=4\\)']
        }
      ]
    },
    'practice.3': {
      'label': '3번 — 코사인법칙',
      'bg': 'grid',
      'zones': [
        {
          't': '(1) 두 변과 끼인각',
          'ex': ['\\(a^2=36+9-18=27\\)', 'b:\\(a=3\\sqrt3\\)']
        },
        {
          't': '(2) 세 변',
          'ex': ['\\(\\cos A=\\frac{4+9-7}{12}=\\frac12\\)', 'b:\\(A=60^\\circ\\)']
        }
      ]
    },
    'practice.4': {
      'label': '4번 — 삼각형의 넓이',
      'bg': 'grid',
      'zones': [
        {
          't': '(1)',
          'ex': ['\\(\\frac12\\cdot\\sqrt2\\cdot4\\cdot\\sin135^\\circ\\)', 'b:\\(2\\)']
        },
        {
          't': '(2)',
          'ex': ['\\(\\frac12\\cdot6\\cdot10\\cdot\\sin150^\\circ\\)', 'b:\\(15\\)']
        }
      ]
    },
    'practice.5': {
      'label': '5번 — sin A + sin B + sin C',
      'bg': 'grid',
      'zones': [
        {
          't': '변형',
          'ex': ['\\(\\sin A=\\frac{a}{2R}\\)', '\\(\\frac{a+b+c}{2R}=\\frac{20}{12}\\)']
        },
        {
          't': '답',
          'ex': ['b:\\(\\frac53\\)'],
          'h': 0.6
        }
      ]
    },
    'practice.6': {
      'label': '6번 — C 의 크기',
      'bg': 'grid',
      'zones': [
        {
          't': 'sin B',
          'ex': ['\\(\\sin B=\\frac{4\\sqrt2}{8}=\\frac{\\sqrt2}{2}\\)', 'r:\\(B=135^\\circ\\)이면 \\(A+B\\gt180^\\circ\\) → 버림']
        },
        {
          't': '답',
          'ex': ['\\(B=45^\\circ\\)', 'b:\\(C=75^\\circ\\)']
        }
      ]
    },
    'practice.7': {
      'label': '7번 — 드론까지의 거리',
      'bg': 'grid',
      'zones': [
        {
          't': '남은 각',
          'ex': ['드론의 각 \\(=180^\\circ-75^\\circ-45^\\circ=60^\\circ\\)']
        },
        {
          't': '사인법칙',
          'ex': ['\\(\\frac{x}{\\sin45^\\circ}=\\frac{80}{\\sin60^\\circ}\\)', 'b:\\(x=\\frac{80\\sqrt6}{3}\\) m', 'r:민호까지 거리는 지아 쪽 45°의 대변']
        }
      ]
    },
    'practice.8': {
      'label': '8번 — 가장 큰 각',
      'bg': 'grid',
      'zones': [
        {
          't': '가장 긴 변의 대각',
          'ex': ['변 7의 대각이 가장 큼']
        },
        {
          't': '코사인',
          'ex': ['\\(\\cos\\theta=\\frac{16+25-49}{40}\\)', 'b:\\(-\\frac15\\)']
        }
      ]
    },
    'practice.9': {
      'label': '9번 — 외접원의 반지름 (서술형)',
      'bg': 'grid',
      'zones': [
        {
          't': '1단계 c',
          'ex': ['\\(c^2=25+9+15=49\\)', '\\(c=7\\)']
        },
        {
          't': '2단계 R',
          'ex': ['\\(2R=\\frac{7}{\\sin120^\\circ}\\)', 'b:\\(R=\\frac{7\\sqrt3}{3}\\)']
        }
      ]
    },
    'practice.10': {
      'label': '10번 — 삼각형의 모양',
      'bg': 'grid',
      'zones': [
        {
          't': '(1)',
          'ex': ['\\(a\\cdot\\frac{a^2}{4R^2}=b\\cdot\\frac{b^2}{4R^2}\\)', 'b:\\(a=b\\)인 이등변삼각형']
        },
        {
          't': '(2)',
          'ex': ['\\(\\frac{a}{2R}=\\frac{c^2+a^2-b^2}{2ca}\\cdot\\frac{c}{2R}\\)', '\\(a^2+b^2=c^2\\)', 'b:\\(C=90^\\circ\\)인 직각삼각형']
        }
      ]
    },
    'practice.11': {
      'label': '11번 — 축구 골대 각',
      'bg': 'grid',
      'zones': [
        {
          't': '세 변',
          'ex': ['PA = 3, PB = 8, AB = 7']
        },
        {
          't': '코사인',
          'ex': ['\\(\\cos P=\\frac{9+64-49}{48}=\\frac12\\)', 'b:\\(60^\\circ\\)']
        }
      ]
    },
    'practice.12': {
      'label': '12번 — sin(A+B) 와 넓이',
      'bg': 'grid',
      'zones': [
        {
          't': '내각의 합',
          'ex': ['\\(\\sin(A+B)=\\sin(\\pi-C)=\\sin C=\\frac12\\)']
        },
        {
          't': '넓이',
          'ex': ['\\(\\frac12\\cdot6\\cdot8\\cdot\\frac12\\)', 'b:\\(12\\)']
        }
      ]
    },
    'practice.13': {
      'label': '13번 — 변 BC',
      'bg': 'grid',
      'zones': [
        {
          't': '두 변',
          'ex': ['\\(\\overline{AC}=4\\sin60^\\circ=2\\sqrt3,\\ \\overline{AB}=4\\sin45^\\circ=2\\sqrt2\\)']
        },
        {
          't': '수선 AH',
          'ex': ['\\(\\overline{BH}=\\sqrt2,\\ \\overline{HC}=\\sqrt6\\)', 'b:\\(\\sqrt2+\\sqrt6\\)']
        }
      ]
    },
    'practice.14': {
      'label': '14번 — 두 직선이 이루는 각',
      'bg': 'grid',
      'zones': [
        {
          't': '삼각형 만들기',
          'ex': ['O, P(1, 3), Q(1, 1)', '\\(\\sqrt{10},\\ \\sqrt2,\\ 2\\)'],
          'axes': {
            'x': 'x',
            'y': 'y'
          },
          'plot': {
            'f': '3*t',
            't': [0, 1.2],
            'marks': [
              [1, 'P']
            ]
          }
        },
        {
          't': '코사인',
          'ex': ['\\(\\cos\\theta=\\frac{10+2-4}{2\\sqrt{20}}\\)', 'b:\\(\\frac{2\\sqrt5}{5}\\)']
        }
      ]
    },
    'practice.15': {
      'label': '15번 — 원뿔의 최단 거리',
      'bg': 'grid',
      'zones': [
        {
          't': '전개도',
          'ex': ['호 \\(8\\pi=12\\theta\\) → \\(\\theta=\\frac23\\pi\\)', 'r:최단 경로 = 전개도의 선분']
        },
        {
          't': '코사인',
          'ex': ['\\(PQ^2=144+36+72=252\\)', 'b:\\(6\\sqrt7\\) cm']
        }
      ]
    },
    'practice.16': {
      'label': '16번 — 원에 내접하는 사각형 (서술형)',
      'bg': 'grid',
      'zones': [
        {
          't': '대각선 BD',
          'ex': ['\\(29-20\\cos A=25+24\\cos A\\)', 'r:\\(C=180^\\circ-A\\) → \\(\\cos C=-\\cos A\\)', '\\(\\cos A=\\frac1{11}\\)']
        },
        {
          't': '넓이',
          'ex': ['\\(\\sin A=\\frac{2\\sqrt{30}}{11}\\)', '\\(S=5\\sin A+6\\sin A=11\\sin A\\)', 'b:\\(2\\sqrt{30}\\)']
        }
      ]
    },
    'advanced.1': {
      'label': '17번 — 외접원·내접원의 반지름',
      'bg': 'grid',
      'zones': [
        {
          't': 'a 와 R',
          'ex': ['\\(a^2=64+25-40=49\\),  \\(a=7\\)', '\\(R=\\frac{7}{2\\sin60^\\circ}=\\frac{7\\sqrt3}{3}\\)']
        },
        {
          't': 'r',
          'ex': ['\\(S=10\\sqrt3=\\frac12r\\cdot20\\)', '\\(r=\\sqrt3\\)', 'b:\\(Rr=7\\)']
        }
      ]
    },
    'advanced.2': {
      'label': '18번 — 사인값의 비와 넓이',
      'bg': 'grid',
      'zones': [
        {
          't': '가장 큰 각',
          'ex': ['\\(a:b:c=3:5:7\\)', '\\(\\cos C=\\frac{9+25-49}{30}=-\\frac12\\)', 'b:\\(C=120^\\circ\\)']
        },
        {
          't': 'k 와 R',
          'ex': ['\\(\\frac{15\\sqrt3}{4}k^2=15\\sqrt3\\) → \\(k=2\\), \\(c=14\\)', 'b:\\(R=\\frac{14}{2\\sin120^\\circ}=\\frac{14\\sqrt3}{3}\\)']
        }
      ]
    },
    'reflect.1': {
      'label': '성찰 — 중단원 오답 성찰',
      'bg': 'blank',
      'zones': [
        {
          't': '오늘의 핵심',
          'ex': ['b:조건 보고 도구 고르기 — 사인 / 코사인 / 넓이', 'b:사각형은 대각선으로 나눈다']
        },
        {
          't': '성찰 안내',
          'ex': ['QR 성찰지 — 가장 결정적인 오답 1문항'],
          'h': 0.6
        }
      ]
    }
  }
};
