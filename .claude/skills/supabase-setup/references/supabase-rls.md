# Supabase RLS (Row Level Security) 레퍼런스

## RLS 원칙

OsangCare의 모든 테이블은 RLS를 활성화해야 한다. RLS 없는 테이블은 누구나 읽고 쓸 수 있어 의료 데이터 유출 위험이 있다.

---

## 핵심 패턴

### 1. 자신의 데이터만 접근 (기본 패턴)
```sql
-- SELECT: 자신의 데이터만 조회
CREATE POLICY "select_own" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: 자신의 user_id로만 삽입
CREATE POLICY "insert_own" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: 자신의 데이터만 수정
CREATE POLICY "update_own" ON table_name
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: 자신의 데이터만 삭제
CREATE POLICY "delete_own" ON table_name
  FOR DELETE USING (auth.uid() = user_id);
```

### 2. 관리자 권한 패턴
```sql
-- 관리자 역할 확인
CREATE POLICY "admin_select" ON table_name
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );
```

### 3. 익명 INSERT 허용 (자가진단)
```sql
-- 로그인 여부 관계없이 INSERT 가능
CREATE POLICY "allow_anonymous_insert" ON anonymous_assessments
  FOR INSERT WITH CHECK (true);

-- SELECT는 차단 (개인 응답 보호)
CREATE POLICY "block_select" ON anonymous_assessments
  FOR SELECT USING (false);
```

### 4. 의료 데이터 수정 방지
```sql
-- UPDATE, DELETE 정책을 생성하지 않으면 해당 작업 불가
-- survey_responses는 INSERT만 허용 (의료 기록 무결성)
```

---

## RLS 검증 방법

```sql
-- 테이블별 RLS 활성화 여부 확인
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 정책 목록 확인
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## Service Role vs Anon Key

| 키 종류 | 용도 | RLS 우회 |
|--------|------|---------|
| `anon key` | 클라이언트 사이드, 비회원 | RLS 적용됨 |
| `service_role key` | 서버 사이드 API, 관리자 집계 | RLS 우회 |

**주의**: `service_role key`는 서버 사이드(API Route, Edge Function)에서만 사용. 클라이언트에 절대 노출 금지.

관리자 대시보드 집계 API 예시:
```typescript
// src/app/api/admin/stats/route.ts
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // 서버 사이드 전용
)

export async function GET() {
  // 관리자 인증 확인 후
  const { data } = await supabaseAdmin.from('v_monthly_signups').select('*')
  return Response.json(data)
}
```

---

## OsangCare RLS 정책 요약

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `profiles` | 자신만 | 트리거 | 자신만 | 불가 |
| `anonymous_assessments` | 불가 | 모두 | 불가 | 불가 |
| `survey_responses` | 자신만 | 자신만 | 불가 | 불가 |
| `journal_entries` | 자신만 | 자신만 | 자신만 | 자신만 |
| `push_subscriptions` | 자신만 | 자신만 | 불가 | 자신만 |

집계 뷰(`v_*`)는 service_role 전용 API Route를 통해서만 접근.
