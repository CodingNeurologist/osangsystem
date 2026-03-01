'use client'

import { useState } from 'react'
import type { UserRole } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Admin {
  id: string
  email: string
  role: UserRole
  created_at: string
}

interface AdminUserTableProps {
  admins: Admin[]
  currentUserId: string
}

const ROLE_LABELS: Record<UserRole, string> = {
  user: '일반 사용자',
  admin: '관리자',
  super_admin: '슈퍼 관리자',
}

export default function AdminUserTable({ admins: initial, currentUserId }: AdminUserTableProps) {
  const [admins, setAdmins] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function changeRole(targetId: string, newRole: UserRole) {
    setLoading(targetId)
    setError(null)

    const res = await fetch('/api/admin/users/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: targetId, new_role: newRole }),
    })

    if (res.ok) {
      setAdmins((prev) =>
        newRole === 'user'
          ? prev.filter((a) => a.id !== targetId)
          : prev.map((a) => (a.id === targetId ? { ...a, role: newRole } : a))
      )
    } else {
      const data = await res.json()
      setError(data.error ?? '역할 변경에 실패했습니다.')
    }

    setLoading(null)
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이메일</TableHead>
              <TableHead>역할</TableHead>
              <TableHead className="hidden md:table-cell">가입일</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="text-zinc-800">{admin.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={admin.role === 'super_admin' ? 'default' : 'secondary'}
                    className={
                      admin.role === 'super_admin'
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                    }
                  >
                    {ROLE_LABELS[admin.role]}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-500 hidden md:table-cell">
                  {new Date(admin.created_at).toLocaleDateString('ko-KR')}
                </TableCell>
                <TableCell className="text-right">
                  {admin.id !== currentUserId ? (
                    <div className="flex justify-end gap-1">
                      {admin.role !== 'super_admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => changeRole(admin.id, 'super_admin')}
                          disabled={loading === admin.id}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          슈퍼 승격
                        </Button>
                      )}
                      {admin.role !== 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => changeRole(admin.id, 'admin')}
                          disabled={loading === admin.id}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          관리자로
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => changeRole(admin.id, 'user')}
                        disabled={loading === admin.id}
                        className="text-red-500 hover:text-red-600"
                      >
                        권한 해제
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400">본인</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {admins.length === 0 && (
          <p className="text-center text-sm text-zinc-400 py-8">관리자 계정이 없습니다.</p>
        )}
      </Card>

      <Card className="bg-zinc-50 border-zinc-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-700">일반 사용자 권한 부여 방법</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-zinc-600">
            일반 사용자에게 관리자 권한을 부여하려면 Supabase Dashboard에서 직접
            해당 사용자의 profiles 테이블 role 컬럼을 수정하거나,
            아래 SQL 함수를 실행하세요.
          </p>
          <code className="block mt-2 text-xs bg-zinc-100 rounded px-3 py-2 text-zinc-700 font-mono">
            SELECT set_user_role({'\'사용자-UUID\''}, {'\'admin\''});
          </code>
        </CardContent>
      </Card>
    </div>
  )
}
