import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import AdminUserTable from '@/components/admin/AdminUserTable'

export const metadata: Metadata = {
  title: '사용자 관리',
}

export default async function AdminUsersPage() {
  const service = await createServiceClient()

  // 관리자 목록만 표시 (일반 사용자 개인정보 보호)
  const { data: admins } = await service
    .from('profiles')
    .select('id, email, role, created_at')
    .in('role', ['admin', 'super_admin'])
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">관리자 계정 관리</h1>
        <p className="text-zinc-500 text-sm mt-1">
          관리자 권한을 가진 계정을 관리합니다. 일반 사용자 정보는 표시되지 않습니다.
        </p>
      </div>
      <AdminUserTable admins={admins ?? []} />
    </div>
  )
}
