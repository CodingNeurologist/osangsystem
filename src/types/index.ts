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
  survey_type: 'compass31' | 'stress_check'
  responses: Record<string, number | string | string[] | boolean>
  total_score: number | null
  domain_scores: Record<string, number> | null
  severity_level: AssessmentSeverity | StressCheckSeverity | null
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
// COMPASS-31 설문 시스템 (spec 기반)
// ============================================================

export interface SurveyQuestion {
  id: string
  text: string
  type: 'single' | 'multiple' | 'scale' | 'text' | 'slider' | 'timeRange'
  options?: string[]
  optionScores?: number[]
  domain?: string
  showIf?: {
    questionId: string
    equals?: string
    notEquals?: string
  }
  scaleMin?: number
  scaleMax?: number
  scaleLabels?: { min: string; max: string }
  sliderUnit?: string
  timeRangeLabels?: { start: string; end: string }
  required: boolean
}

export interface ScoringRule {
  minScore: number
  maxScore: number
  severity: 'minimal' | 'mild' | 'moderate' | 'severe'
  interpretation: string
}

export interface Survey {
  id: string
  title: string
  description: string
  questions: SurveyQuestion[]
  scoringRules?: ScoringRule[]
  scoringType?: 'simple' | 'weighted'
  domainWeights?: Record<string, number>
  repeatable?: boolean
}

export type SurveyAnswers = Record<string, string | string[] | number>

// ============================================================
// 감사일기
// ============================================================

export interface JournalEntry {
  id: string
  user_id: string
  content: string
  mood: number | null
  prompt_category: string | null
  prompt_text: string | null
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

// ============================================================
// 스트레스 자가체크 (Stress Check)
// ============================================================

export interface StressCheckItem {
  id: string
  text: string
}

export interface StressCheckCategory {
  id: string
  name: string
  icon: string
  description: string
  items: StressCheckItem[]
  weight: number
}

export interface StressCheckLifestyleQuestion {
  id: string
  text: string
  type: 'slider' | 'single'
  options?: string[]
  sliderMin?: number
  sliderMax?: number
  sliderUnit?: string
}

export type StressCheckSeverity = 'normal' | 'caution' | 'attention' | 'consult'

export interface StressCheckCategoryScore {
  categoryId: string
  categoryName: string
  checked: number
  total: number
  percentage: number
  weightedScore: number
}

export interface StressCheckScoreResult {
  categoryScores: StressCheckCategoryScore[]
  overallScore: number
  severity: StressCheckSeverity
  severityLabel: string
  topConcerns: string[]
  lifestyleData: Record<string, string | number>
}

// ============================================================
// 뉴럴리셋 (Neural Reset)
// ============================================================

export type ResetActivityType = 'breathing' | 'somatic' | 'meditation' | 'journal' | 'sos'

export interface DailyCheckin {
  id: string
  user_id: string
  check_date: string
  body_score: number
  mood_score: number
  energy_score: number
  stress_score: number
  symptoms: string[]
  created_at: string
}

export interface ResetSession {
  id: string
  user_id: string
  activity_type: ResetActivityType
  activity_detail: Record<string, string | number | boolean>
  duration_sec: number | null
  pre_distress: number | null
  post_distress: number | null
  completed: boolean
  created_at: string
}

export interface UserStreak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_active_date: string | null
  freeze_available: boolean
  freeze_used_at: string | null
  updated_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
}

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string
  condition: string
}

export interface BreathingPattern {
  id: string
  name: string
  description: string
  purpose: string
  inhale: number
  hold1: number
  exhale: number
  hold2: number
  defaultCycles: number
}

export type CheckinSeverity = 'good' | 'normal' | 'caution' | 'crisis'

export interface CheckinRecommendation {
  activityType: ResetActivityType
  title: string
  description: string
  route: string
  duration: string
}

export interface SomaticExercise {
  id: string
  name: string
  description: string
  duration: string
  durationSec: number
  effect: string
  difficulty: '쉬움' | '보통'
  icon: string
  tags: string[]
  steps: SomaticExerciseStep[]
}

export interface SomaticExerciseStep {
  instruction: string
  durationSec: number
}

export type JournalPromptCategory = 'gratitude' | 'achievement' | 'relationship' | 'nature' | 'selfcare'

export interface JournalPrompt {
  text: string
  category: JournalPromptCategory
}
