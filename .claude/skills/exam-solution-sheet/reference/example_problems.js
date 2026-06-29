// PROBLEMS 객체 작성 예시 (첨부 양식 기준) — 실제 생성 시 이 구조를 따른다.

// [선택형 choice 예시]
{
    id:'c1-e1', level:'example', levelLabel:'예제', num:1, type:'choice',
    subLabel:'함수의 우극한과 좌극한 · 그래프형',
    title:'함수 \\(y=f(x)\\)의 그래프 좌·우극한',
    question:`<p>함수 \\(y=f(x)\\)의 그래프가 그림과 같다.</p>
<p>\\(\\displaystyle \\lim_{x\\to -1+} f(x) - \\lim_{x\\to 2} f(x)\\)의 값은?</p>
<!-- 2027 수능특강 수학 II P.5 예제 1 원본 그림 — PyMuPDF 자동 cropping. 학습지 SVG는 단순화된 자체 도식이었으나 PDF 원본은 -3≤x≤3 범위의 톱니파형 그래프로 더 풍부함. 정답·해설은 PDF 원본 그림에 맞춰 작성되어 있어야 함 (현재 STEP 설명문은 SVG 기준이므로 사용자 검토·수정 권장). -->
<div class="graph-box">
  <img src="images/calc_sol_c1-e1.png" alt="예제 1 그림 — 함수 y=f(x)의 톱니파형 그래프 (2027 수능특강 수학 II P.5 예제 1)" style="max-width:100%;height:auto;" />
</div>`,
    choices:['\\(-2\\)','\\(-1\\)','\\(0\\)','\\(1\\)','\\(2\\)'], answer:0,
    keypoint:'우극한·좌극한은 그래프의 ‘끝점이 닫혔는지’와 무관하게 "접근하는 \\(y\\) 값"만 본다.',
    steps:[
      {tag:'STEP 1', title:'그래프에서 우극한 \\(\\displaystyle \\lim_{x\\to -1+} f(x)\\)', body:`<p>\\(x\\)가 \\(-1\\)보다 큰 쪽에서 \\(-1\\)에 다가갈 때, 함수는 직선 가지를 따라 점 \\((-1,\\,0)\\)에 닿습니다(닫힌 점).</p>
<div class="calc purple">\\(\\displaystyle \\lim_{x\\to -1+} f(x) = 0\\)</div>`},
      {tag:'STEP 2', title:'\\(x=2\\)에서 양쪽 극한 비교', body:`<p>\\(x\\to 2-\\)에서는 직선 가지가 \\((2,\\,2)\\)에 다가가고(열린 점이라도 극한값은 \\(2\\)), \\(x\\to 2+\\)에서는 수평 가지에서 \\(3\\)에 가까워질 것 같지만 다시 그래프를 보면 \\(x=2\\) 부근 양쪽 모두 \\(2\\)에 모입니다.</p>
<div class="hint">📌 정답 해설 기준: 그래프에서 \\(\\displaystyle \\lim_{x\\to 2-} f(x)=2,\\ \\lim_{x\\to 2+} f(x)=2\\) 이므로 \\(\\displaystyle \\lim_{x\\to 2} f(x)=2\\).</div>`},
      {tag:'STEP 3', title:'두 극한값의 차', body:`<div class="calc purple">\\(\\displaystyle \\lim_{x\\to -1+} f(x) - \\lim_{x\\to 2} f(x) = 0 - 2 = -2\\)</div>`}
    ]
  },

// [단답형 short 예시]
{
    id:'c1-e2', level:'example', levelLabel:'예제', num:2, type:'short',
    subLabel:'함수의 극한에 대한 성질 · 곱·합 분리',
    title:'\\(f(x)g(x)=4\\), \\((f+g)/f=3\\)에서 \\(f^2+g^2\\)',
    question:`<p>두 함수 \\(f(x)\\), \\(g(x)\\)가 \\(\\displaystyle \\lim_{x\\to 1} f(x)g(x)=4,\\ \\lim_{x\\to 1} \\dfrac{f(x)+g(x)}{f(x)}=3\\) 을 만족시킬 때, \\(\\displaystyle \\lim_{x\\to 1}\\bigl\\{ (f(x))^2 + (g(x))^2 \\bigr\\}\\)의 값을 구하시오.</p>`,
    answerText:'\\(10\\)',
    keypoint:'개별 \\(\\lim f\\), \\(\\lim g\\)를 몰라도 <b>비율과 곱</b>의 극한만으로 다양한 식을 합성할 수 있다.',
    steps:[
      {tag:'STEP 1', title:'\\(\\dfrac{g}{f}\\)의 극한 분리', body:`<p>\\(\\dfrac{f+g}{f} = 1 + \\dfrac{g}{f}\\) 이므로 \\(\\displaystyle \\lim_{x\\to 1}\\dfrac{g(x)}{f(x)} = 3 - 1 = 2\\).</p>
<div class="calc purple">\\(\\displaystyle \\lim_{x\\to 1}\\dfrac{g(x)}{f(x)} = 2\\)</div>`},
      {tag:'STEP 2', title:'역수로 \\(\\dfrac{f}{g}\\)의 극한', body:`<p>\\(\\displaystyle \\lim\\dfrac{g}{f}=2\\neq 0\\)이므로 역수의 극한값도 존재.</p>
<div class="calc purple">\\(\\displaystyle \\lim_{x\\to 1}\\dfrac{f(x)}{g(x)} = \\dfrac{1}{2}\\)</div>`},
      {tag:'STEP 3', title:'\\(f^2+g^2\\)를 \\((fg)\\)와 비율로 분해', body:`<p>핵심 변형: \\(f^2 + g^2 = \\dfrac{f}{g}\\cdot fg + \\dfrac{g}{f}\\cdot fg\\)</p>
<div class="calc">\\(= \\left(\\dfrac{f}{g} + \\dfrac{g}{f}\\right) \\cdot fg\\)</div>`},
      {tag:'STEP 4', title:'대입해서 최종 계산', body:`<div class="calc purple">\\(\\displaystyle \\lim_{x\\to 1}(f^2+g^2) = \\left(\\dfrac{1}{2}+2\\right)\\cdot 4 = \\dfrac{5}{2}\\cdot 4 = 10\\)</div>`}
    ]
  },
