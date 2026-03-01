# questionnaire-builder 스킬

설문지 JSON 스키마 생성, 채점 로직 검증, 표준 가이드라인 참조를 담당한다.

## 트리거 조건

- Phase 2.2: COMPASS-31 자가진단 시스템 구현 시
- Phase 2.3: PHQ-9, GAD-7, ASRS 추적 설문 구현 시

## 사용 방법

### 1. 설문지 JSON 스키마 생성

각 설문지의 가이드라인 파일을 읽고, 표준 형식에 맞는 JSON 스키마를 생성한다.

**출력 위치**: `output/schemas/questionnaire-{type}.json`

### 2. 채점 로직 검증

`scripts/calculate-score.ts`의 함수를 참조하여 TypeScript 채점 로직을 구현한다.

### 3. 검증

`scripts/validate-schema.ts`를 사용하여 생성된 JSON이 필수 필드를 포함하는지 확인한다.

---

## 설문지 JSON 표준 형식

```json
{
  "id": "phq9",
  "title": "우울증 선별 검사 (PHQ-9)",
  "description": "지난 2주 동안 다음과 같은 문제로 얼마나 자주 불편함을 겪으셨나요?",
  "version": "1.0",
  "scoring": {
    "method": "sum",
    "reverse_items": [],
    "max_score": 27
  },
  "severity_levels": [
    { "min": 0, "max": 4, "label": "정상", "level": "normal" },
    { "min": 5, "max": 9, "label": "경증", "level": "mild" },
    { "min": 10, "max": 14, "label": "중등도", "level": "moderate" },
    { "min": 15, "max": 19, "label": "중증", "level": "severe" },
    { "min": 20, "max": 27, "label": "위기", "level": "crisis" }
  ],
  "safety_protocol": {
    "trigger_score": 20,
    "message": "지금 많이 힘드실 것 같습니다. 전문적인 도움을 받으시길 권장합니다.",
    "crisis_line": "1577-0199",
    "crisis_line_name": "정신건강위기상담전화"
  },
  "items": [
    {
      "id": "q1",
      "number": 1,
      "text": "일 또는 여가 활동을 하는 데 흥미나 즐거움을 느끼지 못함",
      "options": [
        { "value": 0, "text": "전혀 없음" },
        { "value": 1, "text": "며칠 동안" },
        { "value": 2, "text": "7일 이상" },
        { "value": 3, "text": "거의 매일" }
      ]
    }
  ],
  "footer_disclaimer": "본 결과는 전문 의료인의 진단을 대체하지 않습니다."
}
```

---

## COMPASS-31 특수 형식 (도메인별 가중치)

COMPASS-31은 6개 도메인으로 구성되며, 각 도메인에 가중치를 적용한 후 합산한다.

```json
{
  "id": "compass31",
  "scoring": {
    "method": "weighted_domain",
    "domains": [
      { "id": "oi", "name": "기립성 저혈압", "weight": 40, "items": ["q1","q2","q3","q4"] },
      { "id": "vm", "name": "혈관운동", "weight": 5, "items": ["q5","q6","q7","q8","q9"] },
      { "id": "sm", "name": "분비", "weight": 15, "items": ["q10","q11","q12","q13","q14","q15","q16","q17","q18","q19","q20"] },
      { "id": "gi", "name": "위장관", "weight": 25, "items": ["q21","q22","q23","q24","q25","q26","q27"] },
      { "id": "bl", "name": "방광", "weight": 10, "items": ["q28","q29","q30"] },
      { "id": "pm", "name": "동공/시각", "weight": 5, "items": ["q31"] }
    ],
    "max_score": 100
  }
}
```

---

## 참고 문서

- `references/phq9-guideline.md`: PHQ-9 공식 채점 가이드라인
- `references/gad7-guideline.md`: GAD-7 공식 채점 가이드라인
- `references/asrs-guideline.md`: ASRS-v1.1 공식 채점 가이드라인
- `references/compass31-guideline.md`: COMPASS-31 도메인별 가중치 채점 가이드라인

## 검증 체크리스트

- [ ] 모든 문항(items) 포함 여부
- [ ] 채점 방식(sum / weighted_domain) 정확성
- [ ] 역순 채점 항목(reverse_items) 누락 없음
- [ ] severity_levels 범위 연속성 (갭 없음)
- [ ] 안전 프로토콜(safety_protocol) PHQ-9에 포함 여부
- [ ] footer_disclaimer 포함 여부
- [ ] 한국어 문항 자연스러움
