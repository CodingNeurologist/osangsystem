-- ============================================================
-- OsangCare Row Level Security (RLS) 정책
-- init-schema.sql 실행 후 실행
-- ============================================================

-- ============================================================
-- 1. profiles 테이블 RLS
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 자신의 프로필만 조회
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 자신의 프로필만 수정
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT는 handle_new_user 트리거가 처리 (service role만 가능)
CREATE POLICY "profiles_insert_trigger" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 관리자: 익명 집계 조회만 (개별 프로필 직접 열람 금지 — 뷰를 통해서만 접근)
-- 참고: 관리자는 RLS 정책이 아닌 별도 API Route (service role)를 통해 집계 뷰 조회


-- ============================================================
-- 2. anonymous_assessments 테이블 RLS
-- ============================================================

ALTER TABLE public.anonymous_assessments ENABLE ROW LEVEL SECURITY;

-- 비회원도 INSERT 가능 (익명 저장)
CREATE POLICY "anon_assessments_insert" ON public.anonymous_assessments
  FOR INSERT WITH CHECK (true);

-- 조회 불가 (개인 응답 보호) — 집계 통계는 service role 전용 API로 처리
CREATE POLICY "anon_assessments_no_select" ON public.anonymous_assessments
  FOR SELECT USING (false);


-- ============================================================
-- 3. survey_responses 테이블 RLS
-- ============================================================

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- 자신의 응답만 조회
CREATE POLICY "survey_responses_select_own" ON public.survey_responses
  FOR SELECT USING (auth.uid() = user_id);

-- 자신의 응답만 INSERT
CREATE POLICY "survey_responses_insert_own" ON public.survey_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 수정/삭제 금지 (의료 데이터 무결성 유지)
-- UPDATE, DELETE 정책 없음 = 불가


-- ============================================================
-- 4. journal_entries 테이블 RLS
-- ============================================================

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- 자신의 일기만 조회
CREATE POLICY "journal_entries_select_own" ON public.journal_entries
  FOR SELECT USING (auth.uid() = user_id);

-- 자신의 일기만 INSERT
CREATE POLICY "journal_entries_insert_own" ON public.journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 자신의 일기만 수정
CREATE POLICY "journal_entries_update_own" ON public.journal_entries
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 자신의 일기만 삭제
CREATE POLICY "journal_entries_delete_own" ON public.journal_entries
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 5. push_subscriptions 테이블 RLS
-- ============================================================

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 자신의 구독 정보만 조회
CREATE POLICY "push_subscriptions_select_own" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 자신의 구독 정보만 INSERT
CREATE POLICY "push_subscriptions_insert_own" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 자신의 구독 정보만 삭제
CREATE POLICY "push_subscriptions_delete_own" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 6. 집계 뷰 접근 제한 (service role 전용)
-- 뷰는 기본적으로 RLS 우회 불가 — SECURITY DEFINER 함수로 래핑
-- ============================================================

-- 관리자 권한 확인 함수
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 슈퍼 관리자 권한 확인 함수
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 역할 승격 함수 (슈퍼 관리자만 사용 가능)
CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION '권한 없음: 슈퍼 관리자만 역할을 변경할 수 있습니다.';
  END IF;

  IF new_role NOT IN ('user', 'admin', 'super_admin') THEN
    RAISE EXCEPTION '유효하지 않은 역할: %', new_role;
  END IF;

  UPDATE public.profiles
  SET role = new_role
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 7. RLS 설치 확인
-- ============================================================

DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'anonymous_assessments', 'survey_responses', 'journal_entries', 'push_subscriptions')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = tbl.tablename
      AND n.nspname = 'public'
      AND c.relrowsecurity = true
    ) THEN
      RAISE WARNING 'RLS 미적용 테이블 발견: %', tbl.tablename;
    ELSE
      RAISE NOTICE 'RLS 적용 확인: %', tbl.tablename;
    END IF;
  END LOOP;
END $$;
