import type { Metadata } from 'next'
import Compass31Survey from '@/components/survey/Compass31Survey'

export const metadata: Metadata = {
  title: '정밀 자율신경 검사 (COMPASS-31) 설문',
}

export default function Compass31SurveyPage() {
  return <Compass31Survey />
}
