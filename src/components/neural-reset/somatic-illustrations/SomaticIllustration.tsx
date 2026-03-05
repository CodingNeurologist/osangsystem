'use client'

import { BodyTappingIllustration } from './BodyTapping'
import { TreeShakingIllustration } from './TreeShaking'
import { PMRIllustration } from './PMR'
import { ButterflyHugIllustration } from './ButterflyHug'
import { VagusMassageIllustration } from './VagusMassage'
import { EyeResetIllustration } from './EyeReset'

interface SomaticIllustrationProps {
  exerciseId: string
  stepIndex: number
}

export default function SomaticIllustration({ exerciseId, stepIndex }: SomaticIllustrationProps) {
  const illustrationMap: Record<string, React.ComponentType<{ step: number }>> = {
    'body-tapping': BodyTappingIllustration,
    'tree-shaking': TreeShakingIllustration,
    'pmr': PMRIllustration,
    'butterfly-hug': ButterflyHugIllustration,
    'vagus-massage': VagusMassageIllustration,
    'eye-reset': EyeResetIllustration,
  }

  const IllustrationComponent = illustrationMap[exerciseId]
  if (!IllustrationComponent) return null

  return (
    <div className="w-full flex justify-center">
      <div className="w-48 h-48 sm:w-56 sm:h-56">
        <IllustrationComponent step={stepIndex} />
      </div>
    </div>
  )
}
