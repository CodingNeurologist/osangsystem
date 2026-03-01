# supabase-setup 스킬

Supabase 프로젝트 초기화, PostgreSQL 스키마 설정, RLS 정책 설정을 담당한다.

## 트리거 조건

- Phase 1: 프로젝트 구조 및 인프라 설정 시
- Phase 2.1: RLS 정책 검증 필요 시

## 사용 방법

### 1단계: Supabase 프로젝트 생성

1. https://supabase.com/dashboard → 새 프로젝트 생성
2. 프로젝트 이름: `osangcare-prod` (또는 `osangcare-dev`)
3. 데이터베이스 비밀번호 안전하게 저장
4. 리전: Northeast Asia (Seoul) 선택

### 2단계: 스키마 초기화

Supabase Dashboard → SQL Editor에서 다음 파일 순서대로 실행:

```
1. scripts/init-schema.sql    (테이블 및 인덱스 생성)
2. scripts/rls-policies.sql   (Row Level Security 정책 설정)
```

### 3단계: 환경변수 설정

`.env.local` 파일 생성 (`.env.example` 복사):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4단계: 연결 테스트

```typescript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const { data, error } = await supabase.auth.getSession()
```

## 스키마 설계 원칙

- **확장성**: 10,000명 이상 대비 인덱스 전략 필수 적용
- **데이터 분리**: 익명 자가진단(`anonymous_assessments`)과 회원 데이터 완전 분리
- **RLS 필수**: 모든 테이블에 RLS 정책 적용 (정책 없는 테이블 생성 금지)
- **집계 최적화**: 관리자 대시보드용 뷰(View) 및 함수 활용
- **익명화**: 집계 뷰에서 개인 식별 정보 제거

## 테이블 목록

| 테이블 | 용도 |
|--------|------|
| `profiles` | 회원 프로필 (auth.users 확장) |
| `anonymous_assessments` | 비회원 COMPASS-31 익명 응답 |
| `survey_responses` | 회원 추적 설문 응답 (PHQ-9/GAD-7/ASRS) |
| `journal_entries` | 감사일기 |
| `push_subscriptions` | PWA 푸시 알림 구독 정보 |

## 참고 문서

- `references/supabase-auth.md`: 카카오/구글 OAuth 설정 가이드
- `references/supabase-rls.md`: RLS 정책 패턴 레퍼런스
