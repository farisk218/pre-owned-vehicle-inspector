'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { StickyHeader } from './sticky-header'
import { InspectionCard } from './inspection-card'
import { StepNavigation } from './step-navigation'
import { FinalReport } from './final-report'
import { ModeToggle } from './mode-toggle'
import {
  InspectionAnswers,
  InspectionAnswer,
  InspectionMode,
  InspectionSchema,
  getQuestions,
  getStepsByMode,
  isQuestionAnswered,
} from '@/lib/inspection-schema'
import { calculateScore, getScoreStatus } from '@/lib/scoring'

interface InspectionFlowProps {
  initialMode: InspectionMode
  schema: InspectionSchema
  onExit: () => void
}

export function InspectionFlow({ initialMode, schema, onExit }: InspectionFlowProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<InspectionMode>(initialMode)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [answers, setAnswers] = useState<InspectionAnswers>({})

  const steps = useMemo(() => getStepsByMode(schema, mode), [schema, mode])
  const currentStep = steps[currentStepIndex]
  const { score, hasCriticalFail } = useMemo(() => calculateScore(steps, answers), [steps, answers])
  const { label } = getScoreStatus(score, hasCriticalFail)
  const isFinalReport = currentStep?.id === 'final'

  useEffect(() => {
    const saved = localStorage.getItem('inspection-state-v1')
    if (!saved) return

    try {
      const parsed = JSON.parse(saved) as {
        mode?: InspectionMode
        currentStepIndex?: number
        answers?: InspectionAnswers
      }
      if (parsed.mode) setMode(parsed.mode)
      if (typeof parsed.currentStepIndex === 'number') setCurrentStepIndex(parsed.currentStepIndex)
      if (parsed.answers) setAnswers(parsed.answers)
    } catch {
      localStorage.removeItem('inspection-state-v1')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      'inspection-state-v1',
      JSON.stringify({ mode, currentStepIndex, answers })
    )
  }, [mode, currentStepIndex, answers])

  useEffect(() => {
    if (currentStepIndex > steps.length - 1) {
      setCurrentStepIndex(Math.max(0, steps.length - 1))
    }
  }, [currentStepIndex, steps.length])

  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'auto' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      contentRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    })
  }, [currentStepIndex])

  const handleModeChange = useCallback((newMode: InspectionMode) => {
    setMode(newMode)
    setCurrentStepIndex(0)
  }, [])

  const handleItemUpdate = useCallback((itemId: string, patch: Partial<InspectionAnswer>) => {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...patch },
    }))
  }, [])

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }, [currentStepIndex])

  const handleNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    }
  }, [currentStepIndex, steps.length])

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    } else {
      onExit()
    }
  }, [currentStepIndex, onExit])

  const handleRestart = useCallback(() => {
    setAnswers({})
    setCurrentStepIndex(0)
    localStorage.removeItem('inspection-state-v1')
  }, [])

  const currentQuestions = currentStep ? getQuestions(currentStep) : []
  const canProceed =
    currentQuestions.length === 0 || currentQuestions.some((question) => isQuestionAnswered(question, answers[question.id]))

  if (isFinalReport) {
    return <FinalReport schema={schema} steps={steps} answers={answers} onRestart={handleRestart} />
  }

  if (!currentStep) return null

  return (
    <div ref={contentRef} className="min-h-screen flex flex-col overflow-x-hidden">
      <StickyHeader
        currentStep={currentStep}
        currentStepIndex={currentStepIndex}
        totalSteps={steps.length}
        score={score}
        statusLabel={label}
        hasCriticalFail={hasCriticalFail}
        onBack={handleBack}
        onExit={onExit}
      />

      {/* Mode Toggle */}
      <div className="p-4 pb-0">
        <div className="max-w-lg mx-auto">
          <ModeToggle mode={mode} onModeChange={handleModeChange} />
        </div>
      </div>

      {/* Inspection Cards */}
      <div className="flex-1 p-4 space-y-4 pb-24 max-w-lg mx-auto w-full">
        {currentStep.sections.map((section) => (
          <div key={section.id} className="space-y-2">
            <h3 className="text-sm text-muted-foreground font-medium">{section.label}</h3>
            {section.questions.map((question) => (
              <InspectionCard
                key={question.id}
                question={question}
                answer={answers[question.id]}
                onUpdate={handleItemUpdate}
              />
            ))}
          </div>
        ))}

        {currentQuestions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No items to inspect in this step.
          </div>
        )}
      </div>

      <StepNavigation
        currentStepIndex={currentStepIndex}
        totalSteps={steps.length}
        currentStep={currentStep}
        canProceed={canProceed}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </div>
  )
}
