'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff } from 'lucide-react'

interface NotifPrefs {
  checkin_enabled: boolean
  checkin_time: string
  streak_reminder: boolean
  weekly_review: boolean
  survey_reminder: boolean
}

const DEFAULT_PREFS: NotifPrefs = {
  checkin_enabled: true,
  checkin_time: '09:00',
  streak_reminder: true,
  weekly_review: true,
  survey_reminder: true,
}

const TIME_OPTIONS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
]

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // 브라우저 알림 지원 확인
    const supported = 'Notification' in window && 'serviceWorker' in navigator
    setPushSupported(supported)
    if (supported) {
      setPushEnabled(Notification.permission === 'granted')
    }

    // 기존 설정 로드
    fetch('/api/neural-reset/notifications')
      .then((r) => r.json())
      .then((data) => setPrefs({ ...DEFAULT_PREFS, ...data }))
      .catch(() => {})
  }, [])

  const handleTogglePush = useCallback(async () => {
    if (!pushSupported) return

    if (pushEnabled) {
      // 구독 해제
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setPushEnabled(false)
    } else {
      // 알림 권한 요청 + 구독
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      const subJson = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      })
      setPushEnabled(true)
    }
  }, [pushEnabled, pushSupported])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/neural-reset/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // 실패 시 무시
    }
    setSaving(false)
  }

  const updatePref = <K extends keyof NotifPrefs>(key: K, value: NotifPrefs[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }))
    setSaved(false)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-medium text-zinc-700">알림 설정</h2>
        <p className="text-xs text-zinc-400 mt-0.5">뉴럴리셋 리마인더를 설정합니다</p>
      </div>

      {/* 푸시 알림 활성화 */}
      <div className="rounded-xl border border-zinc-100 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {pushEnabled ? (
              <Bell className="h-4 w-4 text-zinc-700" />
            ) : (
              <BellOff className="h-4 w-4 text-zinc-400" />
            )}
            <span className="text-sm text-zinc-700">푸시 알림</span>
          </div>
          <button
            onClick={handleTogglePush}
            disabled={!pushSupported}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              pushEnabled ? 'bg-zinc-900' : 'bg-zinc-200'
            } ${!pushSupported ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                pushEnabled ? 'translate-x-5.5 left-0' : 'left-0.5'
              }`}
              style={{ transform: pushEnabled ? 'translateX(22px)' : 'translateX(0)' }}
            />
          </button>
        </div>
        {!pushSupported && (
          <p className="text-xs text-zinc-400">이 브라우저는 푸시 알림을 지원하지 않습니다</p>
        )}
      </div>

      {/* 알림 항목 */}
      <div className="rounded-xl border border-zinc-100 bg-white divide-y divide-zinc-50">
        {/* 체크인 리마인더 */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-700">아침 체크인 리마인더</p>
              <p className="text-xs text-zinc-400">매일 설정한 시간에 알림</p>
            </div>
            <button
              onClick={() => updatePref('checkin_enabled', !prefs.checkin_enabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                prefs.checkin_enabled ? 'bg-zinc-900' : 'bg-zinc-200'
              }`}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: prefs.checkin_enabled ? 'translateX(22px)' : 'translateX(2px)' }}
              />
            </button>
          </div>
          {prefs.checkin_enabled && (
            <div className="flex gap-1.5 flex-wrap">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => updatePref('checkin_time', t)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    prefs.checkin_time === t
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  }`}
                >
                  {t.replace(':00', '시')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 스트릭 리마인더 */}
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-700">스트릭 위기 알림</p>
            <p className="text-xs text-zinc-400">오후 8시, 당일 미활동 시</p>
          </div>
          <button
            onClick={() => updatePref('streak_reminder', !prefs.streak_reminder)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              prefs.streak_reminder ? 'bg-zinc-900' : 'bg-zinc-200'
            }`}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              style={{ transform: prefs.streak_reminder ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </button>
        </div>

        {/* 주간 회고 */}
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-700">주간 회고 알림</p>
            <p className="text-xs text-zinc-400">일요일 오전 10시</p>
          </div>
          <button
            onClick={() => updatePref('weekly_review', !prefs.weekly_review)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              prefs.weekly_review ? 'bg-zinc-900' : 'bg-zinc-200'
            }`}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              style={{ transform: prefs.weekly_review ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </button>
        </div>

        {/* 설문 리마인더 */}
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-700">설문 리마인더</p>
            <p className="text-xs text-zinc-400">마지막 설문 2주 경과 시</p>
          </div>
          <button
            onClick={() => updatePref('survey_reminder', !prefs.survey_reminder)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              prefs.survey_reminder ? 'bg-zinc-900' : 'bg-zinc-200'
            }`}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              style={{ transform: prefs.survey_reminder ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </button>
        </div>
      </div>

      {/* 저장 */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium disabled:opacity-50 hover:bg-zinc-800 transition-colors"
      >
        {saved ? '저장 완료' : saving ? '저장 중...' : '설정 저장'}
      </button>
    </div>
  )
}
