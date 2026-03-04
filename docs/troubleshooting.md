# OsangCare 트러블슈팅 가이드

이 문서는 개발 중 발생한 오류와 해결 방법을 기록합니다. 동일한 오류 발생 시 즉시 참조하세요.

---

## 1. Turbopack HMR "module factory is not available" 오류

**발생일**: 2026-03-01
**환경**: Next.js 16.1.6 (Turbopack), lucide-react v0.575.0

### 증상

```
Module [project]/node_modules/lucide-react/dist/esm/icons/[icon-name].js [app-client] (ecmascript)
<export default as [IconName]> was instantiated because it was required from module
[project]/src/components/[...].tsx [app-client] (ecmascript),
but the module factory is not available. It might have been deleted in an HMR update.
```

- 개발 서버 실행 시 즉시 발생
- 프로덕션 빌드(`npm run build`)는 정상 성공
- 오류에 표시된 파일이 실제로 해당 모듈을 import하지 않을 수 있음

### 원인

- Turbopack의 HMR 모듈 그래프가 대형 barrel export 라이브러리 처리 중 손상됨
- lucide-react는 1,500개 이상의 아이콘을 단일 barrel 파일로 re-export
- HMR 업데이트 시 개별 아이콘 모듈 팩토리가 삭제된 후 재생성되지 않는 경우 발생
- `.next` 캐시의 스테일 모듈 그래프가 잘못된 의존성 참조를 유지

### 해결 순서 (위에서부터 시도)

1. **`.next` 캐시 삭제 후 재시작**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **`next.config.ts`에 `optimizePackageImports` 명시 확인**
   ```typescript
   experimental: {
     optimizePackageImports: ['lucide-react'],
   },
   ```
   - SWC가 barrel import를 개별 import로 변환하여 Turbopack 모듈 그래프 부담 감소
   - lucide-react는 Next.js 기본 목록에 포함되어 있지만, 명시 추가 시 엣지 케이스 해결

3. **Webpack으로 폴백** (위 방법으로 해결되지 않을 때)
   ```json
   "scripts": {
     "dev": "next dev --webpack"
   }
   ```
   - Turbopack 버그를 완전히 우회
   - 프로덕션 빌드에는 영향 없음
   - 콜드 스타트/HMR이 다소 느려짐

4. **Deep import로 전환** (최후의 수단)
   ```typescript
   // 변경 전 (barrel import)
   import { Home, Heart } from 'lucide-react'

   // 변경 후 (deep import)
   import Home from 'lucide-react/dist/esm/icons/home'
   import Heart from 'lucide-react/dist/esm/icons/heart'
   ```

### 예방법

- lucide-react에서 `import * as Icons from 'lucide-react'` 와일드카드 import 금지
- lucide-react 버전 업데이트 시 개발 서버에서 HMR 동작 반드시 검증
- 오류 발생 시 `.next` 삭제부터 시도

---

## 2. 개발 서버 vs 프로덕션 빌드 차이

### 배경

- `npm run dev`: Turbopack 사용 (Next.js 16+ 기본값)
- `npm run build`: Webpack 사용

### 주의사항

- 개발에서만 발생하는 오류는 Turbopack 관련 이슈일 가능성 높음
- 프로덕션 빌드 성공 여부를 항상 먼저 확인
- 개발 전용 오류는 `.next` 캐시 삭제로 대부분 해결

---

## 3. Next.js config 이전(migration) 주의사항

**발생일**: 2026-03-01
**환경**: Next.js 16.1.6

### 증상

```
⚠ `experimental.typedRoutes` has been moved to `typedRoutes`.
```

### 해결

Next.js 버전 업그레이드 시 `experimental` 블록에서 상위 레벨로 이동된 옵션이 있는지 확인.

```typescript
// 변경 전
experimental: {
  typedRoutes: true,  // deprecated 위치
}

// 변경 후
typedRoutes: true,  // 최상위 레벨로 이동
experimental: {
  // 아직 experimental인 옵션만 유지
}
```
