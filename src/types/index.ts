// ============================================================
// OsangCare 공통 타입 정의
// ============================================================

export type UserRole = 'user' | 'admin' | 'super_admin'

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'

export type SurveyType = 'phq9' | 'gad7' | 'asrs'

export type SeverityLevel = 'normal' | 'mild' | 'moderate' | 'severe' | 'crisis'

export type AssessmentSeverity = 'normal' | 'mild' | 'moderate' | 'severe'

// ============================================================
// 사용자 프로필
// ============================================================

export interface Profile {
  id: string
  email: string
  gender: Gender | null
  birth_date: string | null
  primary_symptoms: string[]
  occupation: string | null
  current_treatments: string[]
  role: UserRole
  privacy_consent_at: string | null
  privacy_consent_version: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// 설문 응답
// ============================================================

export interface SurveyResponse {
  id: string
  user_id: string
  survey_type: SurveyType
  responses: Record<string, number>
  total_score: number
  severity_level: SeverityLevel
  crisis_flag: boolean
  created_at: string
}

export interface AnonymousAssessment {
  id: string
  session_id: string
  survey_type: 'compass31'
  responses: Record<string, number>
  total_score: number | null
  domain_scores: Record<string, number> | null
  severity_level: AssessmentSeverity | null
  converted_to_member: boolean
  created_at: string
}

// ============================================================
// 설문지 스키마 타입
// ============================================================

export interface QuestionOption {
  value: number
  text: string
}

export interface QuestionItem {
  id: string
  number: number
  text: string
  options: QuestionOption[]
  reverse?: boolean
  domain?: string
  part?: string
}

export interface SeverityDefinition {
  min: number
  max: number
  label: string
  level: SeverityLevel | AssessmentSeverity
}

export interface SafetyProtocol {
  trigger_score: number
  message: string
  crisis_line: string
  crisis_line_name: string
  crisis_line_hours?: string
  hospital_message: string
}

export interface ScoringConfig {
  method: 'sum' | 'weighted_domain' | 'asrs_screening'
  max_score: number
  reverse_items?: string[]
  domains?: CompassDomain[]
  screening_items?: string[]
  screening_threshold?: number
  screening_cutoffs?: Record<string, number>
}

export interface CompassDomain {
  id: string
  name: string
  weight: number
  items: string[]
  max_raw_score: number
}

export interface Questionnaire {
  id: string
  title: string
  description: string
  version: string
  scoring: ScoringConfig
  severity_levels: SeverityDefinition[]
  safety_protocol?: SafetyProtocol
  items: QuestionItem[]
  footer_disclaimer: string
  score_response?: Record<string, string>
}

// ============================================================
// COMPASS-31 도메인 점수
// ============================================================

export interface Compass31DomainScore {
  id: string
  name: string
  raw_score: number
  weighted_score: number
  max_weighted_score: number
}

export interface Compass31Result {
  total_score: number
  domain_scores: Record<string, number>
  domain_details: Compass31DomainScore[]
  severity_level: AssessmentSeverity
  severity_label: string
}

// ============================================================
// 감사일기
// ============================================================

export interface JournalEntry {
  id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

// ============================================================
// 관리자 대시보드 집계 데이터
// ============================================================

export interface MonthlySignup {
  month: string
  signup_count: number
  male_count: number
  female_count: number
}

export interface MonthlySurveyAvg {
  month: string
  survey_type: SurveyType
  avg_score: number
  median_score: number
  response_count: number
  active_users: number
}

export interface AgeGroupSymptoms {
  age_group: string
  survey_type: SurveyType
  avg_score: number
  response_count: number
}

export interface Phq9TrendSummary {
  month: string
  improved_count: number
  worsened_count: number
  stable_count: number
  total_count: number
}

// ============================================================
// 명상음악
// ============================================================

export type MusicSourceType = 'youtube' | 'binaural' | 'storage'

// ============================================================
// 건강 정보 (교육 콘텐츠)
// ============================================================

export interface EducationalContent {
  id: string
  title: string
  category: string
  summary: string
  body: string
  tags: string[]
  file_url: string | null
  visibility: 'public' | 'assigned'
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ContentAssignment {
  id: string
  patient_id: string
  content_id: string
  assigned_by: string | null
  assigned_at: string
  read_at: string | null
}

export interface AssignedContentWithDetails extends ContentAssignment {
  content: EducationalContent
}

// ============================================================
// 명상음악
// ============================================================

export interface MusicTrack {
  id: string
  title: string
  description: string | null
  source_type: MusicSourceType
  source_url: string | null
  binaural_base_hz: number | null
  binaural_beat_hz: number | null
  category: string
  sort_order: number
  is_active: boolean
  created_at: string
}
