# 🤖 aftermath 에이전트 시스템

`.claude/agents/`에 정의된 도메인 전문 에이전트들. **메인 Claude가 `Agent` tool로 호출**해 일관된 품질의 도메인 작업을 수행.

## 핵심 원칙

- **도메인 분리** — 메인 Claude는 만능이지만 도메인 깊이가 흐려짐. 전문 에이전트로 책임 분리.
- **JSON·Markdown 출력** — 메인 Claude가 결과를 파싱·재사용 가능.
- **누적·영속** — 평가·매핑 결과는 `mappings/`에 JSON으로 저장. 다음 세션에서 재사용.
- **레포 종속 + 영속** — `aftermath/.claude/agents/`는 git에 커밋되어 모든 세션·머신·동료에게 자동 전달.

---

## 에이전트 4개

| 에이전트 | 역할 | 입력 | 출력 |
|---|---|---|---|
| **problem-evaluator** 🔍 | 문제 1개의 난이도·핵심 개념·실수 포인트·수능 연결 평가 | 학습지 카드 HTML 또는 문제 텍스트 | JSON (`difficulty 1-10`, `tier`, `concepts`, `pitfalls`, `suneung_connection` 등) |
| **problem-curator** 🎯 | 학습지의 도전문제로 쓸 수능특강 문제 선별·추천 + 양방향 매핑 제안 | 학습지 평가 + 수능특강 평가 누적 결과 | JSON (`candidates[]`, `rejected[]`, `summary`) |
| **concept-coach** 📖 | 개념을 학생 수준에 맞춰 단계별 설명 + 시각화 + 흔한 오개념 | 개념 키워드 또는 막힌 문제 | Markdown (직관·정의·공식·시각화·오개념·다음 학습) |
| **technique-trainer** ⚡ | 문제 유형별 빠른 풀이·암기 팁·시간 단축 기법 | 문제 유형 또는 단원 | Markdown 기법 카드 (핵심·예제 비교·시간 단축·주의·확장) |

각 에이전트의 자세한 책임·출력 스키마·금지 사항 → `.claude/agents/<name>.md`

---

## 워크플로 — 학습지 도전문제 일괄 선별

```
[1] 메인 Claude가 학습지_06_등차수열의 모든 카드 추출 (data-aft-problem-level 마킹된 것)

[2] 각 카드별로 problem-evaluator 호출 (반복):
    Agent(problem-evaluator, "<카드 HTML>")
    → JSON 결과를 mappings/difficulty_index.json에 누적

[3] 수능특강_등차수열등비수열 해설지의 PROBLEMS 배열 추출
    각 문제별로 problem-evaluator 호출 (반복):
    → mappings/difficulty_index.json에 누적

[4] problem-curator 호출:
    Agent(problem-curator, {
      worksheet: { id, concepts, problems: [...평가결과] },
      suneung_unit: { source, problems: [...평가결과] },
      target_count: 2
    })
    → JSON 추천 후보

[5] 메인 Claude가 추천을 토대로:
    - 학습지_06에 도전 카드 inline 추가 (수능특강 문제 클론) + 출처 라벨
    - 수능특강 해설지의 PROBLEMS에 usedAsChallengeIn 메타 추가 + 배지 렌더 코드
    - mappings/challenge_mapping.json에 양방향 기록

[6] 선생님 검수 → PR 머지
```

---

## 워크플로 — 학생이 막힌 문제 코칭

```
학생 → "[문제 N]을 못 풀겠어요"
     ↓
메인 Claude → problem-evaluator로 [문제 N] 평가 → 핵심 개념 파악
            ↓
            concept-coach로 핵심 개념 설명 → 학생에게 전달
            ↓
            (학생이 여전히 막히면) technique-trainer로 빠른 풀이 기법 제시
```

각 에이전트는 **자기 책임만** 수행. 메인 Claude가 **흐름을 조율**.

---

## 매핑 파일 (`mappings/`)

### `mappings/difficulty_index.json`

모든 문제(학습지·수능특강)의 난이도·평가 결과 누적. problem-evaluator의 출력을 캐싱.

```json
{
  "schema_version": 1,
  "updated_at": "2026-05-09",
  "items": {
    "학습지_06_등차수열#02_2번": {
      "difficulty": 4,
      "tier": "기초",
      "concepts": ["등차수열의 일반항"],
      "evaluated_at": "2026-05-09"
    },
    "수능특강_등차수열등비수열#example_3": {
      "difficulty": 7,
      "tier": "심화",
      "concepts": ["등차수열의 일반항", "등차수열의 합"],
      "evaluated_at": "2026-05-09"
    }
  }
}
```

평가 비용을 줄이기 위해 **이미 평가된 문제는 재호출하지 X**. 메인 Claude가 캐시 확인 후 미평가 문제만 호출.

### `mappings/challenge_mapping.json`

학습지 ↔ 수능특강 도전문제 양방향 매핑.

```json
{
  "schema_version": 1,
  "mappings": [
    {
      "worksheet_id": "학습지_01_사인법칙",
      "challenges": [
        {
          "source": "수능특강_사인법칙코사인법칙",
          "problem_id": "example_3",
          "label": "수능특강 사인법칙·코사인법칙 예제 3",
          "added_at": "2026-05-09",
          "curated_by": "problem-curator"
        }
      ]
    }
  ]
}
```

수능특강 해설지 SPA가 이 파일을 fetch해 자기 PROBLEMS에 `usedAsChallengeIn` 배지 렌더 (선택적 — 또는 매핑을 PROBLEMS 안에 직접 inline).

---

## 에이전트 발전 방향

이 4개는 시작점. 시간이 지나며 추가:

- **worksheet-author** — 학습지 빌더 (단원 + 학습 목표 → 학습지 초안)
- **marking-auditor** — 마킹 누락·오류 감사 (학습지 17개 일관성)
- **cross-link-checker** — 학습지 ↔ 수능특강 매핑 일관성 검사
- **student-feedback** — 학생 풀이 분석·코칭 (미래)
- **diagram-generator** — GeoGebra·SVG 시각화 자동 생성

추가 시 이 문서에 책임·입출력 스키마 명시.

---

## 다른 레포·머신에서 사용

이 디렉터리(`.claude/agents/`)는 git에 커밋되어 영속:

- ✅ **이 레포** — 모든 세션·동료가 자동 사용
- ⚠️ **다른 레포** — 복사 필요. 옵션:
  1. 단순 복사 (`cp -r .claude/agents/ /path/to/other-repo/.claude/`)
  2. git submodule (별도 레포로 분리한 후)
  3. `~/.claude/agents/` 글로벌 (한 머신의 모든 레포에서 사용)

장기적으로 안정화되면 별도 레포 또는 npm 패키지로 분리 가능.
