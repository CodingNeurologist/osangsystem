# OsangCare 배포 가이드

## 사전 준비

### 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) → 새 프로젝트 생성
2. 리전: **Northeast Asia (Seoul)** 선택
3. 프로젝트 생성 완료 후 다음 값 복사:
   - Project URL
   - `anon` (public) 키
   - `service_role` 키 (비공개)

### 2. SQL 실행 순서 (Supabase SQL Editor)

반드시 아래 순서대로 실행:

```
1. .claude/skills/supabase-setup/scripts/init-schema.sql
2. .claude/skills/supabase-setup/scripts/rls-policies.sql
3. output/schemas/music-tracks.sql
```

### 3. Supabase Auth 설정

**Email Auth**
- Supabase Dashboard → Authentication → Providers → Email 활성화
- Confirm email: 선택 사항 (활성화 권장)

**카카오 OAuth**
1. [developers.kakao.com](https://developers.kakao.com) → 앱 생성
2. 제품 설정 → 카카오 로그인 → 활성화
3. Redirect URI 추가: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Supabase Dashboard → Authentication → Providers → Kakao → Client ID/Secret 입력

**Google OAuth**
1. [console.cloud.google.com](https://console.cloud.google.com) → OAuth 2.0 클라이언트 생성
2. Redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Authentication → Providers → Google → Client ID/Secret 입력

### 4. 최초 super_admin 계정 설정

1. 앱에서 관리자로 사용할 이메일로 회원가입
2. `output/schemas/set-super-admin.sql`을 Supabase SQL Editor에서 실행
   - `YOUR_ADMIN_EMAIL@example.com`을 실제 이메일로 교체

---

## 환경변수 설정

### 로컬 개발 (.env.local)

`.env.local` 파일에 실제 값 입력:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# VAPID 키는 이미 생성됨 (.env.local 참고)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@osangneurology.com

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_HOSPITAL_PHONE=031-000-0000
```

---

## Vercel 배포

### 1. GitHub 저장소 연결

```bash
cd osangcare
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_ORG/osangcare.git
git push -u origin main
```

### 2. Vercel 프로젝트 생성

1. [vercel.com](https://vercel.com) → New Project → GitHub 저장소 선택
2. Framework Preset: **Next.js** (자동 감지)
3. Root Directory: `osangcare` (모노레포 구조인 경우)

### 3. Vercel 환경변수 설정

Vercel Dashboard → Project → Settings → Environment Variables에서 추가:

| 변수명 | 값 | 환경 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Production, Preview |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key | All |
| `VAPID_PRIVATE_KEY` | VAPID private key | Production, Preview |
| `VAPID_SUBJECT` | `mailto:admin@osangneurology.com` | All |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR_DOMAIN.vercel.app` | Production |
| `NEXT_PUBLIC_HOSPITAL_PHONE` | 병원 전화번호 | All |

### 4. Supabase Auth Redirect URLs 추가

Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://YOUR_DOMAIN.vercel.app`
- Redirect URLs 추가:
  - `https://YOUR_DOMAIN.vercel.app/auth/callback`
  - `https://YOUR_DOMAIN.vercel.app/**`

### 5. 배포 확인

```bash
# 로컬 프로덕션 빌드 테스트
npm run build
npm start
```

Vercel에서 자동 배포 후:
- `/check` — 자가진단 설문 접근 가능 (비회원)
- `/login` — 로그인 페이지
- `/app` — 회원 전용 (리다이렉트 확인)
- `/admin` — 관리자 전용 (리다이렉트 확인)

---

## 배포 후 체크리스트

- [ ] 자가진단 설문 (COMPASS-31) 응답 및 결과 확인
- [ ] 이메일 회원가입 → 로그인 → `/app` 진입 확인
- [ ] 카카오/구글 소셜 로그인 확인
- [ ] PHQ-9 20점 이상 시 위기 배너 표시 확인
- [ ] 관리자 계정으로 `/admin` 접근 확인
- [ ] PWA 홈 화면 추가 기능 확인 (모바일)
- [ ] Supabase Storage — 음악 파일 업로드 테스트 (선택)

---

## Supabase 프로덕션 설정

### Storage 버킷 생성 (음악 파일 저장용)

Supabase Dashboard → Storage → New bucket:
- 이름: `music`
- Public: **비공개** (서명된 URL 사용)

### Storage RLS 정책 추가

```sql
-- music 버킷: 인증된 사용자만 읽기
CREATE POLICY "music_read_authenticated"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'music' AND auth.uid() IS NOT NULL);

-- music 버킷: service_role만 업로드 (관리자 API 경유)
```

### 백업 설정

Supabase Dashboard → Project Settings → Backups:
- Point-in-time recovery (PITR) 활성화 권장 (Pro 플랜)

---

## 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| 로그인 후 리다이렉트 루프 | Supabase Site URL 불일치 | Auth → URL Configuration 확인 |
| RLS 오류 (permission denied) | RLS 정책 미적용 | rls-policies.sql 재실행 |
| 소셜 로그인 실패 | OAuth redirect URI 불일치 | 카카오/구글 콘솔 + Supabase 설정 비교 |
| 빌드 오류 | 환경변수 누락 | Vercel 환경변수 전체 확인 |
