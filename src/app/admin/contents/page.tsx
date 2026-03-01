import type { Metadata } from 'next'
import ContentManagement from '@/components/admin/ContentManagement'

export const metadata: Metadata = {
  title: '콘텐츠 관리',
}

export default function AdminContentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">콘텐츠 관리</h1>
        <p className="text-zinc-500 text-sm mt-1">
          건강 교육 콘텐츠를 등록하고 환자에게 배정합니다.
        </p>
      </div>
      <ContentManagement />
    </div>
  )
}
