# OsangCare Frontend UI/UX 지침서

> 오상케어의 프론트엔드 디자인 시스템, 컴포넌트 패턴, 페이지별 UX 전략을 정의하는 문서입니다.
> 모든 UI 구현은 이 지침서를 기준으로 합니다.

---

## 1. 앱 아이덴티티 및 디자인 철학

### 1.1 감성 3축

오상케어의 사용자는 자율신경실조증, 만성 스트레스, 우울, 불안 등 심리적으로 민감한 상태에 있을 수 있습니다. 모든 UI는 다음 세 가지 감성 축을 따릅니다.

| 축 | 의미 | 구현 방법 |
|---|---|---|
| 신뢰감 | "나를 알아주는 전문가" | 병원명 노출, 면책 고지, 정돈된 레이아웃 |
| 따뜻함 | "차갑지 않은 의료" | 골드 브랜드 컬러, 공감 문구, 부드러운 곡선 |
| 차분함 | "과하지 않은 안정감" | 넉넉한 여백, 미니멀 인터랙션, 느린 애니메이션 |

### 1.2 참조 모델

- **토스 (Toss)**: 카드 기반 레이아웃, 충분한 여백, 명확한 계층 구조
- **카카오헬스**: 건강 데이터 시각화, 차트 스타일
- **마인드카페**: 심리 안전 UX, 위기 대응 UI 패턴
- **Linear / Vercel / Notion**: 미니멀 디자인, 깔끔한 여백

### 1.3 톤 가이드 (문구 작성 원칙)

- 판단하지 않기: "나쁜 점수"라고 표현하지 않음
- 행동 유도: "다음 단계"를 항상 제시
- 공감 표현: "힘드셨을 텐데" 등 감정 인정
- 과잉 긍정 금지: "대단해요!" 같은 과도한 칭찬 지양
- 위기 문구 톤 통일: "지금 많이 힘드시죠. 혼자 감당하지 않으셔도 됩니다."
- 금지: `**굵은 텍스트**` 남용, 과도한 이모지, AI 느낌 표현

---

## 2. 컬러 시스템

### 2.1 Core Palette

CSS 변수 기반(`globals.css`의 `:root`에 정의):

```
/* === Primary Brand (골드) === */
--primary:            37 42% 55%     /* #b7945a 메인 브랜드 */
--primary-foreground: 0 0% 100%     /* 흰색 텍스트 */
--accent:             37 47% 47%     /* 다크 골드 (텍스트용) */

/* === Neutral Base (zinc 계열) === */
--background:         0 0% 100%     /* 순백 배경 */
--foreground:         240 10% 3.9%  /* 거의 검정 본문 */
--muted:              240 4.8% 95.9%  /* 회색 배경 */
--muted-foreground:   240 3.8% 46.1%  /* 보조 텍스트 */
--border:             240 5.9% 90%    /* 경계선 */
--card:               0 0% 100%      /* 카드 배경 */

/* === Semantic === */
--destructive:        0 84.2% 60.2%  /* 위험/에러 */
--success:            152 50% 42%    /* 성공 */
--warning:            38 85% 50%     /* 경고 */
```

### 2.2 설문 중증도 토큰 (Survey Severity)

설문 결과의 중증도 표시에 사용합니다. 하드코딩 금지 — 반드시 CSS 변수를 참조합니다.

```
--severity-normal:    142 71% 45%   /* 초록 — 정상 */
--severity-mild:      45 93% 47%    /* 노랑 — 경미 */
--severity-moderate:  38 92% 50%    /* 주황 — 중등도 */
--severity-severe:    0 84% 60%     /* 빨강 — 중증/위기 */
```

### 2.3 차트 전용 토큰

Recharts 시리즈 색상:

```
--chart-phq9:  200 98% 39%   /* 파랑 — PHQ-9 우울 */
--chart-gad7:  262 83% 58%   /* 보라 — GAD-7 불안 */
--chart-asrs:  160 84% 39%   /* 초록 — ASRS ADHD */
```

### 2.4 표면 계층 (Surface Hierarchy)

```
Layer 0 (페이지 배경):  bg-zinc-50       → /check 등 분리 배경
Layer 1 (앱 기본):     bg-background    → 흰색 메인 배경
Layer 2 (카드):        bg-white         → 카드, 입력 필드
Layer 3 (강조):        bg-primary/5     → 브랜드 강조 배경
Layer 4 (상태):        bg-red-50 등      → 알림, 배너 배경
Layer 5 (오버레이):    bg-slate-900     → SOS 풀스크린 모드
```

### 2.5 알림 배너 4단계

```
Critical (위기):   border-red-300    bg-red-50    text-red-700
Warning  (중증):   border-orange-300 bg-orange-50 text-orange-700
Caution  (중등도): border-yellow-200 bg-yellow-50 text-yellow-700
Info     (경증):   border-blue-200   bg-blue-50   text-blue-700
```

### 2.6 다크 모드 (추후 구현)

CSS 변수 기반 설계가 되어 있으므로 추후 확장 가능합니다.
- 골드 primary를 다크 배경에서 `hsl(37, 50%, 60%)`으로 약간 밝게 조정
- 중증도 컬러는 채도 낮추고 밝기 높임

---

## 3. 타이포그래피

### 3.1 폰트 스택

```typescript
// next/font/google 사용 (권장)
import { Noto_Sans_KR } from 'next/font/google'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  preload: true,
})
```

### 3.2 Type Scale

| 역할 | Tailwind 클래스 | 용도 |
|------|----------------|------|
| Display | `text-2xl font-semibold leading-relaxed` | 랜딩/SOS 대형 텍스트 |
| H1 | `text-2xl font-semibold text-zinc-900` | 페이지 제목 |
| H2 | `text-lg font-semibold text-zinc-900` | 섹션 제목 |
| H3 | `text-base font-semibold text-zinc-900` | 카드/서브섹션 제목 |
| Body | `text-sm text-zinc-700 leading-relaxed` | 본문 텍스트 |
| Body (설문) | `text-base text-zinc-900 leading-relaxed` | 설문 문항 텍스트 (16px) |
| Body Small | `text-sm text-zinc-500` | 보조 설명, 날짜 |
| Caption | `text-xs text-zinc-500` | 진행률, 메타 정보 |
| Micro | `text-[10px] text-zinc-400` | 네비게이션 라벨 |

### 3.3 한국어 가독성

```css
body {
  word-break: keep-all;        /* 한국어 단어 단위 줄바꿈 */
  overflow-wrap: break-word;   /* 긴 영문 URL 처리 */
  font-feature-settings: 'kern' 1;  /* 커닝 활성화 */
}
```

- 본문 기본 `line-height`: `leading-relaxed` (1.625)
- 제목 `letter-spacing`: `tracking-tight` 허용하되, 한국어에서 음수값 주의
- 숫자 표시: `tabular-nums` 통일 적용 (점수, 타이머, 통계)

---

## 4. 간격 및 레이아웃

### 4.1 4px 그리드

| Tailwind | px | 용도 |
|----------|-----|------|
| `p-1` | 4px | 아이콘 내부 패딩 |
| `p-2` / `gap-2` | 8px | 작은 요소 간격 |
| `p-3` / `gap-3` | 12px | 카드 내부 콤팩트, 기능 카드 그리드 갭 |
| `p-4` / `gap-4` | 16px | 카드 표준 패딩, 페이지 좌우 패딩 |
| `p-5` | 20px | CTA 카드 패딩 |
| `p-6` / `gap-6` | 24px | 카드 넉넉한 패딩, 섹션 간격 |

### 4.2 페이지 레이아웃

```
페이지 패딩:     px-4 py-6  (모바일) / px-6 py-8  (데스크톱)
최대 너비:       max-w-2xl mx-auto  (672px)
섹션 간격:       space-y-6
카드 내 요소:    space-y-3 ~ space-y-4
그리드 갭:       gap-2 (작은) / gap-3 (기능 카드)
리스트 아이템:   space-y-2
```

### 4.3 Border Radius

```
rounded-full:   → 아바타, 배지, 토글 칩
rounded-2xl:    → CTA 대형 카드
rounded-xl:     → 카드, 네비게이션 아이콘 배경 (12px)
rounded-lg:     → 선택지 버튼, 입력 필드, 알림 배너 (8px)
```

### 4.4 Shadow 체계

```
shadow-none:    → 기본 카드 (border로 구분)
shadow-sm:      → Card 컴포넌트 기본값
shadow-md:      → 호버 시 카드 상승 효과
shadow-lg:      → CTA 카드 (shadow-primary/20 포함)
shadow-soft:    → 커스텀: 0 2px 12px -2px rgba(0,0,0,0.06)
```

### 4.5 Z-Index 관리

```
z-10:   sticky 요소 (테이블 헤더 등)
z-20:   드롭다운, 팝오버
z-30:   모달 배경 (overlay)
z-40:   앱 네비게이션 (헤더 + 하단 탭)
z-50:   모달 콘텐츠, SOS 풀스크린
z-[100]: 토스트 알림 (Sonner)
```

### 4.6 반응형 브레이크포인트

```
< 375px:     최소 지원 (iPhone SE)
375-672px:   기본 레이아웃 (메인 타겟)
672px+:      max-w-2xl 중앙 정렬, 좌우 여백 자동
1024px+:     관리자 대시보드에서만 확장 레이아웃 (max-w-6xl)
```

---

## 5. 컴포넌트 패턴

### 5.1 카드 5종

**Feature Card** (기능 카드 — 홈 2x2 그리드):
```
구조: 아이콘(bg-secondary 배경) + 제목 + 설명
스타일: rounded-xl shadow-sm border border-zinc-100 bg-white
호버:  hover:-translate-y-0.5 hover:shadow-md
크기:  p-4, 아이콘 w-9 h-9
```

**List Card** (리스트 카드 — 연락처, 치료 안내):
```
구조: 왼쪽 아이콘 + 중앙 텍스트(제목+설명) + 오른쪽 ChevronRight
스타일: rounded-xl border border-border hover:bg-zinc-50
크기:  p-4, 아이콘 w-9 h-9
```

**CTA Card** (행동 유도 — 설문 시작):
```
스타일 A (강조): bg-primary text-primary-foreground shadow-lg shadow-primary/20
스타일 B (연한): border-primary/20 bg-primary/5
인터랙션: active:scale-[0.98]
```

**Result Card** (결과 카드 — 설문 결과):
```
구조: CardHeader(제목 + Badge) + CardContent(점수 + Progress + 해석)
스타일: rounded-xl shadow-sm border border-zinc-100 bg-white
```

**Empty State** (빈 상태):
```
구조: 중앙 정렬 텍스트 + CTA 버튼
스타일: text-center py-10
```

### 5.2 버튼 계층

shadcn `<Button>` 컴포넌트만 사용합니다. HTML `<button>` 직접 스타일링은 금지입니다.

```
Primary (default):  → 주요 CTA: "시작하기", "저장", "결과 확인"
Outline:            → 보조 행동: "이전", "다시 작성", "중단"
Ghost:              → 부차적 행동: "다시 진단하기", 삭제
Destructive:        → 위험 행동: 계정 삭제 등

크기: default(h-10), sm(h-9), lg(h-11 px-8), icon(h-10 w-10)
```

### 5.3 설문 선택지 통일

System A(COMPASS-31/StressCheck)와 System B(PHQ-9/GAD-7/ASRS) 모두 동일한 선택지 스타일을 사용합니다.

```
기본:    border border-zinc-200 rounded-lg px-4 py-3 min-h-[44px]
선택됨:  border-primary bg-primary/5 text-zinc-900
호버:    hover:bg-zinc-50
체크:    w-5 h-5 rounded-full border-2 (single) / shadcn Checkbox (multiple)
```

### 5.4 ToggleChip 패턴

호흡 패턴 선택, 배경음 선택, 사이클 선택 등 토글형 칩 버튼:

```
기본:    px-3 py-1 rounded-full text-xs bg-zinc-50 text-zinc-500 hover:bg-zinc-100
활성:    bg-zinc-900 text-white
```

### 5.5 로딩 상태

- 서버 컴포넌트: `loading.tsx`에서 shadcn `<Skeleton>` 사용
- 버튼 내: "저장 중...", "로그인 중...", "계산 중..." 텍스트 변경 + disabled
- 빈 화면 노출 금지

---

## 6. 인터랙션 및 애니메이션

### 6.1 기본 규칙

```
전환:        transition-colors duration-150     (모든 인터랙티브 요소)
호버:        hover:bg-zinc-50                   (리스트 아이템)
카드 호버:    hover:-translate-y-0.5 hover:shadow-md
포커스:       focus-visible:ring-2 ring-offset-2  (접근성 필수)
비활성화:     opacity-50 cursor-not-allowed
```

### 6.2 애니메이션

```css
/* 페이지 진입 (기본) */
.fade-in   { animation: fadeIn  0.4s ease-out forwards; }
.slide-up  { animation: slideUp 0.4s ease-out forwards; }
.pulse-soft { animation: pulseSoft 2s ease-in-out infinite; }

/* 호흡 가이드 전용 */
원형 스케일: cubic-bezier(0.22, 1, 0.36, 1)
```

### 6.3 페이지 전환

- 설문 카테고리 전환: `opacity + translateX` 150ms fade-out → 50ms fade-in
- 앱 내 페이지 진입: `.slide-up` 클래스 적용
- SOS 모드 진입: 즉시 전환 (애니메이션 없음, 긴급 상황)

---

## 7. 페이지별 UX 가이드

### 7.1 랜딩 (/)

- 단일 화면 (스크롤 없음), 100dvh 안에 모든 요소
- 핵심 카피: "회원가입 없이 무료로 이용하실 수 있습니다"
- 로고 애니메이션: `animate-float` (과하지 않게)
- 로그인 사용자: `/app`으로 자동 리다이렉트

### 7.2 자가체크 (/check)

```
/check (소개) → /check/survey (설문) → 결과 화면 → 자연스러운 가입 유도
```

- 비회원 익명 응답, session_id 기반 저장
- 결과 후 가입 유도: "강요하지 않는 자연스러운 전환"
- "나중에" 버튼 제공

### 7.3 앱 홈 (/app)

콘텐츠 우선순위:
1. 온보딩 미완성 배너 (조건부)
2. 인사말 + 설문 CTA (핵심)
3. 기능 카드 2x2 그리드 (탐색)
4. COMPASS-31 CTA (추가 검사)
5. 병원 정보 (참조)

### 7.4 뉴럴리셋 (/app/neural-reset)

- SOS 긴급 안정 모드: 항상 상단에 접근 가능 (안전 최우선)
- 오늘의 컨디션 체크인 → 추천 활동 개인화
- 스트릭 + 배지로 일일 참여 유도
- 빠른 접근 그리드: 5개 항목 (320px에서 각 56px 이상)

### 7.5 설문 플로우

- 진행률 바 상단 필수 표시
- 불안 감소 UI: 3문항/페이지, 자동 진행 (single 선택)
- 문항 텍스트: `text-base` (16px, 14px 아님)
- 면책 고지: 항상 하단 표시
- 이탈 방지: 진행 중 뒤로가기 확인

### 7.6 결과 표시

순서:
1. 안전 프로토콜 배너 (PHQ-9 점수 기반, 조건부)
2. 점수 + 등급 Badge
3. Progress 바 (시각적 비율)
4. 결과 해석 텍스트
5. 면책 고지
6. 액션 버튼 (차트 보기 / 다시 작성)

### 7.7 마이페이지 (/app/mypage)

- 프로필 요약 + 메뉴 리스트 + 로그아웃
- 간결함 유지

---

## 8. 한국 UX 모범 사례

### 8.1 인증

- 카카오 로그인 최우선 배치 (한국 사용자 90%+ 보유)
- 카카오 버튼: `bg-[#FEE500] text-[#191919]` (공식 브랜드 컬러)
- Google 로그인: 보조 옵션

### 8.2 개인정보

- 개인정보 동의 명시적 수집 (체크박스 필수)
- 동의 버전 관리: `privacy_consent_version`
- 처리방침 전문 보기 링크 제공

### 8.3 신뢰 시그널

- 병원명 "오상신경외과"가 헤더에 항상 노출
- 면책 고지 모든 결과 화면에 포함
- 병원 연락처 `tel:` 링크로 즉시 전화 가능
- 위기 시 정신건강위기상담전화 1577-0199 즉시 표시

### 8.4 모바일 최적화

- `max-w-2xl mx-auto` (672px 최대)
- `pb-24` 하단 네비게이션 겹침 방지
- `safe-area-bottom` iPhone 노치/홈 인디케이터 대응
- `min-h-[44px]` 터치 타겟 확보 (Apple HIG 기준)
- `100dvh` 모바일 뷰포트 대응
- `maximumScale: 5` 접근성 줌 허용

### 8.5 고령 사용자 (30-60세 타겟)

- 설문 문항: `text-base` (16px)
- 이모지 + 텍스트 라벨 병행 (무드 선택)
- 충분한 터치 영역 (44px+)
- 과도한 제스처 UI 지양 (스와이프 대신 버튼)

---

## 9. 리텐션 전략

### 9.1 일일 참여 메커니즘

| 요소 | 구현 |
|------|------|
| 스트릭 | 연속 일수 + 불꽃 아이콘, 홈에도 소형 표시 |
| 배지 | 8개 정의 (first-step, streak-3/7/30, breathing-master 등) |
| 데일리 체크인 | 이모지 기반 상태 기록, 1분 이내 완료 |
| 무드 캘린더 | 월별 기분 시각화 |

### 9.2 진보적 공개 (Progressive Disclosure)

```
Day 1:   호흡 가이드 추천 (가장 단순하고 즉각적)
Day 3:   감사일기 추가 공개
Day 7:   소마틱 운동 추가 공개
Day 14:  바이노럴 비트 추가 공개
```

### 9.3 부드러운 리마인더

- 2주 무응답 시: "증상 추적을 이어가세요" (Web Push)
- 스트릭 유지: "어제까지 N일 연속이었어요"
- 배지 획득: 토스트 알림 + 작은 축하 애니메이션

---

## 10. 네이밍 및 코드 컨벤션

### 10.1 컴포넌트

```
페이지:        [Feature]Page          (AppHomePage)     — Server Component
레이아웃:      [Area]Layout           (AppLayout)
UI 컴포넌트:   [Feature][Type]        (BreathingGuide, JournalEditor)
결과 컴포넌트: [Feature]Result        (SurveyResult, Compass31Result)
```

### 10.2 파일

```
데이터 파일:   kebab-case.ts          (breathing-patterns.ts)
컴포넌트:      PascalCase.tsx         (BreathingGuide.tsx)
유틸리티:      camelCase.ts           (surveyScoring.ts)
CSS 변수:      --category-name        (--severity-normal)
상수:          UPPER_SNAKE_CASE       (BREATHING_PATTERNS)
```

### 10.3 커밋 메시지

```
feat: 새 기능 추가
fix: 버그 수정
style: UI/스타일 변경 (기능 변화 없음)
refactor: 코드 리팩토링
docs: 문서 변경
```
