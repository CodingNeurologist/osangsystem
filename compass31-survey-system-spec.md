# COMPASS-31 설문 및 채점 시스템 설계서

> Claude Code 마이그레이션용 기술 설계서  
> 작성일: 2026-03-01

---

## 1. 시스템 개요

COMPASS-31 (Composite Autonomic Symptom Score)은 자율신경계 기능을 평가하는 표준화된 31문항 설문이다.  
이 시스템은 **설문 데이터 정의 → 조건부 문항 노출 → 가중치 기반 채점 → 영역별 시각화 → 추이 추적**까지의 전체 파이프라인을 구현한다.

### 참고 문헌
- Sletten DM, Suarez GA, Low PA, Mandrekar J, Singer W. Mayo Clin Proc. 2012;87(12):1196-1201.

---

## 2. 데이터 모델

### 2-1. TypeScript 타입 정의

```typescript
// src/types/index.ts

interface SurveyQuestion {
  id: string;                    // 고유 ID (예: 'c31-1')
  text: string;                  // 문항 텍스트 (한국어)
  type: 'single' | 'multiple' | 'scale' | 'text' | 'slider' | 'timeRange';
  options?: string[];            // 선택지 목록
  optionScores?: number[];       // 각 선택지에 대응하는 점수 (options와 1:1 매핑)
  domain?: string;               // 소속 영역 (예: 'orthostatic')
  showIf?: {                     // 조건부 노출 로직
    questionId: string;          // 참조 문항 ID
    equals?: string;             // 해당 값일 때 노출
    notEquals?: string;          // 해당 값이 아닐 때 노출
  };
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
  sliderUnit?: string;
  timeRangeLabels?: { start: string; end: string };
  required: boolean;
}

interface Survey {
  id: string;                    // 'compass-31'
  title: string;
  description: string;
  questions: SurveyQuestion[];
  scoringRules?: ScoringRule[];
  scoringType?: 'simple' | 'weighted';  // COMPASS-31은 'weighted'
  domainWeights?: Record<string, number>;
  repeatable?: boolean;          // true → 반복 시행 가능
}

interface ScoringRule {
  minScore: number;
  maxScore: number;
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  interpretation: string;       // 한국어 해석문
}
```

### 2-2. DB 스키마 (survey_responses 테이블)

```sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  survey_id TEXT NOT NULL,           -- 'compass-31'
  answers JSONB NOT NULL DEFAULT '{}',  -- { "c31-1": "예", "c31-2": "가끔", ... }
  total_score INTEGER,               -- ⚠️ INTEGER 타입 → 가중치 결과는 Math.round() 필수
  severity TEXT,                     -- 'minimal' | 'mild' | 'moderate' | 'severe'
  duration INTEGER NOT NULL DEFAULT 0,  -- 소요 시간 (초)
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> **핵심 제약**: `total_score`가 INTEGER이므로 가중치 채점 결과(소수점)는 반드시 `Math.round()` 후 저장.

### 2-3. custom_surveys 테이블 (관리자 커스텀 설문용)

```sql
CREATE TABLE custom_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id TEXT NOT NULL,           -- 고유 식별자
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  questions JSONB NOT NULL DEFAULT '[]',
  scoring_rules JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 3. COMPASS-31 문항 데이터 (31문항)

### 3-1. 6개 영역 구성

| # | 영역 (Domain) | 문항 | Raw Max | Weighted Max | 가중치 |
|---|--------------|------|---------|--------------|--------|
| 1 | Orthostatic Intolerance (기립성) | Q1-Q4 | 10 | 40 | 4.0000 |
| 2 | Vasomotor (혈관운동) | Q5-Q7 | 6 | 5 | 0.8333 |
| 3 | Secretomotor (분비운동) | Q8-Q11 | 7 | 15 | 2.1429 |
| 4 | Gastrointestinal (소화기) | Q12-Q23 | 28 | 25 | 0.8929 |
| 5 | Bladder (방광) | Q24-Q26 | 9 | 10 | 1.1111 |
| 6 | Pupillomotor (동공운동) | Q27-Q31 | 15 | 5 | 0.3333 |
| | **합계** | **31** | | **100** | |

### 3-2. 가중치 계산 공식

```
weight = Weighted Max / Raw Max
예: 기립성 = 40 / 10 = 4.0
```

### 3-3. 조건부 노출(showIf) 규칙

COMPASS-31에서 사용하는 조건부 분기:

| 조건 문항 | 조건 | 노출되는 문항 |
|-----------|------|--------------|
| Q1 (c31-1) = '예' | equals | Q2, Q3, Q4 |
| Q5 (c31-5) = '예' | equals | Q6, Q7 |
| Q16 (c31-16) = '예' | equals | Q17, Q18, Q19 |
| Q20 (c31-20) = '예' | equals | Q21, Q22, Q23 |
| Q27 (c31-27) ≠ '전혀 없다' | notEquals | Q28 |
| Q29 (c31-29) ≠ '전혀 없다' | notEquals | Q30 |

> 조건부 분기로 인해 **실제 노출 문항 수는 20~31개로 가변**적이다.

### 3-4. 전체 문항 상세

#### Domain 1: Orthostatic Intolerance (기립성)

**Q1 (c31-1)** — Gate question  
- 문항: "지난 1년간, 앉거나 누운 자세에서 일어설 때 어지럽거나, 눈앞이 캄캄해지거나, 머리가 멍해진 적이 있습니까?"
- type: `single`
- options: `['예', '아니오']`
- optionScores: `[1, 0]`
- domain: `orthostatic`

**Q2 (c31-2)** — showIf: c31-1 = '예'
- 문항: "일어설 때 이런 증상이 얼마나 자주 있었습니까?"
- options: `['드물게', '가끔', '자주', '거의 항상']`
- optionScores: `[0, 1, 2, 3]`

**Q3 (c31-3)** — showIf: c31-1 = '예'
- 문항: "이 증상은 어느 정도로 심합니까?"
- options: `['가벼움', '중간 정도', '심함']`
- optionScores: `[1, 2, 3]`

**Q4 (c31-4)** — showIf: c31-1 = '예'
- 문항: "지난 1년간, 이 증상은 어떻게 변했습니까?"
- options: `['많이 나빠졌다', '다소 나빠졌다', '비슷하다', '다소 좋아졌다', '많이 좋아졌다', '완전히 없어졌다']`
- optionScores: `[3, 2, 1, 0, 0, 0]`

#### Domain 2: Vasomotor (혈관운동)

**Q5 (c31-5)** — Gate question
- 문항: "지난 1년간, 피부색이 빨갛게, 하얗게, 또는 보라색으로 변한 적이 있습니까?"
- type: `single`
- options: `['예', '아니오']`
- optionScores: `[1, 0]`

**Q6 (c31-6)** — showIf: c31-5 = '예'
- 문항: "어느 부위에서 피부색 변화가 나타났습니까?"
- type: `multiple` ⚠️ **유일한 multiple 타입 문항**
- options: `['손', '발']`
- **채점**: 선택 개수 = 점수 (손+발 = 2점, 하나만 = 1점)

**Q7 (c31-7)** — showIf: c31-5 = '예'
- 문항: "지난 1년간, 피부색 변화는 어떻게 변했습니까?"
- options: `['많이 나빠졌다', '다소 나빠졌다', '비슷하다', ...]`
- optionScores: `[3, 2, 1, 0, 0, 0]`

#### Domain 3: Secretomotor (분비운동)

**Q8 (c31-8)** — 무조건 노출
- 문항: "지난 5년간, 전체적인 땀 분비량에 변화가 있었습니까?"
- options: `['땀이 훨씬 많아졌다', '땀이 다소 많아졌다', '변화 없다', '땀이 다소 줄었다', '땀이 훨씬 줄었다']`
- optionScores: `[1, 0, 0, 1, 2]` ⚠️ 양방향 변화 모두 점수

**Q9 (c31-9)** — "눈이 지나치게 건조합니까?" → `[1, 0]`

**Q10 (c31-10)** — "입이 지나치게 건조합니까?" → `[1, 0]`

**Q11 (c31-11)** — 무조건 노출
- 문항: "가장 오래된 건조 증상(눈 또는 입)은 어떻게 변했습니까?"
- options: `['건조 증상이 없었다', '많이 나빠졌다', ...]`
- optionScores: `[0, 3, 2, 1, 0, 0, 0]`

#### Domain 4: Gastrointestinal (소화기) — 12문항

**Q12-Q15**: 무조건 노출, 각각 독립 증상
- Q12: 포만감 속도 변화 → `[2, 1, 0, 0, 0]`
- Q13: 식사 후 더부룩함 → `[0, 1, 2]`
- Q14: 식사 후 구토 → `[0, 1, 2]`
- Q15: 복부 경련 → `[0, 1, 2]`

**Q16-Q19**: 설사 Gate (Q16 = '예' → Q17, Q18, Q19 노출)
- Q16: `[1, 0]`
- Q17: 빈도 `[0, 1, 2, 3]`
- Q18: 심각도 `[1, 2, 3]`
- Q19: 변화 추이 `[3, 2, 1, 0, 0, 0]`

**Q20-Q23**: 변비 Gate (Q20 = '예' → Q21, Q22, Q23 노출)
- 설사와 동일 구조

#### Domain 5: Bladder (방광) — 3문항, 모두 무조건 노출

- Q24: 소변 참기 어려움 → `[0, 1, 2, 3]`
- Q25: 배뇨 곤란 → `[0, 1, 2, 3]`
- Q26: 잔뇨감 → `[0, 1, 2, 3]`

#### Domain 6: Pupillomotor (동공운동) — 5문항

**Q27 (c31-27)**: "밝은 빛 불편" → `[0, 1, 2, 3]`

**Q28 (c31-28)**: showIf: c31-27 ≠ '전혀 없다' (notEquals)
- "밝은 빛 민감함 정도" → `[1, 2, 3]`

**Q29 (c31-29)**: "초점 맞추기 어려움" → `[0, 1, 2, 3]`

**Q30 (c31-30)**: showIf: c31-29 ≠ '전혀 없다' (notEquals)
- "초점 문제 정도" → `[1, 2, 3]`

**Q31 (c31-31)**: 무조건 노출
- "가장 불편한 눈 증상 변화"
- optionScores: `[0, 3, 2, 1, 0, 0, 0]`

---

## 4. 채점 알고리즘

### 4-1. 전체 채점 흐름

```
1. 설문 제출 시 숨겨진 문항(showIf 미충족)의 답변 제거 (cleanAnswers)
2. scoringType 확인 → 'weighted'이면 가중치 채점 수행
3. 영역별 Raw Score 합산
4. Raw Score × 가중치 = Weighted Score (영역별)
5. 전체 Weighted Score 합산 = Total Score
6. Total Score에 대해 scoringRules 매칭 → severity 결정
7. Total Score를 Math.round()하여 DB 저장
```

### 4-2. 채점 코드 (surveyScoring.ts)

```typescript
function calculateWeightedScore(survey, answers) {
  const domainRawScores = {};

  for (const q of survey.questions) {
    if (!q.domain) continue;
    const answer = answers[q.id];
    if (answer === undefined || answer === null || answer === '') continue;

    if (!domainRawScores[q.domain]) domainRawScores[q.domain] = 0;

    if (q.type === 'multiple' && Array.isArray(answer)) {
      // multiple 타입: 선택 개수 = 점수
      domainRawScores[q.domain] += answer.length;
    } else if (q.type === 'single' && typeof answer === 'string') {
      // single 타입: options에서 인덱스 찾아 optionScores 매핑
      const idx = q.options.indexOf(answer);
      if (idx >= 0 && idx < q.optionScores.length) {
        domainRawScores[q.domain] += q.optionScores[idx];
      }
    }
  }

  const domainScores = {};
  let totalScore = 0;

  for (const [domain, weight] of Object.entries(survey.domainWeights)) {
    const raw = domainRawScores[domain] || 0;
    const weighted = Math.round(raw * weight * 100) / 100;
    domainScores[domain] = weighted;
    totalScore += weighted;
  }

  totalScore = Math.round(totalScore * 100) / 100;

  const severity = survey.scoringRules?.find(
    r => totalScore >= r.minScore && totalScore <= r.maxScore
  )?.severity;

  return { totalScore, severity, domainScores };
}
```

### 4-3. 조건부 문항 필터링

```typescript
function getVisibleQuestions(questions, answers) {
  return questions.filter(q => {
    if (!q.showIf) return true;
    const depAnswer = answers[q.showIf.questionId];
    if (depAnswer === undefined || depAnswer === null) return false;
    if (q.showIf.equals !== undefined) return String(depAnswer) === q.showIf.equals;
    if (q.showIf.notEquals !== undefined) return String(depAnswer) !== q.showIf.notEquals;
    return true;
  });
}
```

> **중요**: 제출 시 `getVisibleQuestions()`로 필터링하여 숨겨진 문항의 기존 답변을 제거해야 함.

### 4-4. 중증도 분류 기준

| 총점 범위 | 중증도 | 라벨 | 해석 |
|-----------|--------|------|------|
| 0-20 | minimal | 정상 | 자율신경 기능이 대체로 양호한 수준 |
| 21-40 | mild | 경미 | 경미한 자율신경 기능 변화. 생활습관 점검 권고 |
| 41-60 | moderate | 중등도 | 중등도 변화. 전문의 상담 권고 |
| 61-100 | severe | 심각 | 뚜렷한 변화. 빠른 전문의 상담 권고 |

---

## 5. 설문 진행 UI (Survey.tsx)

### 5-1. 핵심 UX 패턴

1. **한 문항씩 표시** (카드 형태, 전체 진행률 상단에 표시)
2. **자동 진행**: single/scale 문항 선택 시 300ms 후 자동으로 다음 문항 이동
3. **수동 진행**: multiple/text/slider/timeRange는 '다음' 버튼 클릭
4. **이전/다음 네비게이션**: 하단 고정 Footer
5. **마지막 문항 자동제출**: 자동진행 시 마지막 문항이면 바로 제출

### 5-2. 답변 저장 구조

```typescript
// answers 상태
Record<string, string | string[] | number>

// 예시
{
  "c31-1": "예",           // single → 선택지 텍스트
  "c31-2": "가끔",         // single
  "c31-6": ["손", "발"],   // multiple → 배열
  "c31-24": "가끔",        // single
}
```

### 5-3. 제출 프로세스

```
1. answers에서 visibleQuestions에 포함된 것만 cleanAnswers로 필터
2. calculateSurveyScore(survey, cleanAnswers) 호출
3. totalScore를 Math.round() 처리
4. survey_responses 테이블에 INSERT
5. 설문 ID에 따라 라우팅:
   - initial-assessment → /patient/survey-complete/{id}
   - 그 외 (compass-31 포함) → /patient/result/{id}
```

---

## 6. 결과 화면 (Result.tsx)

### 6-1. COMPASS-31 전용 영역별 시각화

```typescript
const DOMAIN_LABELS = {
  orthostatic: '기립성',
  vasomotor: '혈관운동',
  secretomotor: '분비운동',
  gastrointestinal: '소화기',
  bladder: '방광',
  pupillomotor: '동공운동',
};

const DOMAIN_MAX_WEIGHTED = {
  orthostatic: 40,
  vasomotor: 5,
  secretomotor: 15,
  gastrointestinal: 25,
  bladder: 10,
  pupillomotor: 5,
};
```

### 6-2. 시각화 컴포넌트

- **가로 바 차트** (recharts `BarChart` layout="vertical")
  - X축: 0~100% (영역별 가중 점수 / 영역 최대값 × 100)
  - Y축: 영역 라벨
  - 색상: 퍼센티지에 따른 동적 컬러
    - ≤25%: `hsl(var(--success))` (녹색)
    - ≤50%: `hsl(var(--primary))` (메인 컬러)
    - ≤75%: `hsl(var(--warning))` (노란색)
    - >75%: `hsl(var(--destructive))` (빨간색)

- **영역별 상세 리스트**: 각 영역의 실제 점수 / 최대점수 표시

### 6-3. 공통 결과 표시

- 총점: `{score} / {maxPossible}` 형식
- 중증도 배지: 아이콘 + 라벨 + 배경색
- 해석문: scoringRules에서 매칭된 interpretation 표시
- **면책 문구** (필수): "이 결과는 참고용 자가점검 도구이며, 의사의 진단이나 치료를 대체하지 않습니다."

---

## 7. 설문 이력 및 추이 (SurveyHistory + SurveyTrendSheet)

### 7-1. 설문 이력 목록

- `repeatable: true`인 설문만 표시 (initial-assessment 제외)
- 각 설문 카드: 최근 점수, 중증도 라벨, 시행 횟수, 추이 아이콘
- 추이: 마지막 2회 비교 → improving(↓) / worsening(↑) / stable(−)

### 7-2. 추이 Bottom Sheet

- **요약 카드** (3열): 최근 점수, 평균, 변화량
- **추이 차트** (recharts `AreaChart`):
  - 2회 이상 시행 시 표시
  - X축: 날짜 (MM/dd)
  - Y축: 점수
  - 평균선 (ReferenceLine, 점선)
  - 그라디언트 Fill
- **시행 이력 리스트**: 날짜, 점수, 중증도 배지, 각 항목 클릭 시 상세 결과로 이동

---

## 8. 문항 타입별 UI 컴포넌트

### 8-1. SingleChoiceQuestion

- 세로 목록 버튼, 선택 시 체크 아이콘 + 하이라이트
- 선택 후 `onSingleSelect` 콜백 → 300ms 자동진행

### 8-2. MultipleChoiceQuestion

- 체크박스 스타일 다중선택
- '다음' 버튼으로 수동 진행

### 8-3. ScaleQuestion

- 숫자 버튼 가로 배열 (scaleMin ~ scaleMax)
- 선택 시 그라디언트 강조 + 자동진행

### 8-4. SliderQuestion (초진 설문용)

- 드래그 슬라이더
- 값에 따라 색상 보간 (녹색→빨간색, HSL hue 120→0)
- 단위 표시

### 8-5. TextQuestion

- Textarea, 1000자 카운터 표시

### 8-6. TimeRangeQuestion (초진 설문용)

- 취침/기상 시간 슬라이더 2개
- 총 수면시간 자동 계산
- "수면이 매우 불규칙합니다" 체크박스 → 시간 입력 비활성화
- 데이터 저장: JSON 문자열
  ```json
  {"bedtime": 1380, "wakeTime": 420, "bedtimeLabel": "오후 11시", "wakeTimeLabel": "오전 7시", "irregular": false}
  ```

---

## 9. 설문 소스 구조 (정적 + 동적)

### 9-1. 정적 설문 (하드코딩)

```
src/data/surveys.ts     → INITIAL_SURVEY, PHQ9_SURVEY, GAD7_SURVEY 정의 + ALL_SURVEYS 배열 export
src/data/compass31.ts   → COMPASS31_SURVEY 정의 (별도 파일, surveys.ts에서 import)
```

### 9-2. 동적 설문 (DB)

- `custom_surveys` 테이블에 관리자가 생성
- `useAllSurveys` 훅: 정적 + DB 설문을 합쳐서 반환

```typescript
const allSurveys = [...STATIC_SURVEYS, ...customSurveys];
```

### 9-3. 관리자 설문 관리 (useSurveyManagement)

- CRUD: addSurvey, updateSurvey, deleteSurvey
- 문항 텍스트, 선택지, 점수, 채점 규칙 편집 가능

---

## 10. RLS 정책 (survey_responses)

```sql
-- 환자: 자기 데이터만 CRUD
CREATE POLICY "Patients can insert their own responses" ON survey_responses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM patients WHERE patients.id = survey_responses.patient_id AND patients.user_id = auth.uid())
  );

CREATE POLICY "Patients can view their own responses" ON survey_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM patients WHERE patients.id = survey_responses.patient_id AND patients.user_id = auth.uid())
  );

-- 관리자: 모든 응답 조회 가능
CREATE POLICY "Admins can view all responses" ON survey_responses
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
```

---

## 11. 설문별 라우팅

| 경로 | 용도 |
|------|------|
| `/patient/survey/:surveyId` | 설문 진행 (Survey.tsx) |
| `/patient/result/:surveyId` | 최근 결과 조회 (Result.tsx) |
| `/patient/survey-complete/:surveyId` | 초진 설문 완료 (SurveyComplete.tsx) |
| `/patient/survey-history` | 반복 설문 이력 (SurveyHistory.tsx) |

---

## 12. 보안 및 법적 요구사항

1. 모든 결과 화면에 면책 문구 포함
2. 직접 진단/치료 표현 절대 금지 → "증상 수준" "경향" 표현만 사용
3. 설문 응답 데이터는 patient_id로만 연결, 개인 식별정보와 분리 저장

---

## 13. 구현 순서 권장

```
1. TypeScript 타입 정의 (types/index.ts)
2. COMPASS-31 문항 데이터 (data/compass31.ts)
3. 채점 유틸리티 (utils/surveyScoring.ts) — simple + weighted
4. 조건부 문항 필터 (getVisibleQuestions)
5. 문항 UI 컴포넌트 6종
6. 설문 진행 페이지 (Survey.tsx) — 자동진행 포함
7. 결과 페이지 (Result.tsx) — 영역별 바 차트
8. 이력/추이 (SurveyHistory + SurveyTrendSheet)
9. 관리자 설문 관리 (SurveyManagement)
10. E2E 검증: 설문 시작 → 조건분기 → 채점 → 결과 시각화 → 이력 조회
```

---

## 14. 답변 포맷 유틸리티 (formatAnswer)

관리자 결과 조회 시 답변을 사람이 읽을 수 있는 형태로 변환:

```typescript
function formatAnswer(answer: unknown): string {
  if (Array.isArray(answer)) return answer.join(', ');
  // TimeRange JSON 파싱
  try {
    const parsed = JSON.parse(String(answer));
    if ('bedtime' in parsed) {
      if (parsed.irregular) return '수면이 매우 불규칙함';
      return `취침시간 ${parsed.bedtimeLabel}, 기상시간 ${parsed.wakeTimeLabel}`;
    }
  } catch {}
  return String(answer);
}
```

---

## 15. 주요 엣지 케이스

| 케이스 | 처리 방법 |
|--------|-----------|
| Gate 문항에 '아니오' 선택 후 재선택 '예' | 하위 문항이 다시 visible, 기존 답변 없으면 필수 응답 유도 |
| Gate 문항 '예' → 하위 답변 후 → '아니오'로 변경 | 제출 시 cleanAnswers에서 숨겨진 문항 답변 제거 |
| Multiple 문항 (Q6) 0개 선택 | required이므로 '다음' 버튼 비활성화 |
| 총점이 소수점 (예: 42.857...) | Math.round() → 43으로 DB 저장, severity 판정은 소수점 기준 |
| 설문 중 이탈 | confirm 다이얼로그로 경고, 미저장 데이터 손실 안내 |
