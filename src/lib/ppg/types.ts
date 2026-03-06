// ============================================================
// PPG/HRV 측정 타입 정의
// ============================================================

/** PPG 측정 단계 */
export type PPGPhase =
  | 'idle'
  | 'permission'
  | 'calibrating'
  | 'measuring'
  | 'processing'
  | 'results'
  | 'error'

/** 카메라 프레임 데이터 */
export interface PPGFrameData {
  redMean: number
  greenMean: number
  timestamp: number
}

/** 보정 결과 */
export interface CalibrationResult {
  isValid: boolean
  baselineAmplitude: number
  redGain: number
  noiseFloor: number
  avgRedIntensity: number
  peakFrequency: number
  message: string
}

/** 보정 상태 */
export interface CalibrationState {
  samples: number[]
  timestamps: number[]
  startTime: number
}

/** 신호 품질 인덱스 */
export interface SignalQuality {
  score: number
  label: '양호' | '보통' | '불량'
  peakConsistency: number
  spectralPurity: number
  morphologyScore: number
}

/** 감지된 피크 */
export interface DetectedPeak {
  index: number
  timestamp: number
  amplitude: number
  isValid: boolean
}

/** RR 인터벌 */
export interface RRInterval {
  interval: number
  timestamp: number
  isValid: boolean
}

/** 시간 영역 HRV 지표 */
export interface HRVTimeDomain {
  meanHR: number
  sdnn: number
  rmssd: number
  pnn50: number
  minHR: number
  maxHR: number
  nnCount: number
}

/** 주파수 영역 HRV 지표 */
export interface HRVFrequencyDomain {
  lfPower: number
  hfPower: number
  lfHfRatio: number
  totalPower: number
}

/** HRV 해석 */
export interface HRVInterpretation {
  level: 'good' | 'normal' | 'low'
  title: string
  description: string
  suggestion: string
}

/** 부정맥 분석 요약 (UI 표시용) */
export interface ArrhythmiaInfo {
  burden: 'normal' | 'borderline' | 'excessive'
  ectopicRatio: number
  ectopicCount: number
  hrvMeasurable: boolean
  message: string
}

/** HRV 최종 결과 */
export interface HRVResult {
  timeDomain: HRVTimeDomain
  frequencyDomain: HRVFrequencyDomain | null
  measurementDuration: number
  cleanSignalRatio: number
  validBeatCount: number
  confidenceScore: number
  confidenceLabel: '높음' | '보통' | '낮음'
  interpretation: HRVInterpretation
  rrIntervals: RRInterval[]
  arrhythmia: ArrhythmiaInfo
}

/** Butterworth 필터 상태 */
export interface BiquadState {
  x1: number
  x2: number
  y1: number
  y2: number
}

/** Butterworth 필터 계수 */
export interface BiquadCoefficients {
  b0: number
  b1: number
  b2: number
  a1: number
  a2: number
}

/** 피크 감지기 설정 */
export interface PeakDetectorConfig {
  minPeakDistance: number
  adaptiveWindowSize: number
  thresholdMultiplier: number
  refractoryPeriod: number
  templateCorrelationMin: number
}

/** 측정 설정 */
export interface PPGConfig {
  sampleRate: number
  calibrationDuration: number
  measurementDuration: number
  bufferSize: number
  sqiThreshold: number
  minValidBeats: number
}

/** 기본 설정값 */
export const DEFAULT_PPG_CONFIG: PPGConfig = {
  sampleRate: 30,
  calibrationDuration: 10,
  measurementDuration: 90,
  bufferSize: 4096,
  sqiThreshold: 60,
  minValidBeats: 40,
}
