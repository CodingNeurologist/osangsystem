-- ============================================================
-- HRV 측정 이력 테이블
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 1. hrv_measurements — HRV 측정 상세 기록
CREATE TABLE IF NOT EXISTS public.hrv_measurements (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- 시간 영역 지표
  mean_hr         REAL NOT NULL,
  sdnn            REAL NOT NULL,
  rmssd           REAL NOT NULL,
  pnn50           REAL NOT NULL,
  min_hr          SMALLINT NOT NULL,
  max_hr          SMALLINT NOT NULL,
  nn_count        SMALLINT NOT NULL,

  -- 주파수 영역 (nullable)
  lf_power        REAL,
  hf_power        REAL,
  lf_hf_ratio     REAL,

  -- 부정맥/이소성 박동 정보
  ectopic_count   SMALLINT NOT NULL DEFAULT 0,
  ectopic_ratio   REAL NOT NULL DEFAULT 0,
  arrhythmia_burden TEXT NOT NULL DEFAULT 'normal'
    CHECK (arrhythmia_burden IN ('normal', 'borderline', 'excessive')),

  -- 측정 품질
  confidence_score REAL NOT NULL,
  confidence_label TEXT NOT NULL CHECK (confidence_label IN ('높음', '보통', '낮음')),
  valid_beat_count SMALLINT NOT NULL,
  clean_signal_ratio REAL NOT NULL,
  measurement_duration REAL NOT NULL,

  -- 해석
  interpretation_level TEXT NOT NULL CHECK (interpretation_level IN ('good', 'normal', 'low')),
  interpretation_title TEXT NOT NULL,

  -- RR 인터벌 원시 데이터 (분석용)
  rr_intervals_json JSONB,

  -- 사용자 메모 (급격한 변화 시 로깅)
  user_note       TEXT,

  -- 시스템 플래그
  is_anomaly      BOOLEAN DEFAULT FALSE,
  anomaly_reason  TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS hrv_measurements_user_date_idx
  ON public.hrv_measurements (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS hrv_measurements_anomaly_idx
  ON public.hrv_measurements (user_id, is_anomaly)
  WHERE is_anomaly = TRUE;

-- RLS 정책
ALTER TABLE public.hrv_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own HRV measurements"
  ON public.hrv_measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own HRV measurements"
  ON public.hrv_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own HRV measurements"
  ON public.hrv_measurements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all HRV measurements"
  ON public.hrv_measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 2. reset_sessions 테이블에 'hrv' 타입 추가 (이미 없는 경우)
-- 기존 CHECK 제약조건을 드롭하고 재생성
DO $$
BEGIN
  -- 기존 CHECK 제약 조건 제거 시도
  ALTER TABLE public.reset_sessions
    DROP CONSTRAINT IF EXISTS reset_sessions_activity_type_check;

  -- 새 CHECK 제약 조건 추가 (hrv 포함)
  ALTER TABLE public.reset_sessions
    ADD CONSTRAINT reset_sessions_activity_type_check
    CHECK (activity_type IN ('breathing', 'somatic', 'meditation', 'journal', 'sos', 'hrv'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
