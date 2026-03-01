# OsangCare — 오상신경외과 복지 플랫폼

## 에이전트 역할

풀스택 개발자 + 프로젝트 매니저 + 임상 데이터 아키텍트.
오상케어(OsangCare) 웹앱을 자동으로 개발한다. MVP를 우선 구현하고, Full Release를 순차적으로 완성한다.

## 앱 개요

- **앱 이름**: 오상케어 (OsangCare)
- **브랜딩**: 오상신경외과 복지 플랫폼
- **언어**: 한국어 전용
- **기술 스택**: Next.js 13+ (App Router) + TypeScript strict + Supabase (PostgreSQL) + Tailwind CSS
- **예상 규모**: 10,000명 이상 (확장성 우선 설계)

## 이중 시스템 구조

- **시스템 A — 자가진단** (`/check`, 비회원 공개): COMPASS-31 자율신경실조증 자가진단. 익명 응답 별도 관리. 결과 후 가입 유도.
- **시스템 B — 스트레스 관리** (`/app`, 회원 전용): PHQ-9 / GAD-7 / ASRS 추적 설문, 증상 추이 차트, 부가 기능.

---

## 개발 워크플로우

### MVP (1개월 목표 — Phase 1 → 2.1 → 2.2 → 2.3)

#### Phase 1: 프로젝트 구조 및 인프라 설정

**작업 순서**
1. Next.js 프로젝트 초기화
   ```bash
   npx create-next-app@latest src --typescript --tailwind --app --src-dir --import-alias "@/*"
   ```
2. 필수 의존성 설치
   ```bash
   npm install @supabase/supabase-js @supabase/ssr recharts react-hook-form @hookform/resolvers zod
   npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
   npm install --save-dev @types/node
   ```
3. 폴더 구조 생성: `/check` (자가진단), `/app` (회원 영역), `/admin` (관리자) 라우트 분리
4. `.env.local` 생성 (`.env.example` 참조)
5. `.claude/skills/supabase-setup/scripts/init-schema.sql` → Supabase SQL Editor 실행
6. `.claude/skills/supabase-setup/scripts/rls-policies.sql` → Supabase SQL Editor 실행

**참조 파일**
- `.claude/skills/supabase-setup/SKILL.md`
- `.claude/skills/supabase-setup/scripts/init-schema.sql`
- `.claude/skills/supabase-setup/scripts/rls-policies.sql`
- `.claude/skills/supabase-setup/references/supabase-auth.md`

**성공 기준**
- `npm run dev` 실행 후 `localhost:3000` 접속 가능
- `/check`, `/app`, `/admin` 라우트 분리 확인
- Supabase 연결 테스트 통과 (`supabase.auth.getSession()` 정상 응답)

---

#### Phase 2.1: 인증 및 보안

**작업 순서**
1. Supabase Auth 미들웨어 구성 (`src/middleware.ts`)
2. 회원가입 UI 구현 — Progressive Disclosure 1단계 필수 필드
   - 이메일, 성별, 생년월일, 주요 호소 증상 (다중 선택)
3. 소셜 로그인 후 필수 프로필 추가 수집 화면 구현
4. 개인정보 동의서 컴포넌트 생성 → **`privacy-compliance` 서브에이전트 호출**
5. 권한 관리 미들웨어 구현 (3단계: 비회원 / user / admin|super_admin)
6. RLS 정책 적용 검증

**서브에이전트 호출 조건**: 개인정보 처리방침 및 동의서 생성 시
- 호출 방법: `.claude/agents/privacy-compliance/AGENT.md` 프롬프트로 Task 도구 실행
- 입력: 앱 수집 항목 명세 (Progressive Disclosure 1단계/2단계 구분)
- 출력: `/output/docs/privacy-policy.md`, 동의서 컴포넌트 텍스트

**참조 파일**
- `.claude/skills/supabase-setup/references/supabase-auth.md`
- `.claude/skills/supabase-setup/references/supabase-rls.md`
- `.claude/skills/security-checker/scripts/security-checklist.json`

**성공 기준**
- 이메일 / 카카오 OAuth / Google OAuth 3가지 로그인 모두 동작
- 소셜 로그인 후 필수 프로필(성별/생년월일/주요증상) 수집 화면 표시
- 회원가입 시 동의서 체크 필수
- 비로그인 사용자: `/check`만 접근 가능
- 관리자 페이지: `admin` / `super_admin` 역할만 접근 가능

---

#### Phase 2.2: 자가진단 시스템 (COMPASS-31)

**작업 순서**
1. COMPASS-31 설문지 JSON 스키마 생성 → **`medical-content` 서브에이전트 호출**
   - 참조: `.claude/skills/questionnaire-builder/references/compass31-guideline.md`
   - 저장: `/output/schemas/questionnaire-compass31.json`
2. 도메인별 가중치 채점 로직 구현 (TypeScript)
   - 참조: `.claude/skills/questionnaire-builder/scripts/calculate-score.ts`
3. 설문 UI 컴포넌트 생성
   - 참조: `.claude/skills/ui-generator/SKILL.md`
4. 결과 표시 이중화
   - 환자용: 종합 점수 + 등급 (정상/경증/중등도/중증)
   - 의료진용 (관리자 대시보드): 6개 도메인 레이더 차트
5. 비회원 응답 익명 저장 (세션 기반, `anonymous_assessments` 테이블)
6. 결과 화면 → 가입 유도 UI (강요하지 않는 자연스러운 전환)
7. 면책 고지 문구 삽입: "본 결과는 전문 의료인의 진단을 대체하지 않습니다."

**서브에이전트 호출 조건**: COMPASS-31 채점 알고리즘 검증 시
- 호출 방법: `.claude/agents/medical-content/AGENT.md` 프롬프트로 Task 도구 실행
- 입력: 생성한 `questionnaire-compass31.json`, 채점 로직 코드
- 출력: 검증 결과 및 수정 사항

**성공 기준**
- 31개 문항 모두 포함
- 6개 도메인 가중치 채점이 공식 알고리즘과 일치
- 비회원 응답 저장 시 개인 식별 정보 없음 (session_id만 사용)
- 면책 고지 문구 포함

---

#### Phase 2.3: 스트레스 관리 시스템 (추적 설문)

**작업 순서**
1. PHQ-9, GAD-7, ASRS 설문지 JSON 스키마 생성 → **`medical-content` 서브에이전트 호출**
   - 참조: `.claude/skills/questionnaire-builder/references/phq9-guideline.md`
   - 참조: `.claude/skills/questionnaire-builder/references/gad7-guideline.md`
   - 참조: `.claude/skills/questionnaire-builder/references/asrs-guideline.md`
   - 저장: `/output/schemas/questionnaire-phq9.json`, `gad7.json`, `asrs.json`
2. 점수 계산 로직 구현 (역순 채점 포함)
   - 참조: `.claude/skills/questionnaire-builder/scripts/calculate-score.ts`
3. 설문 UI 컴포넌트 (단계적 진행, 모바일 우선)
4. `survey_responses` 테이블에 응답 저장 (타임스탬프 자동 기록)
5. 증상 추이 차트 컴포넌트 (Recharts 라인차트, 최소 3개월 데이터)
6. **안전 프로토콜 구현 (절대 누락 금지)**
   - PHQ-9 20점 이상 시 → 정신건강위기상담전화 1577-0199 + 병원 안내 즉시 표시
   - 15-19점 → 병원 방문 강력 권고 + 연락처
   - 10-14점 → 추적 설문 권장 + 병원 방문 고려 안내
   - 5-9점 → 자기 관리 도구 안내
   - 0-4점 → 긍정적 피드백

**서브에이전트 호출 조건**: 안전 프로토콜 문구 생성 및 검증 시
- 호출: `.claude/agents/medical-content/AGENT.md`
- 입력: PHQ-9 점수 구간별 대응 로직, 안내 문구 초안
- 출력: 검증된 문구 및 법적 면책 고지 텍스트

**성공 기준**
- PHQ-9 9문항, GAD-7 7문항, ASRS 18문항 모두 포함
- 역순 채점 정확
- 응답 저장 시 타임스탬프 + user_id 자동 기록
- **PHQ-9 20점 이상 → 위기상담전화 1577-0199 표시** (자동화 테스트 필수)
- 3개월 추이 차트 모바일 가독성 유지
- 모든 결과 화면에 면책 고지 포함

---

### Full Release (MVP 이후 — Phase 3~7)

#### Phase 3: 관리자 대시보드

**참조**: `.claude/skills/analytics-builder/SKILL.md`

**작업 순서**
1. 슈퍼/일반 관리자 RBAC 구현
2. 집계 통계 API 구현 (Supabase PostgreSQL 집계 함수)
   - 참조: `.claude/skills/analytics-builder/scripts/aggregate-stats.ts`
3. 핵심 지표 대시보드 구현 (Recharts)

**핵심 지표 (익명 집계만)**
- 주간/월간 신규 가입자 수 추이
- 설문 응답 활성 사용자 비율
- 설문 유형별 평균 점수 추이 (월별)
- 증상 개선/악화 환자 비율 (PHQ-9 5점 이상 변화)
- 성별/나이대별 증상 분포
- 자가진단(COMPASS-31) → 회원 전환율

**절대 준수**: 개별 사용자 식별 정보 절대 노출 금지

---

#### Phase 4: 부가 기능

- **명상음악 플레이어**: YouTube 임베드 + Supabase Storage + 파일 업로드 + Web Audio API (바이노럴 비트)
- **감사일기**: Tiptap 에디터, 저장/불러오기
- **호흡 가이드**: CSS 애니메이션 (4-7-8, 박스 호흡)
- **치료 안내 콘텐츠**: 정적 페이지, 병원 예약 연결
- **병원 정보**: 연락처, SNS 링크

---

#### Phase 5: PWA 설정 + 푸시 알림

- `manifest.json` 생성 (오상케어 아이콘, 이름)
- Service Worker 등록 (캐싱 전략)
- 홈 화면 추가 유도 UI
- 관리자 수동 발송 푸시 알림 (Web Push API)
- Lighthouse PWA 점수 90점 이상

---

#### Phase 6: 테스트 및 검증

**참조**: `.claude/skills/security-checker/SKILL.md`

1. 단위 테스트 — 설문 점수 계산, 안전 프로토콜
2. 통합 테스트 — 인증 플로우, 이중 시스템 전환
3. 접근성 테스트 — axe-core (위반 0건)
4. 보안 감사 — `.claude/skills/security-checker/scripts/run-security-audit.ts` 실행
   - 출력: `/output/reports/security-audit.md`

**성공 기준**
- 핵심 로직 테스트 커버리지 80% 이상
- PHQ-9 안전 프로토콜 시나리오 100% 통과
- 보안 체크리스트 100% 통과

---

#### Phase 7: 배포 준비

1. 환경별 설정 파일 (dev, staging, prod)
2. Vercel 배포 가이드 → `/output/docs/deployment-guide.md`
3. Supabase 프로덕션 체크리스트 (RLS, 백업, 인덱스)
4. README 작성
5. **`privacy-compliance` 서브에이전트 호출** → 최종 개인정보 처리방침 갱신

---

## 서브에이전트 오케스트레이션

| 서브에이전트 | 트리거 조건 | 역할 | 출력 |
|------------|-----------|------|------|
| `privacy-compliance` | Phase 2.1 인증 구현 시, Phase 7 배포 준비 시 | 개인정보보호법 준수 문서 생성 | `/output/docs/privacy-policy.md`, 동의서 컴포넌트 텍스트 |
| `medical-content` | Phase 2.2, 2.3 설문 시스템 구현 시 | 설문 채점 알고리즘 검증, 안전 프로토콜 문구 생성 | 검증된 JSON, 안전 안내 문구 |

**서브에이전트 호출 방법**
```
Task 도구 사용 → 해당 AGENT.md 파일 내용을 prompt로 전달 → 결과 수신
```

---

## 스킬 호출 규칙

| Phase | 호출 스킬 |
|-------|---------|
| Phase 1 | `supabase-setup` |
| Phase 2.1 | `security-checker` |
| Phase 2.2 | `questionnaire-builder`, `ui-generator` |
| Phase 2.3 | `questionnaire-builder`, `ui-generator` |
| Phase 3 | `analytics-builder`, `ui-generator` |
| Phase 6 | `security-checker` |

스킬 참조 방법: 각 `.claude/skills/{skill-name}/SKILL.md` 파일의 지침을 읽고, 해당 `/scripts/` 및 `/references/` 파일을 활용한다.

---

## UI/UX 디자인 규칙

### 디자인 시스템

- **컴포넌트 라이브러리**: shadcn/ui 기반으로 모든 UI 컴포넌트 작성. 커스텀 컴포넌트 직접 구현 금지.
- **스타일링**: Tailwind CSS 유틸리티 클래스만 사용. 인라인 스타일, CSS 모듈, styled-components 사용 금지.
- **아이콘**: Lucide React (`lucide-react`) 단일 아이콘 라이브러리 사용.

### 색상 체계

- **기본 톤**: slate/zinc 계열 중성색 기반
- **포인트 컬러**: 1개만 사용 (브랜드 컬러로 통일)
- **배경**: `bg-white` / `bg-zinc-50` (섹션 구분 시)
- **텍스트**: `text-zinc-900` (본문) / `text-zinc-500` (보조 텍스트)
- **보더**: `border-zinc-200` 기본, hover 시 `border-zinc-300`
- **위기 알림**: `text-red-600` + `bg-red-50` (안전 프로토콜 전용)

### 타이포그래피

- **기본 크기**: `text-sm` (14px)
- **제목**: `text-lg` ~ `text-xl`, `font-semibold`
- **본문**: `text-sm`, `font-normal`, `leading-relaxed`
- **보조 텍스트**: `text-xs`, `text-zinc-500`
- **강조**: `font-semibold`만 사용. `font-bold` / `uppercase` 지양.

### 레이아웃

- **반응형**: 모바일 우선 설계 (Mobile First)
- **최대 너비**: `max-w-screen-md` 중앙 정렬 (`mx-auto`)
- **페이지 패딩**: `px-4 py-6` (모바일) / `px-6 py-8` (데스크톱)
- **섹션 간격**: `space-y-6` 또는 `gap-6`
- **컴포넌트 내부 간격**: `p-4` ~ `p-6`

### 컴포넌트 스타일

- **카드**: `rounded-xl shadow-sm border border-zinc-100 bg-white`
- **버튼**: shadcn `<Button>` 컴포넌트만 사용. HTML `<button>` 직접 스타일링 금지.
- **입력 필드**: shadcn `<Input>`, `<Select>`, `<Textarea>` 사용
- **모달/다이얼로그**: shadcn `<Dialog>` 사용
- **토스트 알림**: shadcn `<Sonner>` 사용

### 인터랙션

- **트랜지션**: `transition-colors duration-150` 기본 적용
- **호버**: 배경색 미세 변화 (`hover:bg-zinc-50`)
- **포커스**: `focus-visible:ring-2 ring-offset-2` (접근성 필수)
- **로딩 상태**: shadcn `<Skeleton>` 또는 스피너 사용. 빈 화면 노출 금지.
- **비활성화**: `opacity-50 cursor-not-allowed`

### 설문 UI 전용 규칙

- **진행률 표시**: 상단 프로그레스 바 필수 표시
- **문항 간격**: 한 화면에 1~3문항, 스크롤 최소화
- **선택지**: 충분한 터치 영역 확보 (`min-h-[44px]`, `p-3` 이상)
- **결과 화면**: 점수 + 등급 시각적 구분 (색상 코드 활용)

### 차트 (Recharts)

- **색상**: zinc/slate 톤 + 포인트 컬러 1개
- **폰트**: `text-xs`, `text-zinc-500`
- **반응형**: `<ResponsiveContainer>` 필수 래핑
- **툴팁**: 간결하게, 단위 포함

### 참고 레퍼런스

Linear, Vercel Dashboard, Notion 스타일 지향 — 깔끔하고 여백이 넉넉한 미니멀 디자인.

---

## 절대 준수 규칙 (위반 시 즉시 에스컬레이션)

1. **안전 프로토콜**: PHQ-9 20점 이상 시 위기상담전화(1577-0199) 안내는 반드시 구현. 절대 누락 금지.
2. **익명성**: 관리자 대시보드에서 개별 환자 식별 정보 절대 노출 금지.
3. **UX 문구**: `**굵은 텍스트**`, 과도한 이모지, AI 느낌 표현 사용 금지. 자연스러운 한국어 사용.
4. **TypeScript**: strict mode 활성화. `any` 타입 사용 금지.
5. **RLS**: 모든 테이블에 RLS 정책 적용. RLS 없는 테이블 생성 금지.
6. **면책 고지**: 모든 설문 결과 화면에 "본 결과는 전문 의료인의 진단을 대체하지 않습니다." 문구 포함.

---

## 에스컬레이션 조건

다음 상황에서 즉시 사용자에게 보고하고 작업 중단:

1. PHQ-9 안전 프로토콜 구현 불가
2. 보안 취약점 발견 (RLS 누락, SQL Injection 가능성, XSS)
3. 의학 가이드라인 불일치 (채점 알고리즘 검증 실패)
4. 빌드 실패 3회 이상 지속
5. 개인정보 처리방침 필수 조항 누락 발견

---

## 출력물 위치

| 산출물 | 위치 |
|--------|------|
| Next.js 소스코드 | `src/` |
| 설문지 JSON 스키마 | `output/schemas/questionnaire-*.json` |
| DB 스키마 | `output/schemas/database-schema.sql` |
| RLS 정책 | `output/schemas/rls-policies.sql` |
| React 컴포넌트 (자동 생성) | `output/components/*.tsx` |
| 개인정보 처리방침 | `output/docs/privacy-policy.md` |
| 배포 가이드 | `output/docs/deployment-guide.md` |
| 관리자 매뉴얼 | `output/docs/user-manual-admin.md` |
| 보안 감사 보고서 | `output/reports/security-audit.md` |

---

## PHQ-9 점수별 대응 로직 (안전 프로토콜 요약)

| 점수 | 등급 | 앱 대응 |
|------|------|---------|
| 0-4 | 증상 없음 | 긍정적 피드백 |
| 5-9 | 경증 | 자기 관리 도구 안내 (호흡, 일기) |
| 10-14 | 중등도 | 추적 설문 권장 + 병원 방문 고려 안내 |
| 15-19 | 중증 | 병원 방문 강력 권고 + 연락처 표시 |
| 20-27 | 위기 | **정신건강위기상담전화 1577-0199** + 병원 안내 |

---

## 설계서 참조

전체 요구사항 및 상세 스펙: `docs/requirements.md` 또는 프로젝트 루트의 `osangapp-agent-design.md` 참조.
