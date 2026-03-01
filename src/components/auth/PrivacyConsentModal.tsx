'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PrivacyConsentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PrivacyConsentModal({ open, onOpenChange }: PrivacyConsentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>개인정보 처리방침</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 text-sm text-zinc-600 space-y-4 pr-2">
          <section>
            <h3 className="font-medium text-zinc-800 mb-2">1. 수집하는 개인정보 항목</h3>
            <p>오상케어는 서비스 제공을 위해 다음과 같이 개인정보를 수집합니다.</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-zinc-500">
              <li>가입 시 필수 수집: 이메일, 성별, 생년월일, 주요 호소 증상</li>
              <li>가입 후 선택 수집: 직업/생활 패턴, 현재 받고 있는 치료 유형</li>
              <li>서비스 이용 과정에서 생성: 설문 응답, 감사일기 내용</li>
            </ul>
          </section>

          <section>
            <h3 className="font-medium text-zinc-800 mb-2">2. 개인정보 수집 및 이용 목적</h3>
            <ul className="mt-2 space-y-1 list-disc list-inside text-zinc-500">
              <li>증상 관리 서비스 제공 (추적 설문, 증상 추이 차트)</li>
              <li>개인화된 건강 관리 정보 안내</li>
              <li>익명 집계 임상 연구 (개인 식별 불가한 통계 데이터만 활용)</li>
            </ul>
          </section>

          <section>
            <h3 className="font-medium text-zinc-800 mb-2">3. 개인정보 보유 및 이용 기간</h3>
            <p>
              회원 탈퇴 시 즉시 삭제합니다. 단, 관계 법령에 따라 보존이 필요한 경우
              해당 법령에서 정한 기간 동안 보관합니다.
            </p>
          </section>

          <section>
            <h3 className="font-medium text-zinc-800 mb-2">4. 개인정보 제3자 제공</h3>
            <p>
              수집한 개인정보는 제3자에게 제공하지 않습니다.
              단, 법령에 따른 요청이 있는 경우 예외로 합니다.
            </p>
          </section>

          <section>
            <h3 className="font-medium text-zinc-800 mb-2">5. 정보주체의 권리</h3>
            <p>
              언제든지 본인의 개인정보를 조회, 수정, 삭제할 수 있습니다.
              탈퇴 요청은 앱 내 계정 설정에서 하실 수 있습니다.
            </p>
          </section>

          <section>
            <h3 className="font-medium text-zinc-800 mb-2">6. 단계적 정보 수집 안내</h3>
            <p>
              가입 후 서비스 이용 과정에서 직업, 현재 치료 유형 등을 추가로 수집할 수
              있습니다. 이는 임상 연구 품질 향상을 위한 것으로, 응답은 선택 사항이며
              거부하셔도 기본 서비스 이용에 지장이 없습니다.
            </p>
          </section>

          <section>
            <h3 className="font-medium text-zinc-800 mb-2">7. 개인정보 보호책임자</h3>
            <p>오상신경외과 | 문의: 병원 대표 번호</p>
          </section>

          <p className="text-xs text-zinc-400 pt-2">시행일: 2026년 3월 1일 | 버전: 1.0</p>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
