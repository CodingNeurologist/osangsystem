-- ============================================================
-- educational_contents + content_assignments 테이블
-- Supabase SQL Editor에서 실행
-- ============================================================

-- ============================================================
-- 1. educational_contents 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS public.educational_contents (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title        TEXT NOT NULL,
  category     TEXT NOT NULL,
  summary      TEXT DEFAULT '' NOT NULL,
  body         TEXT DEFAULT '' NOT NULL,
  tags         TEXT[] DEFAULT '{}',
  file_url     TEXT,
  visibility   TEXT DEFAULT 'assigned' CHECK (visibility IN ('public', 'assigned')),
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS educational_contents_category_idx ON public.educational_contents (category);
CREATE INDEX IF NOT EXISTS educational_contents_visibility_idx ON public.educational_contents (visibility);
CREATE INDEX IF NOT EXISTS educational_contents_created_at_idx ON public.educational_contents (created_at DESC);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER educational_contents_updated_at
  BEFORE UPDATE ON public.educational_contents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 2. content_assignments 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS public.content_assignments (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id   UUID REFERENCES public.educational_contents(id) ON DELETE CASCADE NOT NULL,
  assigned_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  read_at      TIMESTAMPTZ,
  UNIQUE(patient_id, content_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS content_assignments_patient_idx ON public.content_assignments (patient_id);
CREATE INDEX IF NOT EXISTS content_assignments_content_idx ON public.content_assignments (content_id);

-- ============================================================
-- 3. RLS 정책
-- ============================================================

-- educational_contents RLS
ALTER TABLE public.educational_contents ENABLE ROW LEVEL SECURITY;

-- 전체공개 콘텐츠는 로그인 사용자 누구나 조회 가능
CREATE POLICY "educational_contents_select_public" ON public.educational_contents
  FOR SELECT USING (
    visibility = 'public' AND auth.uid() IS NOT NULL
  );

-- 배정된 콘텐츠는 배정받은 환자만 조회 (content_assignments를 통해)
CREATE POLICY "educational_contents_select_assigned" ON public.educational_contents
  FOR SELECT USING (
    visibility = 'assigned' AND EXISTS (
      SELECT 1 FROM public.content_assignments
      WHERE content_assignments.content_id = educational_contents.id
        AND content_assignments.patient_id = auth.uid()
    )
  );

-- 관리자 INSERT/UPDATE/DELETE는 service role API Route를 통해 처리
-- (클라이언트에서 직접 insert하는 경우를 위한 정책)
CREATE POLICY "educational_contents_admin_all" ON public.educational_contents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- content_assignments RLS
ALTER TABLE public.content_assignments ENABLE ROW LEVEL SECURITY;

-- 환자: 자신에게 배정된 항목만 조회
CREATE POLICY "content_assignments_select_own" ON public.content_assignments
  FOR SELECT USING (auth.uid() = patient_id);

-- 환자: 자신의 read_at만 수정 가능
CREATE POLICY "content_assignments_update_read" ON public.content_assignments
  FOR UPDATE USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- 관리자: 전체 CRUD
CREATE POLICY "content_assignments_admin_all" ON public.content_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );
