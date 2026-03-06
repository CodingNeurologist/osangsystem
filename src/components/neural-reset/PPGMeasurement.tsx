'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import PPGInstructions from './PPGInstructions'
import PPGWaveform from './PPGWaveform'
import HRVResults from './HRVResults'
import type {
  PPGPhase,
  HRVResult,
  CalibrationState,
  RRInterval,
} from '@/lib/ppg/types'
import { DEFAULT_PPG_CONFIG } from '@/lib/ppg/types'
import { initCamera, isCameraSupported, type CameraController } from '@/lib/ppg/camera'
import { BandpassFilter4thOrder, BaselineRemover, AdaptiveNoiseCanceller } from '@/lib/ppg/filters'
import { AdaptivePeakDetector } from '@/lib/ppg/peak-detection'
import { computeSQI } from '@/lib/ppg/signal-quality'
import {
  computeTimeDomainHRV,
  computeFrequencyDomainHRV,
  interpretHRV,
  computeConfidence,
} from '@/lib/ppg/hrv-metrics'
import { runCalibration } from '@/lib/ppg/calibration'
import { MotionArtifactDetector } from '@/lib/ppg/motion-artifact'
import { CircularBuffer } from '@/lib/ppg/circular-buffer'
import { cleanRRIntervals, getRRStats } from '@/lib/ppg/rr-artifact'

interface PPGMeasurementProps {
  onSessionComplete?: (durationSec: number, result: HRVResult) => void
}

export default function PPGMeasurement({ onSessionComplete }: PPGMeasurementProps) {
  // ── UI 상태 ────────────────────────────────────────
  const [phase, setPhase] = useState<PPGPhase>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [calibrationMessage, setCalibrationMessage] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [currentBPM, setCurrentBPM] = useState(0)
  const [sqiScore, setSqiScore] = useState(0)
  const [result, setResult] = useState<HRVResult | null>(null)
  const [torchWarning, setTorchWarning] = useState(false)
  const [debugInfo, setDebugInfo] = useState({ red: 0, green: 0, ac: 0, fps: 0 })
  const [artifactRatio, setArtifactRatio] = useState(0)

  // ── Ref (실시간 데이터, React 렌더링 회피) ──────────
  const cameraRef = useRef<CameraController | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const phaseRef = useRef<PPGPhase>('idle')
  const startTimeRef = useRef(0)
  const lastFrameTimeRef = useRef(0)
  const sampleIndexRef = useRef(0)
  const frameCountRef = useRef(0)
  const fpsTimerRef = useRef(0)

  // DSP 모듈 (v2: 4차 필터 + 적응형 노이즈 캔슬러)
  const signalBufferRef = useRef(new CircularBuffer(DEFAULT_PPG_CONFIG.bufferSize))
  const filteredBufferRef = useRef(new CircularBuffer(DEFAULT_PPG_CONFIG.bufferSize))
  const bandpassRef = useRef(new BandpassFilter4thOrder(0.7, 3.5, DEFAULT_PPG_CONFIG.sampleRate))
  const baselineRef = useRef(new BaselineRemover(300))
  const ancRef = useRef(new AdaptiveNoiseCanceller(12, 0.05))
  const peakDetectorRef = useRef(new AdaptivePeakDetector())
  const motionDetectorRef = useRef(new MotionArtifactDetector())
  const rrIntervalsRef = useRef<RRInterval[]>([])
  const calibrationRef = useRef<CalibrationState>({ samples: [], timestamps: [], startTime: 0 })
  const calibrationAttemptRef = useRef(0)
  // Green 채널 캘리브레이션 샘플
  const greenSamplesRef = useRef<number[]>([])

  const cameraSupported = typeof window !== 'undefined' ? isCameraSupported() : true

  // ── 클린업 ─────────────────────────────────────────
  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    cameraRef.current?.stop()
    cameraRef.current = null
    motionDetectorRef.current.cleanup()
  }, [])

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  // ── 측정 시작 ──────────────────────────────────────
  const handleStart = useCallback(async () => {
    setPhase('permission')
    phaseRef.current = 'permission'
    setErrorMessage('')

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) {
        throw new Error('비디오 요소를 초기화할 수 없습니다.')
      }

      const camera = await initCamera(video, canvas)
      cameraRef.current = camera

      // 토치 켜기
      const torchEnabled = await camera.enableTorch()
      if (!torchEnabled) {
        setTorchWarning(true)
      }

      // 가속도계 초기화
      motionDetectorRef.current.initAccelerometer()

      // signalBuffer 초기화
      signalBufferRef.current.clear()
      filteredBufferRef.current.clear()

      // 보정 시작
      phaseRef.current = 'calibrating'
      setPhase('calibrating')
      setCalibrationMessage('손가락을 카메라 위에 올려주세요...')
      calibrationRef.current = {
        samples: [],
        timestamps: [],
        startTime: performance.now(),
      }
      greenSamplesRef.current = []
      calibrationAttemptRef.current = 0
      frameCountRef.current = 0
      fpsTimerRef.current = performance.now()

      // 프레임 처리 시작
      lastFrameTimeRef.current = 0
      rafRef.current = requestAnimationFrame(processFrame)
    } catch (err) {
      const message = err instanceof Error ? err.message : '카메라를 사용할 수 없습니다.'
      let userMessage = message
      if (message.includes('NotAllowedError') || message.includes('Permission')) {
        userMessage = '카메라 접근 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해 주세요.'
      } else if (message.includes('NotFoundError')) {
        userMessage = '카메라를 찾을 수 없습니다. 후면 카메라가 있는 기기에서 사용해 주세요.'
      }
      setErrorMessage(userMessage)
      setPhase('error')
      phaseRef.current = 'error'
    }
  }, [])

  // ── 프레임 처리 루프 ───────────────────────────────
  const processFrame = useCallback(() => {
    if (phaseRef.current !== 'calibrating' && phaseRef.current !== 'measuring') return

    const frame = cameraRef.current?.captureFrame()
    if (!frame) {
      rafRef.current = requestAnimationFrame(processFrame)
      return
    }

    // 프레임 레이트 제한 (~30fps, 최소 25ms 간격)
    const dt = frame.timestamp - lastFrameTimeRef.current
    if (dt < 25) {
      rafRef.current = requestAnimationFrame(processFrame)
      return
    }
    lastFrameTimeRef.current = frame.timestamp
    frameCountRef.current++

    // 보정/측정 공통: signalBuffer에 raw 데이터 넣기 (파형 표시용)
    signalBufferRef.current.push(frame.redMean)

    // ── 보정 단계 ───
    if (phaseRef.current === 'calibrating') {
      calibrationRef.current.samples.push(frame.redMean)
      calibrationRef.current.timestamps.push(frame.timestamp)
      greenSamplesRef.current.push(frame.greenMean)

      const calibElapsed = (frame.timestamp - calibrationRef.current.startTime) / 1000
      setElapsed(Math.floor(calibElapsed))

      // 디버그 정보 업데이트 (~4Hz)
      if (frameCountRef.current % 8 === 0) {
        const now = performance.now()
        const fpsDt = (now - fpsTimerRef.current) / 1000
        const fps = fpsDt > 0 ? frameCountRef.current / fpsDt : 0

        const recentSamples = calibrationRef.current.samples.slice(-30)
        const mean = recentSamples.reduce((a, b) => a + b, 0) / recentSamples.length
        let acSum = 0
        for (const s of recentSamples) acSum += (s - mean) ** 2
        const acStd = Math.sqrt(acSum / Math.max(recentSamples.length - 1, 1))

        setDebugInfo({
          red: Math.round(frame.redMean * 10) / 10,
          green: Math.round(frame.greenMean * 10) / 10,
          ac: mean > 0 ? Math.round((acStd / mean) * 10000) / 100 : 0,
          fps: Math.round(fps),
        })
      }

      if (calibElapsed >= DEFAULT_PPG_CONFIG.calibrationDuration) {
        const calResult = runCalibration(calibrationRef.current, DEFAULT_PPG_CONFIG.sampleRate)
        setCalibrationMessage(calResult.message)

        if (calResult.isValid) {
          // 보정 성공 → 측정 시작
          // 기준값 설정 (분산 + 미분 기준)
          motionDetectorRef.current.setBaseline(
            calResult.noiseFloor * calResult.noiseFloor,
            calResult.noiseFloor,
          )

          // DSP 초기화
          signalBufferRef.current.clear()
          filteredBufferRef.current.clear()
          bandpassRef.current = new BandpassFilter4thOrder(0.7, 3.5, DEFAULT_PPG_CONFIG.sampleRate)
          baselineRef.current = new BaselineRemover(300)
          ancRef.current = new AdaptiveNoiseCanceller(12, 0.05)
          peakDetectorRef.current.reset()
          motionDetectorRef.current.reset()
          // 기준값 재설정 (reset이 초기화하므로)
          motionDetectorRef.current.setBaseline(
            calResult.noiseFloor * calResult.noiseFloor,
            calResult.noiseFloor,
          )
          rrIntervalsRef.current = []
          sampleIndexRef.current = 0

          phaseRef.current = 'measuring'
          setPhase('measuring')
          startTimeRef.current = performance.now()
          setElapsed(0)
        } else {
          // 재시도 (최대 5회)
          calibrationAttemptRef.current++
          if (calibrationAttemptRef.current >= 5) {
            phaseRef.current = 'error'
            setPhase('error')
            setErrorMessage('보정에 실패했습니다. 손가락 위치를 확인하고 다시 시도해 주세요.')
            cleanup()
            return
          }
          calibrationRef.current = {
            samples: [],
            timestamps: [],
            startTime: performance.now(),
          }
          greenSamplesRef.current = []
        }
      }

      rafRef.current = requestAnimationFrame(processFrame)
      return
    }

    // ── 측정 단계 ───

    // 1. 적응형 노이즈 캔슬러 (Green → Red 모션 제거)
    const denoised = ancRef.current.process(frame.redMean, frame.greenMean)

    // 2. 움직임 아티팩트 감지 (Red + Green 모두 활용)
    const isArtifact = motionDetectorRef.current.processSample(frame.redMean, frame.greenMean)

    // 3. 기저선 제거
    const detrended = baselineRef.current.process(denoised)

    // 4. 4차 Butterworth 밴드패스 필터 (0.7-3.5 Hz)
    const filtered = bandpassRef.current.process(detrended)

    // 5. 버퍼 저장
    filteredBufferRef.current.push(filtered)

    // 6. 피크 검출 (아티팩트 아닐 때만)
    if (!isArtifact) {
      const peak = peakDetectorRef.current.processSample(
        filtered,
        filteredBufferRef.current,
        sampleIndexRef.current,
        frame.timestamp,
      )

      if (peak?.isValid) {
        const peaks = peakDetectorRef.current.getAcceptedPeaks()
        if (peaks.length >= 2) {
          const prevPeak = peaks[peaks.length - 2]
          const rrMs = peak.timestamp - prevPeak.timestamp
          // 생리학적 범위: 333ms (180BPM) ~ 1500ms (40BPM)
          if (rrMs > 333 && rrMs < 1500) {
            rrIntervalsRef.current.push({
              interval: rrMs,
              timestamp: peak.timestamp,
              isValid: true,
            })
          }
        }
      }
    }

    sampleIndexRef.current++

    // UI 업데이트 (~4Hz, 매 8프레임)
    if (sampleIndexRef.current % 8 === 0) {
      const measureElapsed = (performance.now() - startTimeRef.current) / 1000
      setElapsed(Math.floor(measureElapsed))

      // BPM: 실시간 RR 아티팩트 필터 적용 후 중앙값 기반
      const recentRR = rrIntervalsRef.current.slice(-15)
      if (recentRR.length >= 3) {
        const cleaned = cleanRRIntervals(recentRR)
        const stats = getRRStats(cleaned)
        if (stats.medianHR > 0) {
          setCurrentBPM(stats.medianHR)
        }
      }

      // SQI
      const sqi = computeSQI(
        rrIntervalsRef.current.slice(-20),
        filteredBufferRef.current.getLastN(256),
        DEFAULT_PPG_CONFIG.sampleRate,
        peakDetectorRef.current.getRecentCorrelations(),
      )
      setSqiScore(sqi.score)

      // 아티팩트 비율
      setArtifactRatio(Math.round(motionDetectorRef.current.getArtifactRatio() * 100))

      // 디버그 정보
      const now = performance.now()
      const fpsDt = (now - fpsTimerRef.current) / 1000
      setDebugInfo({
        red: Math.round(frame.redMean * 10) / 10,
        green: Math.round(frame.greenMean * 10) / 10,
        ac: 0,
        fps: fpsDt > 0 ? Math.round(frameCountRef.current / fpsDt) : 0,
      })

      // 측정 완료 확인
      if (measureElapsed >= DEFAULT_PPG_CONFIG.measurementDuration) {
        finalizeMeasurement()
        return
      }
    }

    rafRef.current = requestAnimationFrame(processFrame)
  }, [cleanup])

  // ── 측정 종료 및 결과 계산 ─────────────────────────
  const finalizeMeasurement = useCallback(() => {
    phaseRef.current = 'processing'
    setPhase('processing')
    cleanup()

    const measureDuration = (performance.now() - startTimeRef.current) / 1000

    // ★ 핵심 개선: RR 아티팩트 정제 파이프라인 적용
    const rawRR = rrIntervalsRef.current
    const cleanedRR = cleanRRIntervals(rawRR)
    const validRR = cleanedRR.filter(r => r.isValid)

    if (validRR.length < 10) {
      setErrorMessage(`유효 비트 부족 (${validRR.length}개). 손가락을 카메라에 밀착하고 다시 시도해 주세요.`)
      setPhase('error')
      phaseRef.current = 'error'
      return
    }

    // 시간 영역 HRV (정제된 RR 사용)
    const timeDomain = computeTimeDomainHRV(cleanedRR)

    // 주파수 영역 HRV (120비트 이상일 때만)
    const frequencyDomain = computeFrequencyDomainHRV(cleanedRR)

    // 해석
    const interpretation = interpretHRV(timeDomain)

    // 신뢰도
    const cleanRatio = motionDetectorRef.current.getCleanRatio()
    const rrStats = getRRStats(cleanedRR)
    const effectiveCleanRatio = Math.min(cleanRatio, 1 - rrStats.rejectionRate)
    const confidence = computeConfidence(validRR.length, effectiveCleanRatio, measureDuration)

    const hrvResult: HRVResult = {
      timeDomain,
      frequencyDomain,
      measurementDuration: Math.round(measureDuration),
      cleanSignalRatio: Math.round(effectiveCleanRatio * 100) / 100,
      validBeatCount: validRR.length,
      confidenceScore: confidence.score,
      confidenceLabel: confidence.label,
      interpretation,
      rrIntervals: cleanedRR,
    }

    setResult(hrvResult)
    setPhase('results')
    phaseRef.current = 'results'

    onSessionComplete?.(Math.round(measureDuration), hrvResult)
  }, [cleanup, onSessionComplete])

  // ── 수동 중지 ──────────────────────────────────────
  const handleStop = useCallback(() => {
    if (phaseRef.current === 'measuring') {
      finalizeMeasurement()
    } else {
      cleanup()
      setPhase('idle')
      phaseRef.current = 'idle'
    }
  }, [finalizeMeasurement, cleanup])

  // ── 재시도 ─────────────────────────────────────────
  const handleRetry = useCallback(() => {
    cleanup()
    setPhase('idle')
    phaseRef.current = 'idle'
    setResult(null)
    setErrorMessage('')
    setCalibrationMessage('')
    setElapsed(0)
    setCurrentBPM(0)
    setSqiScore(0)
    setTorchWarning(false)
    setDebugInfo({ red: 0, green: 0, ac: 0, fps: 0 })
    setArtifactRatio(0)
  }, [cleanup])

  const showCamera = phase === 'permission' || phase === 'calibrating' || phase === 'measuring'

  // ── 렌더링 ─────────────────────────────────────────
  return (
    <div className="space-y-4">
      {(phase === 'idle' || phase === 'results' || phase === 'error') && (
        <Link
          href="/app/neural-reset"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          뉴럴리셋
        </Link>
      )}

      <div
        className="transition-all duration-300 overflow-hidden"
        style={{
          maxHeight: showCamera ? 200 : 0,
          opacity: showCamera ? 1 : 0,
        }}
      >
        <div className="relative flex justify-center">
          <video
            ref={videoRef}
            className="w-[200px] h-[150px] rounded-xl border-2 border-zinc-200 object-cover bg-zinc-900"
            playsInline
            muted
            autoPlay
          />
          {(phase === 'calibrating' || phase === 'measuring') && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[192px] bg-black/60 rounded-lg px-2 py-1 text-[10px] text-white font-mono tabular-nums flex justify-between">
              <span>R:{debugInfo.red}</span>
              <span>G:{debugInfo.green}</span>
              <span>AC:{debugInfo.ac}%</span>
              <span>{debugInfo.fps}fps</span>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} />

      {/* ─── idle: 안내 화면 ─── */}
      {phase === 'idle' && (
        <PPGInstructions onStart={handleStart} isCameraSupported={cameraSupported} />
      )}

      {/* ─── permission: 권한 요청 중 ─── */}
      {phase === 'permission' && (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-zinc-100 animate-pulse" />
          <p className="text-sm text-zinc-500">카메라 접근 권한을 요청하고 있습니다...</p>
        </div>
      )}

      {/* ─── calibrating: 보정 중 ─── */}
      {phase === 'calibrating' && (
        <div className="space-y-4 py-2">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">보정 중</h2>
              <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                {calibrationAttemptRef.current > 0 ? `${calibrationAttemptRef.current + 1}차 시도` : ''}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500">{calibrationMessage}</p>
            {torchWarning && (
              <p className="text-xs text-amber-600">
                플래시가 지원되지 않습니다. 밝은 조명 환경에서 측정해 주세요.
              </p>
            )}
          </div>

          <Progress
            value={(elapsed / DEFAULT_PPG_CONFIG.calibrationDuration) * 100}
            className="h-2"
          />

          <div className="text-center">
            <span className="text-3xl font-light text-zinc-900 tabular-nums">
              {elapsed}
            </span>
            <span className="text-sm text-zinc-400 ml-1">
              / {DEFAULT_PPG_CONFIG.calibrationDuration}초
            </span>
          </div>

          <PPGWaveform
            signalBuffer={signalBufferRef.current}
            isActive={true}
          />

          <p className="text-xs text-zinc-400 text-center">
            카메라 화면이 붉게 보이면 올바른 위치입니다
          </p>

          <Button variant="outline" onClick={handleStop} className="w-full">
            취소
          </Button>
        </div>
      )}

      {/* ─── measuring: 측정 중 ─── */}
      {phase === 'measuring' && (
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">베타</Badge>
              {torchWarning && (
                <span className="text-xs text-amber-500">플래시 미지원</span>
              )}
            </div>
            <SQIIndicator score={sqiScore} />
          </div>

          <Progress
            value={(elapsed / DEFAULT_PPG_CONFIG.measurementDuration) * 100}
            className="h-1.5"
          />
          <div className="flex justify-between text-xs text-zinc-400 tabular-nums">
            <span>{elapsed}초</span>
            <span>{DEFAULT_PPG_CONFIG.measurementDuration}초</span>
          </div>

          {/* BPM 대형 표시 */}
          <div className="text-center py-4">
            <div className="inline-flex items-baseline gap-2">
              <span className="text-5xl font-light text-zinc-900 tabular-nums">
                {currentBPM > 0 ? currentBPM : '--'}
              </span>
              <span className="text-sm text-zinc-400">BPM</span>
            </div>
          </div>

          {/* 필터된 파형 */}
          <PPGWaveform
            signalBuffer={filteredBufferRef.current}
            isActive={true}
          />

          {/* 상태 정보 */}
          <div className="flex justify-between text-xs text-zinc-400 tabular-nums">
            <span>유효 비트: {rrIntervalsRef.current.filter(r => r.isValid).length}</span>
            <span>
              SQI:{sqiScore}%
              {artifactRatio > 10 && (
                <span className="text-amber-500 ml-1">| 노이즈:{artifactRatio}%</span>
              )}
            </span>
          </div>

          {/* 움직임 경고 */}
          {artifactRatio > 30 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 text-center">
              움직임이 감지되고 있습니다. 손가락을 가만히 유지해 주세요.
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleStop}
            className="w-full"
          >
            {elapsed >= 30 ? '측정 완료' : '취소'}
          </Button>
        </div>
      )}

      {/* ─── processing: 결과 계산 중 ─── */}
      {phase === 'processing' && (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-zinc-100 animate-pulse" />
          <p className="text-sm text-zinc-500">결과를 분석하고 있습니다...</p>
        </div>
      )}

      {/* ─── results: 결과 표시 ─── */}
      {phase === 'results' && result && (
        <HRVResults result={result} onRetry={handleRetry} />
      )}

      {/* ─── error: 오류 ─── */}
      {phase === 'error' && (
        <div className="py-8 space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-900">측정 오류</p>
            <p className="text-sm text-zinc-500 leading-relaxed px-4">{errorMessage}</p>
          </div>
          <div className="flex gap-3 px-4">
            <Link href="/app/neural-reset" className="flex-1">
              <Button variant="outline" className="w-full">돌아가기</Button>
            </Link>
            <Button onClick={handleRetry} className="flex-1">다시 시도</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── SQI 인디케이터 ────────────────────────────────────

function SQIIndicator({ score }: { score: number }) {
  let color: string
  let label: string
  if (score >= 80) {
    color = 'bg-emerald-500'
    label = '양호'
  } else if (score >= 60) {
    color = 'bg-amber-500'
    label = '보통'
  } else {
    color = 'bg-red-500'
    label = '약함'
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-zinc-400">신호</span>
      <div className="flex gap-0.5">
        <div className={`w-2 h-3 rounded-sm ${score >= 30 ? color : 'bg-zinc-200'}`} />
        <div className={`w-2 h-3 rounded-sm ${score >= 60 ? color : 'bg-zinc-200'}`} />
        <div className={`w-2 h-3 rounded-sm ${score >= 80 ? color : 'bg-zinc-200'}`} />
      </div>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  )
}
