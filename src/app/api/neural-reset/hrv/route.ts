import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { HRVMeasurement } from '@/types'

/** POST — HRV 측정 결과 저장 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // 필수 필드 검증
    if (typeof body.mean_hr !== 'number' || typeof body.rmssd !== 'number') {
      return NextResponse.json({ error: '유효하지 않은 측정 데이터입니다.' }, { status: 400 })
    }

    // 이전 측정 대비 급격한 변화 감지 (이상치 플래그)
    const { data: recent } = await supabase
      .from('hrv_measurements')
      .select('rmssd, sdnn, mean_hr')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    let isAnomaly = false
    let anomalyReason: string | null = null

    if (recent && recent.length >= 2) {
      const avgRmssd = recent.reduce((s, r) => s + r.rmssd, 0) / recent.length
      const avgSdnn = recent.reduce((s, r) => s + r.sdnn, 0) / recent.length
      const avgHr = recent.reduce((s, r) => s + r.mean_hr, 0) / recent.length

      const reasons: string[] = []

      // RMSSD 50% 이상 변화
      if (avgRmssd > 0 && Math.abs(body.rmssd - avgRmssd) / avgRmssd > 0.5) {
        reasons.push(`RMSSD 급변 (평균 ${avgRmssd.toFixed(1)} → ${body.rmssd.toFixed(1)})`)
      }
      // SDNN 50% 이상 변화
      if (avgSdnn > 0 && Math.abs(body.sdnn - avgSdnn) / avgSdnn > 0.5) {
        reasons.push(`SDNN 급변 (평균 ${avgSdnn.toFixed(1)} → ${body.sdnn.toFixed(1)})`)
      }
      // HR 20% 이상 변화
      if (avgHr > 0 && Math.abs(body.mean_hr - avgHr) / avgHr > 0.2) {
        reasons.push(`심박수 급변 (평균 ${avgHr.toFixed(0)} → ${body.mean_hr.toFixed(0)})`)
      }

      if (reasons.length > 0) {
        isAnomaly = true
        anomalyReason = reasons.join('; ')
      }
    }

    // RR 인터벌 데이터 — 저장은 하되 interval과 isValid만 (경량화)
    let rrIntervalsJson = null
    if (Array.isArray(body.rr_intervals)) {
      rrIntervalsJson = body.rr_intervals.map((rr: { interval: number; isValid: boolean }) => ({
        i: Math.round(rr.interval),
        v: rr.isValid ? 1 : 0,
      }))
    }

    const insertData = {
      user_id: user.id,
      mean_hr: body.mean_hr,
      sdnn: body.sdnn,
      rmssd: body.rmssd,
      pnn50: body.pnn50 ?? 0,
      min_hr: body.min_hr ?? 0,
      max_hr: body.max_hr ?? 0,
      nn_count: body.nn_count ?? 0,
      lf_power: body.lf_power ?? null,
      hf_power: body.hf_power ?? null,
      lf_hf_ratio: body.lf_hf_ratio ?? null,
      ectopic_count: body.ectopic_count ?? 0,
      ectopic_ratio: body.ectopic_ratio ?? 0,
      arrhythmia_burden: body.arrhythmia_burden ?? 'normal',
      confidence_score: body.confidence_score ?? 0,
      confidence_label: body.confidence_label ?? '낮음',
      valid_beat_count: body.valid_beat_count ?? 0,
      clean_signal_ratio: body.clean_signal_ratio ?? 0,
      measurement_duration: body.measurement_duration ?? 0,
      interpretation_level: body.interpretation_level ?? 'normal',
      interpretation_title: body.interpretation_title ?? '',
      rr_intervals_json: rrIntervalsJson,
      is_anomaly: isAnomaly,
      anomaly_reason: anomalyReason,
    }

    const { data, error } = await supabase
      .from('hrv_measurements')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('HRV measurement insert error:', error)
      return NextResponse.json({ error: '저장 실패' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      measurement: data,
      isAnomaly,
      anomalyReason,
    })
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

/** GET — HRV 측정 이력 조회 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit')) || 30, 100)
  const anomalyOnly = searchParams.get('anomaly') === 'true'

  try {
    let query = supabase
      .from('hrv_measurements')
      .select('id, mean_hr, sdnn, rmssd, pnn50, min_hr, max_hr, nn_count, ectopic_count, ectopic_ratio, arrhythmia_burden, confidence_score, confidence_label, valid_beat_count, measurement_duration, interpretation_level, interpretation_title, user_note, is_anomaly, anomaly_reason, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (anomalyOnly) {
      query = query.eq('is_anomaly', true)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: '조회 실패' }, { status: 500 })
    }

    return NextResponse.json({ measurements: data ?? [] })
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
