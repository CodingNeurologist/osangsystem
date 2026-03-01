# 오상케어 (OsangCare)

오상신경외과 복지 플랫폼 — 자율신경실조증 자가진단과 스트레스 관리 서비스

## 시작하기

### 사전 요구사항

- Node.js 20 이상
- Supabase 프로젝트

### 설치

```bash
cd osangcare
npm install
```

### 환경변수 설정

```bash
cp .env.example .env.local
# .env.local 파일에 Supabase 키 및 병원 연락처 입력
```

### 데이터베이스 설정

Supabase SQL Editor에서 순서대로 실행:

1. `.claude/skills/supabase-setup/scripts/init-schema.sql`
2. `.claude/skills/supabase-setup/scripts/rls-policies.sql`
3. `output/schemas/music-tracks.sql`

### 개발 서버 실행

```bash
npm run dev
# http://localhost:3000
```

### 테스트 실행

```bash
npm test
npm run test:coverage
```

---

## 프로젝트 구조

```
osangcare/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 로그인, 회원가입
│   │   ├── app/                # 회원 전용 (설문, 차트, 일기, 음악)
│   │   ├── admin/              # 관리자 대시보드
│   │   ├── check/              # 비회원 COMPASS-31 자가진단
│   │   ├── api/                # API Routes
│   │   ├── manifest.ts         # PWA Manifest
│   │   └── offline/            # 오프라인 폴백 페이지
│   ├── components/
│   │   ├── auth/               # 로그인, 회원가입, 동의서
│   │   ├── survey/             # 설문 컴포넌트
│   │   ├── chart/              # 증상 추이 차트
│   │   ├── journal/            # 감사일기
│   │   ├── breathing/          # 호흡 가이드
│   │   ├── music/              # 명상음악 플레이어
│   │   ├── admin/              # 관리자 UI
│   │   ├── layout/             # 네비게이션
│   │   └── pwa/                # PWA 컴포넌트
│   ├── lib/
│   │   ├── supabase/           # Supabase 클라이언트
│   │   └── scoring.ts          # 설문 채점 로직
│   ├── types/                  # TypeScript 타입 정의
│   └── data/                   # 설문지 JSON 스키마
├── public/
│   ├── sw.js                   # Service Worker
│   └── icons/                  # PWA 아이콘 (별도 생성 필요)
└── output/
    ├── schemas/                # DB 스키마 SQL
    ├── docs/                   # 배포 가이드, 개인정보처리방침
    └── reports/                # 보안 감사 보고서
```

---

## 주요 기능

### 시스템 A — 자가진단 (`/check`, 비회원)
- COMPASS-31 자율신경실조증 자가진단 (31문항)
- 도메인별 가중치 채점 (6개 도메인)
- 익명 응답 저장 (session_id 기반)
- 결과 후 회원가입 유도

### 시스템 B — 스트레스 관리 (`/app`, 회원)
- PHQ-9 (우울), GAD-7 (불안), ASRS (ADHD) 추적 설문
- 증상 추이 차트 (Recharts)
- 감사일기
- 호흡 가이드 (4-7-8, 박스, 이완)
- 명상음악 플레이어 (바이노럴 비트 + YouTube)
- 치료 안내

### 관리자 대시보드 (`/admin`)
- 집계 통계 (익명 — 개별 사용자 데이터 미노출)
- 월별 가입자, 설문 평균 점수, PHQ-9 추이
- 관리자 계정 관리 (super_admin 전용)
- 음악 트랙 관리

---

## 안전 프로토콜

PHQ-9 점수가 20점 이상인 경우, 정신건강위기상담전화(1577-0199) 안내 배너가 자동으로 표시됩니다. 이 기능은 절대 비활성화하지 마세요.

---

## 기술 스택

- **프레임워크**: Next.js 15 (App Router) + TypeScript strict
- **데이터베이스**: Supabase (PostgreSQL + Auth + Storage)
- **스타일링**: Tailwind CSS
- **차트**: Recharts
- **폼**: React Hook Form + Zod
- **PWA**: Web App Manifest + Service Worker + Web Audio API
- **테스트**: Jest + Testing Library

---

## 배포

[배포 가이드](../output/docs/deployment-guide.md) 참조.

---

## 라이선스

오상신경외과 내부 사용 한정. 무단 배포 금지.
