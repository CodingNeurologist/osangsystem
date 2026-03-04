import { Skeleton } from '@/components/ui/skeleton'

export default function AppLoading() {
  return (
    <div className="space-y-6">
      {/* 인사말 */}
      <div className="pt-2 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-48" />
      </div>

      {/* 설문 CTA 카드 */}
      <Skeleton className="h-20 w-full rounded-2xl" />

      {/* 기능 카드 그리드 */}
      <div>
        <Skeleton className="h-3 w-16 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>

      {/* COMPASS-31 CTA */}
      <Skeleton className="h-16 w-full rounded-xl" />

      {/* 병원 안내 */}
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  )
}
