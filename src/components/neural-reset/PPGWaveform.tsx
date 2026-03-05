'use client'

import { useEffect, useRef } from 'react'
import { CircularBuffer } from '@/lib/ppg/circular-buffer'

interface PPGWaveformProps {
  signalBuffer: CircularBuffer
  isActive: boolean
  className?: string
}

const DISPLAY_SAMPLES = 150 // ~5초 at 30fps
const LINE_COLOR = '#22c55e' // green-500
const GRID_COLOR = 'rgba(63, 63, 70, 0.15)' // zinc-700/15
const BG_COLOR = '#18181b' // zinc-900

/**
 * Canvas 기반 실시간 PPG 파형 표시.
 * React 렌더링과 독립적인 RAF 루프에서 동작한다.
 */
export default function PPGWaveform({ signalBuffer, isActive, className }: PPGWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!isActive) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // High-DPI 지원
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height

    const draw = () => {
      // 배경
      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, width, height)

      const samples = signalBuffer.getLastN(DISPLAY_SAMPLES)

      if (samples.length < 2) {
        // 데이터 없을 때 안내
        ctx.fillStyle = '#52525b'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('신호 대기 중...', width / 2, height / 2)
        rafRef.current = requestAnimationFrame(draw)
        return
      }

      // 그리드
      ctx.strokeStyle = GRID_COLOR
      ctx.lineWidth = 0.5
      for (let i = 1; i < 4; i++) {
        const y = (height / 4) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
      for (let i = 1; i < 6; i++) {
        const x = (width / 6) * i
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }

      // Auto-scale
      let min = Infinity
      let max = -Infinity
      for (let i = 0; i < samples.length; i++) {
        if (samples[i] < min) min = samples[i]
        if (samples[i] > max) max = samples[i]
      }
      const range = max - min || 1
      const padding = height * 0.1

      // 파형
      ctx.strokeStyle = LINE_COLOR
      ctx.lineWidth = 1.5
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()

      for (let i = 0; i < samples.length; i++) {
        const x = (i / (DISPLAY_SAMPLES - 1)) * width
        const normalized = (samples[i] - min) / range
        const y = height - padding - normalized * (height - 2 * padding)

        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // 글로우 효과
      ctx.shadowColor = LINE_COLOR
      ctx.shadowBlur = 4
      ctx.stroke()
      ctx.shadowBlur = 0

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [isActive, signalBuffer])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full rounded-xl ${className ?? ''}`}
      style={{ height: 120, imageRendering: 'auto' }}
    />
  )
}
