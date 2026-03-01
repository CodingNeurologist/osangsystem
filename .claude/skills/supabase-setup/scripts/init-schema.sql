-- ============================================================
-- OsangCare PostgreSQL 초기 스키마
-- Supabase SQL Editor에서 실행
-- 10,000명 이상 확장성 고려 설계
-- ============================================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. profiles 테이블 (auth.users 확장)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email        TEXT NOT NULL,
  gender       TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  birth_date   DATE,
  primary_symptoms TEXT[] DEFAULT '{}',
  -- Progressive Disclosure 2단계 (선택)
  occupation   TEXT,
  current_treatments TEXT[] DEFAULT '{}',
  -- 역할 기반 접근 제어
  role         TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  -- 개인정보 동의
  privacy_consent_at TIMESTAMPTZ,
  privacy_consent_version TEXT,
  -- 메타데이터
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- profiles 인덱스 (집계 쿼리 최적화)
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_gender_idx ON public.profiles (gender);
CREATE INDEX IF NOT EXISTS profiles_birth_date_idx ON public.profiles (birth_date);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles (created_at);

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 신규 사용자 가입 시 profiles 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 2. anonymous_assessments 테이블 (비회원 COMPASS-31 익명 응답)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.anonymous_assessments (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id   TEXT NOT NULL,           -- 브라우저 세션 식별자 (개인 식별 불가)
  survey_type  TEXT DEFAULT 'compass31' NOT NULL,
  responses    JSONB NOT NULL,          -- { "q1": 0, "q2": 1, ... }
  total_score  NUMERIC(5, 2),
  domain_scores JSONB,                  -- { "oi": 25.5, "vm": 3.0, ... }
  severity_level TEXT CHECK (severity_level IN ('normal', 'mild', 'moderate', 'severe')),
  converted_to_member BOOLEAN DEFAULT FALSE, -- 가입 전환 여부 (익명, 비연결)
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 집계 쿼리용 인덱스
CREATE INDEX IF NOT EXISTS anon_assessments_created_at_idx ON public.anonymous_assessments (created_at);
CREATE INDEX IF NOT EXISTS anon_assessments_severity_idx ON public.anonymous_assessments (severity_level);
CREATE INDEX IF NOT EXISTS anon_assessments_survey_type_idx ON public.anonymous_assessments (survey_type);


-- ============================================================
-- 3. survey_responses 테이블 (회원 추적 설문)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.survey_responses (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  survey_type   TEXT NOT NULL CHECK (survey_type IN ('phq9', 'gad7', 'asrs')),
  responses     JSONB NOT NULL,           -- { "q1": 0, "q2": 2, ... }
  total_score   INTEGER NOT NULL,
  severity_level TEXT NOT NULL,
  -- PHQ-9 안전 프로토콜 플래그
  crisis_flag   BOOLEAN DEFAULT FALSE,    -- PHQ-9 >= 20 시 TRUE
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 증상 추이 조회 최적화 인덱스
CREATE INDEX IF NOT EXISTS survey_responses_user_id_idx ON public.survey_responses (user_id);
CREATE INDEX IF NOT EXISTS survey_responses_survey_type_idx ON public.survey_responses (survey_type);
CREATE INDEX IF NOT EXISTS survey_responses_created_at_idx ON public.survey_responses (created_at);
CREATE INDEX IF NOT EXISTS survey_responses_user_type_date_idx ON public.survey_responses (user_id, survey_type, created_at DESC);
-- 집계 쿼리 최적화
CREATE INDEX IF NOT EXISTS survey_responses_type_date_idx ON public.survey_responses (survey_type, created_at);


-- ============================================================
-- 4. journal_entries 테이블 (감사일기)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS journal_entries_user_id_idx ON public.journal_entries (user_id);
CREATE INDEX IF NOT EXISTS journal_entries_created_at_idx ON public.journal_entries (created_at DESC);

CREATE TRIGGER journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================
-- 5. push_subscriptions 테이블 (PWA 푸시 알림)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint     TEXT NOT NULL UNIQUE,
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions (user_id);


-- ============================================================
-- 6. 관리자 대시보드용 집계 뷰 (익명 집계 — 개인 식별 정보 없음)
-- ============================================================

-- 월별 신규 가입자 수
CREATE OR REPLACE VIEW public.v_monthly_signups AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS signup_count,
  COUNT(*) FILTER (WHERE gender = 'male') AS male_count,
  COUNT(*) FILTER (WHERE gender = 'female') AS female_count
FROM public.profiles
WHERE role = 'user'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- 설문 유형별 월간 평균 점수
CREATE OR REPLACE VIEW public.v_monthly_survey_avg AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  survey_type,
  ROUND(AVG(total_score)::NUMERIC, 2) AS avg_score,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_score)::NUMERIC, 2) AS median_score,
  COUNT(*) AS response_count,
  COUNT(DISTINCT user_id) AS active_users
FROM public.survey_responses
GROUP BY DATE_TRUNC('month', created_at), survey_type
ORDER BY month DESC, survey_type;

-- 나이대별 증상 분포 (10년 단위)
CREATE OR REPLACE VIEW public.v_age_group_symptoms AS
SELECT
  CASE
    WHEN EXTRACT(YEAR FROM AGE(birth_date)) < 20 THEN '10대'
    WHEN EXTRACT(YEAR FROM AGE(birth_date)) < 30 THEN '20대'
    WHEN EXTRACT(YEAR FROM AGE(birth_date)) < 40 THEN '30대'
    WHEN EXTRACT(YEAR FROM AGE(birth_date)) < 50 THEN '40대'
    ELSE '50대 이상'
  END AS age_group,
  sr.survey_type,
  ROUND(AVG(sr.total_score)::NUMERIC, 2) AS avg_score,
  COUNT(*) AS response_count
FROM public.survey_responses sr
JOIN public.profiles p ON sr.user_id = p.id
WHERE p.birth_date IS NOT NULL
GROUP BY age_group, sr.survey_type
ORDER BY age_group, sr.survey_type;

-- PHQ-9 증상 개선/악화 비율 (동일 사용자 전후 비교)
CREATE OR REPLACE VIEW public.v_phq9_trend_summary AS
WITH ranked AS (
  SELECT
    user_id,
    total_score,
    LAG(total_score) OVER (PARTITION BY user_id ORDER BY created_at) AS prev_score,
    created_at
  FROM public.survey_responses
  WHERE survey_type = 'phq9'
),
changes AS (
  SELECT
    CASE
      WHEN (total_score - prev_score) <= -5 THEN 'improved'
      WHEN (total_score - prev_score) >= 5 THEN 'worsened'
      ELSE 'stable'
    END AS trend,
    DATE_TRUNC('month', created_at) AS month
  FROM ranked
  WHERE prev_score IS NOT NULL
)
SELECT
  month,
  COUNT(*) FILTER (WHERE trend = 'improved') AS improved_count,
  COUNT(*) FILTER (WHERE trend = 'worsened') AS worsened_count,
  COUNT(*) FILTER (WHERE trend = 'stable') AS stable_count,
  COUNT(*) AS total_count
FROM changes
GROUP BY month
ORDER BY month DESC;


-- ============================================================
-- 7. 환경변수 확인용 더미 테스트 (실행 확인)
-- ============================================================

-- 스키마 설치 완료 로그
DO $$
BEGIN
  RAISE NOTICE 'OsangCare 초기 스키마 설치 완료: profiles, anonymous_assessments, survey_responses, journal_entries, push_subscriptions';
  RAISE NOTICE '집계 뷰 생성 완료: v_monthly_signups, v_monthly_survey_avg, v_age_group_symptoms, v_phq9_trend_summary';
END $$;
