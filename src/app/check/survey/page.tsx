import type { Metadata } from 'next'
import StressCheckSurvey from '@/components/survey/StressCheckSurvey'

export const metadata: Metadata = {
  title: '자율신경 스트레스 자가체크 설문',
}

export default function CheckSurveyPage() {
  return <StressCheckSurvey />
}
