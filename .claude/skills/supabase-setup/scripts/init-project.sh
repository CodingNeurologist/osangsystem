#!/bin/bash
# OsangCare 프로젝트 초기화 스크립트
# 사용법: bash .claude/skills/supabase-setup/scripts/init-project.sh

set -e

echo "OsangCare 프로젝트 초기화 시작..."

# 환경변수 확인
if [ ! -f ".env.local" ]; then
  if [ -f ".env.example" ]; then
    echo ".env.example → .env.local 복사"
    cp .env.example .env.local
    echo ".env.local 파일을 열어 Supabase 설정 값을 입력하세요."
    exit 1
  else
    echo "오류: .env.example 파일이 없습니다."
    exit 1
  fi
fi

# 필수 환경변수 확인
required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY")
for var in "${required_vars[@]}"; do
  if ! grep -q "^${var}=" .env.local || grep -q "^${var}=your-" .env.local; then
    echo "오류: ${var}가 설정되지 않았습니다. .env.local을 확인하세요."
    exit 1
  fi
done

echo "환경변수 확인 완료"

# 의존성 설치 확인
if [ ! -d "node_modules" ]; then
  echo "의존성 설치 중..."
  npm install
fi

# TypeScript 빌드 테스트
echo "TypeScript 빌드 테스트..."
npx tsc --noEmit 2>&1 | head -20 || echo "TypeScript 오류 발생 — 수정 필요"

echo ""
echo "초기화 완료!"
echo ""
echo "다음 단계:"
echo "1. Supabase Dashboard → SQL Editor에서 다음 파일을 순서대로 실행:"
echo "   - .claude/skills/supabase-setup/scripts/init-schema.sql"
echo "   - .claude/skills/supabase-setup/scripts/rls-policies.sql"
echo "2. npm run dev 실행"
echo "3. localhost:3000 접속 확인"
