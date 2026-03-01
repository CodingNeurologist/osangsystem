import type { Metadata } from 'next'
import Compass31Survey from '@/components/survey/Compass31Survey'

export const metadata: Metadata = {
  title: '자율신경실조증 자가진단 설문',
}

export default function CheckSurveyPage() {
  return <Compass31Survey />
}
