'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import PrivacyConsentModal from './PrivacyConsentModal'

const PRIMARY_SYMPTOMS = [
  { value: 'headache', label: '두통' },
  { value: 'insomnia', label: '불면' },
  { value: 'dizziness', label: '어지럼증' },
  { value: 'digestive', label: '소화 장애' },
  { value: 'fatigue', label: '만성 피로' },
  { value: 'anxiety', label: '불안/긴장' },
  { value: 'depression', label: '우울감' },
  { value: 'palpitation', label: '두근거림' },
  { value: 'pain', label: '통증' },
  { value: 'other', label: '기타' },
]

const onboardingSchema = z.object({
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    required_error: '성별을 선택해 주세요.',
  }),
  birth_date: z
    .string()
    .min(1, '생년월일을 입력해 주세요.'),
  primary_symptoms: z
    .array(z.string())
    .min(1, '주요 증상을 하나 이상 선택해 주세요.'),
  privacy_consent: z.literal(true, {
    errorMap: () => ({ message: '개인정보 처리방침에 동의해야 합니다.' }),
  }),
})

type OnboardingFormData = z.infer<typeof onboardingSchema>

export default function OnboardingForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { primary_symptoms: [] },
  })

  const selectedSymptoms = watch('primary_symptoms')

  function toggleSymptom(value: string) {
    const current = selectedSymptoms ?? []
    if (current.includes(value)) {
      setValue('primary_symptoms', current.filter((s) => s !== value), { shouldValidate: true })
    } else {
      setValue('primary_symptoms', [...current, value], { shouldValidate: true })
    }
  }

  async function onSubmit(data: OnboardingFormData) {
    setIsLoading(true)
    setServerError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setServerError('로그인이 필요합니다.')
      setIsLoading(false)
      return
    }

    const { error } = await supabase.from('profiles').update({
      gender: data.gender,
      birth_date: data.birth_date,
      primary_symptoms: data.primary_symptoms,
      privacy_consent_at: new Date().toISOString(),
      privacy_consent_version: '1.0',
    }).eq('id', user.id)

    if (error) {
      setServerError('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      setIsLoading(false)
      return
    }

    router.push('/app')
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* 성별 */}
          <div className="space-y-2">
            <Label>성별</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'male', label: '남성' },
                { value: 'female', label: '여성' },
                { value: 'other', label: '기타' },
                { value: 'prefer_not_to_say', label: '응답 안 함' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center justify-center px-3 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                    watch('gender') === option.value
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <input
                    {...register('gender')}
                    type="radio"
                    value={option.value}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
          </div>

          {/* 생년월일 */}
          <div className="space-y-2">
            <Label htmlFor="birth_date">생년월일</Label>
            <Input
              {...register('birth_date')}
              id="birth_date"
              type="date"
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.birth_date && <p className="text-xs text-destructive">{errors.birth_date.message}</p>}
          </div>

          {/* 주요 증상 */}
          <div className="space-y-2">
            <Label>주요 증상 (복수 선택 가능)</Label>
            <div className="flex flex-wrap gap-2">
              {PRIMARY_SYMPTOMS.map((symptom) => (
                <button
                  key={symptom.value}
                  type="button"
                  onClick={() => toggleSymptom(symptom.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedSymptoms?.includes(symptom.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {symptom.label}
                </button>
              ))}
            </div>
            {errors.primary_symptoms && (
              <p className="text-xs text-destructive">{errors.primary_symptoms.message}</p>
            )}
          </div>

          {/* 개인정보 동의 */}
          <div className="bg-zinc-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-zinc-800">개인정보 수집 및 이용 동의</p>
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="text-xs text-primary underline"
            >
              개인정보 처리방침 전문 보기
            </button>
            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox
                {...register('privacy_consent')}
                onCheckedChange={(checked) =>
                  setValue('privacy_consent', checked === true ? true : undefined as never, { shouldValidate: true })
                }
                className="mt-0.5"
              />
              <span className="text-sm text-zinc-700">
                개인정보 수집 및 이용에 동의합니다. (필수)
              </span>
            </label>
            {errors.privacy_consent && (
              <p className="text-xs text-destructive">{errors.privacy_consent.message}</p>
            )}
          </div>

          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? '저장 중...' : '완료'}
          </Button>
        </form>
      </CardContent>

      <PrivacyConsentModal open={showPrivacyModal} onOpenChange={setShowPrivacyModal} />
    </Card>
  )
}
