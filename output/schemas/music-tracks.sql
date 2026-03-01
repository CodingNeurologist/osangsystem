-- ============================================================
-- OsangCare music_tracks 테이블
-- init-schema.sql + rls-policies.sql 실행 후 실행
-- ============================================================

CREATE TABLE IF NOT EXISTS public.music_tracks (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title             TEXT NOT NULL,
  description       TEXT,
  source_type       TEXT NOT NULL CHECK (source_type IN ('youtube', 'binaural', 'storage')),
  source_url        TEXT,
  binaural_base_hz  INTEGER CHECK (binaural_base_hz BETWEEN 20 AND 20000),
  binaural_beat_hz  INTEGER CHECK (binaural_beat_hz BETWEEN 1 AND 100),
  category          TEXT NOT NULL DEFAULT 'meditation',
  sort_order        INTEGER NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS music_tracks_is_active_idx ON public.music_tracks (is_active);
CREATE INDEX IF NOT EXISTS music_tracks_sort_order_idx ON public.music_tracks (sort_order);
CREATE INDEX IF NOT EXISTS music_tracks_category_idx ON public.music_tracks (category);

-- RLS 설정
ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;

-- 활성 트랙은 인증된 사용자 누구나 조회 가능
CREATE POLICY "music_tracks_select_active" ON public.music_tracks
  FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

-- 관리자만 INSERT/UPDATE/DELETE (service role API에서 처리)
-- (API Route에서 service_role 클라이언트를 사용하므로 별도 정책 불필요)

-- 샘플 데이터 (초기 트랙)
INSERT INTO public.music_tracks (title, description, source_type, source_url, category, sort_order)
VALUES
  ('자연의 소리 — 숲속 빗소리', '빗소리와 새소리가 어우러진 자연 사운드스케이프', 'youtube', 'https://www.youtube.com/watch?v=example1', 'nature', 10),
  ('바이노럴 비트 — 알파파 10Hz', '집중과 이완을 돕는 알파파 대역 바이노럴 비트 (200Hz 기본음)', 'binaural', NULL, 'binaural', 20),
  ('바이노럴 비트 — 세타파 6Hz', '깊은 명상과 수면을 유도하는 세타파 바이노럴 비트 (200Hz 기본음)', 'binaural', NULL, 'binaural', 30)
ON CONFLICT DO NOTHING;

-- binaural 타입은 source_url 불필요, base_hz/beat_hz는 프론트에서 관리
UPDATE public.music_tracks
SET binaural_base_hz = 200, binaural_beat_hz = 10
WHERE title LIKE '%알파파%';

UPDATE public.music_tracks
SET binaural_base_hz = 200, binaural_beat_hz = 6
WHERE title LIKE '%세타파%';

DO $$
BEGIN
  RAISE NOTICE 'music_tracks 테이블 생성 및 샘플 데이터 삽입 완료';
END $$;
