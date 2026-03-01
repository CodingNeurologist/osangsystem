'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
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

const signupSchema = z
  .object({
    email: z.string().email('올바른 이메일 주소를 입력해 주세요.'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .max(64, '비밀번호는 64자 이하여야 합니다.')
      .regex(/[A-Za-z]/, '영문자를 포함해야 합니다.')
      .regex(/[0-9]/, '숫자를 포함해야 합니다.')
      .regex(/[^A-Za-z0-9]/, '특수문자(!@#$% 등)를 포함해야 합니다.'),
    password_confirm: z.string().min(1, '비밀번호를 다시 입력해 주세요.'),
    gender: z.enum(['male', 'female'], {
      required_error: '성별을 선택해 주세요.',
    }),
    birth_date: z
      .string()
      .min(1, '생년월일을 입력해 주세요.')
      .refine((val) => {
        const date = new Date(val)
        const now = new Date()
        const minDate = new Date('1900-01-01')
        return date >= minDate && date <= now
      }, '올바른 생년월일을 입력해 주세요.'),
    primary_symptoms: z
      .array(z.string())
      .min(1, '주요 증상을 하나 이상 선택해 주세요.'),
    privacy_consent: z.literal(true, {
      errorMap: () => ({ message: '개인정보 처리방침에 동의해야 합니다.' }),
    }),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['password_confirm'],
  })

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      primary_symptoms: [],
    },
  })

  const selectedSymptoms = watch('primary_symptoms')
  const passwordValue = watch('password') ?? ''

  function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
    if (!pw) return { level: 0, label: '', color: '' }
    let score = 0
    if (pw.length >= 8) score++
    if (pw.length >= 12) score++
    if (/[A-Za-z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    if (score <= 2) return { level: 1, label: '약함', color: 'bg-red-400' }
    if (score <= 3) return { level: 2, label: '보통', color: 'bg-yellow-400' }
    return { level: 3, label: '강함', color: 'bg-green-500' }
  }

  const pwStrength = getPasswordStrength(passwordValue)

  function toggleSymptom(value: string) {
    const current = selectedSymptoms ?? []
    if (current.includes(value)) {
      setValue('primary_symptoms', current.filter((s) => s !== value), { shouldValidate: true })
    } else {
      setValue('primary_symptoms', [...current, value], { shouldValidate: true })
    }
  }

  async function onSubmit(data: SignupFormData) {
    setIsLoading(true)
    setServerError(null)

    const supabase = createClient()

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          gender: data.gender,
          birth_date: data.birth_date,
          primary_symptoms: data.primary_symptoms,
          privacy_consent_version: '1.0',
        },
      },
    })

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setServerError('이미 가입된 이메일입니다. 로그인해 주세요.')
      } else {
        setServerError('가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      }
      setIsLoading(false)
      return
    }

    const user = signUpData.user
    if (user && signUpData.session) {
      await supabase.from('profiles').update({
        gender: data.gender,
        birth_date: data.birth_date,
        primary_symptoms: data.primary_symptoms,
        privacy_consent_at: new Date().toISOString(),
        privacy_consent_version: '1.0',
      }).eq('id', user.id)

      router.push('/app')
      router.refresh()
      return
    }

    setServerError('가입을 완료하려면 이메일을 확인해 주세요. 받은편지함에서 인증 링크를 클릭하세요.')
    setIsLoading(false)
  }

  async function signInWithKakao() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?onboarding=true`,
      },
    })
  }

  async function signInWithGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?onboarding=true`,
      },
    })
  }

  return (
    <div className="space-y-5">
      {/* 소셜 가입 */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={signInWithKakao}
          className="w-full bg-[#FEE500] text-[#191919] border-[#FEE500] hover:bg-[#F0DB00] hover:border-[#F0DB00] hover:text-[#191919]"
        >
          카카오로 가입하기
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={signInWithGoogle}
          className="w-full"
        >
          Google로 가입하기
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">또는 이메일로 가입</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* 이메일 */}
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            {...register('email')}
            id="email"
            type="email"
            autoComplete="email"
            placeholder="example@email.com"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        {/* 비밀번호 */}
        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <div className="relative">
            <Input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="비밀번호 입력"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          <ul className="text-xs text-muted-foreground space-y-0.5 pl-1">
            <li className={passwordValue.length >= 8 ? 'text-green-600' : ''}>
              · 8자 이상 (권장 12자 이상)
            </li>
            <li className={/[A-Za-z]/.test(passwordValue) ? 'text-green-600' : ''}>
              · 영문자 포함
            </li>
            <li className={/[0-9]/.test(passwordValue) ? 'text-green-600' : ''}>
              · 숫자 포함
            </li>
            <li className={/[^A-Za-z0-9]/.test(passwordValue) ? 'text-green-600' : ''}>
              · 특수문자 포함 (!@#$%^&* 등)
            </li>
          </ul>

          {passwordValue.length > 0 && (
            <div>
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      pwStrength.level >= i ? pwStrength.color : 'bg-zinc-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs mt-0.5 text-muted-foreground">
                보안 강도: <span className={pwStrength.level === 3 ? 'text-green-600' : pwStrength.level === 2 ? 'text-yellow-600' : 'text-red-500'}>{pwStrength.label}</span>
              </p>
            </div>
          )}

          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {/* 비밀번호 확인 */}
        <div className="space-y-2">
          <Label htmlFor="password_confirm">비밀번호 확인</Label>
          <div className="relative">
            <Input
              {...register('password_confirm')}
              id="password_confirm"
              type={showPasswordConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="비밀번호 재입력"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPasswordConfirm((v) => !v)}
              className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
            >
              {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password_confirm && (
            <p className="text-xs text-destructive">{errors.password_confirm.message}</p>
          )}
        </div>

        {/* 성별 */}
        <div className="space-y-2">
          <Label>성별</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'male', label: '남성' },
              { value: 'female', label: '여성' },
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

        {/* 주요 호소 증상 */}
        <div className="space-y-2">
          <Label>주요 증상 (복수 선택 가능)</Label>
          <p className="text-xs text-muted-foreground">현재 가장 불편하신 증상을 선택해 주세요.</p>
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
          <p className="text-xs text-zinc-500">
            서비스 이용을 위해 이메일, 성별, 생년월일, 주요 증상을 수집합니다.
            수집된 정보는 증상 관리 서비스 제공 및 익명 임상 연구 목적으로만 사용됩니다.
          </p>
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="text-xs text-primary underline"
          >
            개인정보 처리방침 전문 보기
          </button>
          <Controller
            name="privacy_consent"
            control={control}
            render={({ field }) => (
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked ? true : undefined)}
                  className="mt-0.5"
                />
                <span className="text-sm text-zinc-700">
                  개인정보 수집 및 이용에 동의합니다. (필수)
                </span>
              </label>
            )}
          />
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
          {isLoading ? '가입 중...' : '가입하기'}
        </Button>
      </form>

      <PrivacyConsentModal open={showPrivacyModal} onOpenChange={setShowPrivacyModal} />
    </div>
  )
}
