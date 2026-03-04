-- ============================================================
-- 뉴럴리셋(Neural Reset) 테이블
-- Supabase SQL Editor에서 실행
-- ============================================================

-- ============================================================
-- 1. daily_checkins — 일일 컨디션 체크인
-- ============================================================

CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  check_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  body_score    SMALLINT NOT NULL CHECK (body_score BETWEEN 1 AND 5),
  mood_score    SMALLINT NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
  energy_score  SMALLINT NOT NULL CHECK (energy_score BETWEEN 1 AND 5),
  stress_score  SMALLINT NOT NULL CHECK (stress_score BETWEEN 1 AND 5),
  symptoms      TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, check_date)
);

CREATE INDEX IF NOT EXISTS daily_checkins_user_date_idx
  ON public.daily_checkins (user_id, check_date DESC);

-- ============================================================
-- 2. reset_sessions — 뉴럴리셋 활동 세션 통합 기록
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reset_sessions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type   TEXT NOT NULL CHECK (activity_type IN ('breathing', 'somatic', 'meditation', 'journal', 'sos')),
  activity_detail JSONB DEFAULT '{}',
  duration_sec    INTEGER,
  pre_distress    SMALLINT CHECK (pre_distress BETWEEN 1 AND 10),
  post_distress   SMALLINT CHECK (post_distress BETWEEN 1 AND 10),
  completed       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS reset_sessions_user_idx
  ON public.reset_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reset_sessions_type_idx
  ON public.reset_sessions (activity_type);

-- ============================================================
-- 3. user_streaks — 스트릭 현황
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_streaks (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak  INTEGER DEFAULT 0 NOT NULL,
  longest_streak  INTEGER DEFAULT 0 NOT NULL,
  last_active_date DATE,
  freeze_available BOOLEAN DEFAULT FALSE NOT NULL,
  freeze_used_at  DATE,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 4. user_badges — 획득 배지
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_badges (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id  TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS user_badges_user_idx
  ON public.user_badges (user_id);

-- ============================================================
-- 5. RLS 정책
-- ============================================================

-- daily_checkins RLS
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_checkins_select_own" ON public.daily_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_checkins_insert_own" ON public.daily_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_checkins_update_own" ON public.daily_checkins
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_checkins_admin_select" ON public.daily_checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- reset_sessions RLS
ALTER TABLE public.reset_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reset_sessions_select_own" ON public.reset_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reset_sessions_insert_own" ON public.reset_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reset_sessions_admin_select" ON public.reset_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- user_streaks RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_streaks_select_own" ON public.user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_streaks_insert_own" ON public.user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_streaks_update_own" ON public.user_streaks
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_badges RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_badges_select_own" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_badges_insert_own" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_badges_admin_select" ON public.user_badges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- 6. notification_preferences — 알림 설정
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  checkin_enabled   BOOLEAN DEFAULT TRUE NOT NULL,
  checkin_time      TIME DEFAULT '09:00' NOT NULL,
  streak_reminder   BOOLEAN DEFAULT TRUE NOT NULL,
  weekly_review     BOOLEAN DEFAULT TRUE NOT NULL,
  survey_reminder   BOOLEAN DEFAULT TRUE NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_prefs_select_own" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notif_prefs_insert_own" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notif_prefs_update_own" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 7. program_enrollments — 프로그램 참여/진행 상태
-- ============================================================

CREATE TABLE IF NOT EXISTS public.program_enrollments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  program_id      TEXT NOT NULL,
  current_day     INTEGER DEFAULT 1 NOT NULL,
  status          TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'completed', 'abandoned')),
  daily_progress  JSONB DEFAULT '{}' NOT NULL,
  started_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at    TIMESTAMPTZ,
  UNIQUE(user_id, program_id)
);

CREATE INDEX IF NOT EXISTS program_enrollments_user_idx
  ON public.program_enrollments (user_id);

ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "program_enrollments_select_own" ON public.program_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "program_enrollments_insert_own" ON public.program_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "program_enrollments_update_own" ON public.program_enrollments
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "program_enrollments_admin_select" ON public.program_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- 8. journal_entries 확장 (무드 태깅 + 프롬프트)
-- 기존 init-schema.sql에서 생성된 테이블에 컬럼 추가
-- ============================================================

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS mood SMALLINT CHECK (mood BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS prompt_category TEXT,
  ADD COLUMN IF NOT EXISTS prompt_text TEXT;

-- ============================================================
-- 9. user_streaks 관리자 조회 정책
-- ============================================================

CREATE POLICY "user_streaks_admin_select" ON public.user_streaks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

DO $$
BEGIN
  RAISE NOTICE '뉴럴리셋 테이블 생성 완료: daily_checkins, reset_sessions, user_streaks, user_badges, notification_preferences, program_enrollments';
  RAISE NOTICE 'journal_entries 확장 완료: mood, prompt_category, prompt_text 컬럼 추가';
END $$;
