import { Skeleton } from '@/components/ui/skeleton'

export default function SurveyLoading() {
  return (
    <div className="space-y-6">
      {/* 제목 */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* 설문 유형 선택 카드 */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>

      {/* 면책 문구 */}
      <Skeleton className="h-3 w-56 mx-auto" />
    </div>
  )
}
