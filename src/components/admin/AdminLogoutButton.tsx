'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminLogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm text-red-500 hover:text-red-700 inline-flex items-center gap-1.5 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      로그아웃
    </button>
  )
}
