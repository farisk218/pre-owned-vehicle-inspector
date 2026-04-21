'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InspectionStep } from '@/lib/inspection-schema'

interface StepNavigationProps {
  currentStepIndex: number
  totalSteps: number
  currentStep: InspectionStep
  canProceed: boolean
  onPrevious: () => void
  onNext: () => void
}

export function StepNavigation({
  currentStepIndex,
  totalSteps,
  currentStep,
  canProceed,
  onPrevious,
  onNext,
}: StepNavigationProps) {
  const isFirstStep = currentStepIndex === 0
  const isLastInspectionStep = currentStepIndex === totalSteps - 2 // Before final report
  const isFinalReport = currentStep.id === 'final'

  if (isFinalReport) return null

  return (
    <div className="sticky bottom-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border p-4">
      <div className="flex gap-3 max-w-lg mx-auto">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 h-14 text-base"
          onClick={onPrevious}
          disabled={isFirstStep}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Previous
        </Button>
        
        <Button
          size="lg"
          className="flex-1 h-14 text-base bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onNext}
          disabled={!canProceed}
        >
          {isLastInspectionStep ? 'View Report' : 'Next'}
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  )
}
