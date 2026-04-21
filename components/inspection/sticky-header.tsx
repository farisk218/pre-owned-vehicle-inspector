'use client'

import { ArrowLeft, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InspectionStep } from '@/lib/inspection-schema'
import { cn } from '@/lib/utils'

interface StickyHeaderProps {
  currentStep: InspectionStep
  currentStepIndex: number
  totalSteps: number
  score: number
  statusLabel: string
  hasCriticalFail: boolean
  onBack: () => void
  onExit: () => void
}

export function StickyHeader({
  currentStep,
  currentStepIndex,
  totalSteps,
  score,
  statusLabel,
  hasCriticalFail,
  onBack,
  onExit,
}: StickyHeaderProps) {
  const progress = ((currentStepIndex + 1) / totalSteps) * 100

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="sr-only">Go back</span>
        </Button>

        {/* Step Info */}
        <div className="flex-1 text-center px-2">
          <p className="text-sm text-muted-foreground">
            Step {currentStepIndex + 1} of {totalSteps}
          </p>
          <h2 className="text-lg font-semibold text-foreground truncate">
            {currentStep.icon} {currentStep.label}
          </h2>
          <p className="text-xs text-muted-foreground truncate">{currentStep.helperText}</p>
        </div>

        {/* Live Score */}
        <div className="flex items-center gap-2">
          <div className={cn(
            'px-3 py-1.5 rounded-full font-bold text-sm',
            hasCriticalFail ? 'bg-fail/20 text-fail' :
              score >= 80 ? 'bg-pass/20 text-pass' :
              score >= 50 ? 'bg-warning/20 text-warning' :
              'bg-fail/20 text-fail'
          )}>
            {score}%
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={onExit}
          >
            <MoreVertical className="w-5 h-5" />
            <span className="sr-only">More options</span>
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-secondary">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {hasCriticalFail && (
        <div className="px-4 py-1 bg-fail/15 text-fail text-xs font-semibold text-center max-w-lg mx-auto">
          {statusLabel}
        </div>
      )}
    </header>
  )
}
