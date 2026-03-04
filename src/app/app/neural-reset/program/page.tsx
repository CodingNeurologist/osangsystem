import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PROGRAMS } from '@/data/programs'
import ProgramList from '@/components/neural-reset/ProgramList'

export const metadata: Metadata = {
  title: '프로그램 | 오상케어',
  description: '단계별 자율신경 안정화 프로그램',
}

export default async function ProgramPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div className="px-4 py-6 max-w-screen-md mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">프로그램</h1>
        <p className="text-sm text-zinc-500 mt-1">
          단계별 커리큘럼으로 자율신경계를 안정시켜 보세요.
        </p>
      </div>
      <ProgramList programs={PROGRAMS} enrollments={enrollments ?? []} />
    </div>
  )
}
