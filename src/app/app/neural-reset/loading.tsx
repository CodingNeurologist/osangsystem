import { Skeleton } from '@/components/ui/skeleton'

export default function NeuralResetLoading() {
  return (
    <div className="space-y-6">
      {/* SOS 버튼 */}
      <Skeleton className="h-14 w-full rounded-xl" />

      {/* 오늘의 컨디션 */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>

      {/* 추천 활동 */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>

      {/* 빠른 접근 그리드 */}
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>

      {/* 스트릭 */}
      <Skeleton className="h-16 w-full rounded-xl" />

      {/* 무드 캘린더 */}
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
}
