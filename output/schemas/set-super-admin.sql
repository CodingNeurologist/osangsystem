-- ============================================================
-- OsangCare 최초 super_admin 계정 설정
-- 실행 방법: Supabase SQL Editor에서 실행
-- 전제: 해당 이메일로 먼저 회원가입이 완료되어 있어야 합니다.
-- ============================================================

-- 방법 1: 이메일로 super_admin 권한 부여 (권장)
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'YOUR_ADMIN_EMAIL@example.com';  -- 실제 관리자 이메일로 교체

-- 적용 결과 확인
SELECT id, email, role, created_at
FROM public.profiles
WHERE role = 'super_admin';

-- ============================================================
-- (선택) 방법 2: 이메일을 모를 때 — auth.users에서 UUID 조회 후 적용
-- ============================================================
-- SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 10;
-- UPDATE public.profiles SET role = 'super_admin' WHERE id = 'USER_UUID_HERE';

-- ============================================================
-- (선택) 일반 관리자 추가 (super_admin이 생긴 후, 앱 UI에서도 가능)
-- ============================================================
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'another_admin@example.com';
