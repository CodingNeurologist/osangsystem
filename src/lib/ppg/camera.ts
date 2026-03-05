import type { PPGFrameData } from './types'

// ============================================================
// 카메라 접근 및 프레임 캡처
// ============================================================

export interface CameraController {
  stream: MediaStream
  video: HTMLVideoElement
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  captureFrame: () => PPGFrameData | null
  enableTorch: () => Promise<boolean>
  disableTorch: () => void
  stop: () => void
  isTorchSupported: boolean
}

/**
 * 후면 카메라 초기화.
 * 320×240 해상도로 캡처하여 배터리/발열 최소화.
 */
export async function initCamera(
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
): Promise<CameraController> {
  const maybeCtx = canvasElement.getContext('2d', { willReadFrequently: true })
  if (!maybeCtx) throw new Error('Canvas 2D 컨텍스트를 생성할 수 없습니다.')
  const ctx = maybeCtx

  const constraints: MediaStreamConstraints = {
    video: {
      facingMode: 'environment',
      width: { ideal: 320 },
      height: { ideal: 240 },
    },
    audio: false,
  }

  const stream = await navigator.mediaDevices.getUserMedia(constraints)

  videoElement.srcObject = stream
  videoElement.setAttribute('playsinline', 'true')
  await videoElement.play()

  // 실제 비디오 크기로 캔버스 설정
  const vw = videoElement.videoWidth || 320
  const vh = videoElement.videoHeight || 240
  canvasElement.width = vw
  canvasElement.height = vh

  // 토치 지원 확인
  const track = stream.getVideoTracks()[0]
  let isTorchSupported = false

  if (track) {
    try {
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }
      isTorchSupported = capabilities.torch === true
    } catch {
      // getCapabilities 미지원 브라우저
    }
  }

  // 중앙 50% 영역 계산 (엣지 노이즈 감소)
  const x0 = Math.floor(vw * 0.25)
  const x1 = Math.floor(vw * 0.75)
  const y0 = Math.floor(vh * 0.25)
  const y1 = Math.floor(vh * 0.75)
  const sampleWidth = x1 - x0
  const sampleHeight = y1 - y0

  function captureFrame(): PPGFrameData | null {
    try {
      ctx.drawImage(videoElement, 0, 0, vw, vh)
      const imageData = ctx.getImageData(x0, y0, sampleWidth, sampleHeight)
      const data = imageData.data

      let redSum = 0
      let greenSum = 0
      const pixelCount = sampleWidth * sampleHeight

      for (let i = 0; i < data.length; i += 4) {
        redSum += data[i]       // R
        greenSum += data[i + 1] // G
      }

      return {
        redMean: redSum / pixelCount,
        greenMean: greenSum / pixelCount,
        timestamp: performance.now(),
      }
    } catch {
      return null
    }
  }

  async function enableTorch(): Promise<boolean> {
    if (!isTorchSupported || !track) return false
    try {
      await track.applyConstraints({
        advanced: [{ torch: true } as MediaTrackConstraintSet & { torch: boolean }],
      })
      return true
    } catch {
      return false
    }
  }

  function disableTorch(): void {
    if (!track) return
    try {
      track.applyConstraints({
        advanced: [{ torch: false } as MediaTrackConstraintSet & { torch: boolean }],
      })
    } catch {
      // 무시
    }
  }

  function stop(): void {
    disableTorch()
    for (const t of stream.getTracks()) {
      t.stop()
    }
    videoElement.srcObject = null
  }

  return {
    stream,
    video: videoElement,
    canvas: canvasElement,
    ctx,
    captureFrame,
    enableTorch,
    disableTorch,
    stop,
    isTorchSupported,
  }
}

/**
 * 카메라 권한 상태 확인.
 */
export async function checkCameraPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    if (!navigator.permissions) return 'prompt'
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
    return result.state
  } catch {
    return 'prompt'
  }
}

/**
 * 브라우저가 카메라 API를 지원하는지 확인.
 */
export function isCameraSupported(): boolean {
  return !!(
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  )
}
