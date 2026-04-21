'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, XCircle, RotateCcw, Share2, IndianRupee, ShieldCheck, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { InspectionAnswers, InspectionSchema, InspectionStep, getQuestions } from '@/lib/inspection-schema'
import { calculateScore, getScoreStatus } from '@/lib/scoring'
import { calculateRecommendedOffer, estimateRepairCost } from '@/lib/pricing'
import { deriveOdometer, evaluateRules } from '@/lib/rules'
import { cn } from '@/lib/utils'

interface FinalReportProps {
  schema: InspectionSchema
  steps: InspectionStep[]
  answers: InspectionAnswers
  onRestart: () => void
}

export function FinalReport({ schema, steps, answers, onRestart }: FinalReportProps) {
  const [askingPrice, setAskingPrice] = useState(450000)
  const { score, hasCriticalFail } = useMemo(() => calculateScore(steps, answers), [steps, answers])
  const { label, color } = getScoreStatus(score, hasCriticalFail)
  const triggeredRules = useMemo(
    () =>
      evaluateRules({
        car: schema.car,
        answers,
        derived: {
          odometer: deriveOdometer(answers),
          score,
          hasCriticalFail,
        },
      }),
    [schema.car, answers, score, hasCriticalFail]
  )
  const estimatedRepairCost = useMemo(
    () => estimateRepairCost(steps, answers, triggeredRules),
    [steps, answers, triggeredRules]
  )
  const recommendedPrice = calculateRecommendedOffer(askingPrice, estimatedRepairCost)

  const inspectionSteps = steps.filter(s => s.id !== 'final')
  const criticalIssues = inspectionSteps.flatMap((s) =>
    getQuestions(s)
      .filter((q) => q.critical && answers[q.id]?.status === 'fail')
      .map((q) => ({ step: s.label, question: q }))
  )
  const minorIssues = inspectionSteps.flatMap((s) =>
    getQuestions(s)
      .filter((q) => !q.critical && answers[q.id]?.status !== 'pass' && answers[q.id]?.status !== null && answers[q.id]?.status !== undefined)
      .map((q) => ({ step: s.label, question: q }))
  )
  const strengths = inspectionSteps.flatMap((s) =>
    getQuestions(s)
      .filter((q) => answers[q.id]?.status === 'pass')
      .map((q) => ({ step: s.label, question: q }))
  )

  // Calculate circle properties
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border p-4">
        <h1 className="text-xl font-bold text-center text-foreground">
          Inspection Report
        </h1>
        <p className="text-sm text-muted-foreground text-center">
          {schema.car.year} {schema.car.make} {schema.car.model} {schema.car.engine || ''}
        </p>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Score Circle */}
        <Card className="border-border bg-card">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="relative w-44 h-44">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-secondary"
                />
                {/* Progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className={cn(
                    'transition-all duration-1000 ease-out',
                    hasCriticalFail ? 'text-fail' : score >= 80 ? 'text-pass' : score >= 50 ? 'text-warning' : 'text-fail'
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-5xl font-bold', color)}>
                  {score}
                </span>
                <span className="text-muted-foreground text-sm">out of 100</span>
              </div>
            </div>
            <div className={cn('mt-4 text-2xl font-bold', color)}>
              {label}
            </div>
          </CardContent>
        </Card>

        {/* Recommended Price */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-primary" />
              Negotiation Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Asking Price</label>
              <Input
                type="number"
                min={0}
                value={askingPrice}
                onChange={(e) => setAskingPrice(Number(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Estimated Repair Cost: <span className="text-warning font-semibold">₹{estimatedRepairCost.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              ₹{recommendedPrice.toLocaleString('en-IN')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Suggested offer after issue-based repair adjustment
            </p>
          </CardContent>
        </Card>

        {/* Critical Issues */}
        {criticalIssues.length > 0 && (
          <Card className="border-fail/30 bg-fail/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-fail">
                <XCircle className="w-5 h-5" />
                Critical Issues ({criticalIssues.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {criticalIssues.map(({ step, question }, index) => (
                <div key={index} className="p-3 bg-fail/10 rounded-lg">
                  <p className="font-medium text-foreground">{question.label}</p>
                  <p className="text-sm text-muted-foreground">{step}</p>
                  {answers[question.id]?.notes && (
                    <p className="text-sm text-fail mt-1">{answers[question.id]?.notes}</p>
                  )}
                  {answers[question.id]?.photo && (
                    <img
                      src={answers[question.id]?.photo}
                      alt={`${question.label} evidence`}
                      className="mt-2 rounded-lg border border-border max-h-40 w-full object-cover"
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Minor Issues */}
        {minorIssues.length > 0 && (
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                Minor Issues ({minorIssues.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {minorIssues.map(({ step, question }, index) => (
                <div key={index} className="p-3 bg-warning/10 rounded-lg">
                  <p className="font-medium text-foreground">{question.label}</p>
                  <p className="text-sm text-muted-foreground">{step}</p>
                  {answers[question.id]?.notes && (
                    <p className="text-sm text-warning mt-1">{answers[question.id]?.notes}</p>
                  )}
                  {answers[question.id]?.photo && (
                    <img
                      src={answers[question.id]?.photo}
                      alt={`${question.label} evidence`}
                      className="mt-2 rounded-lg border border-border max-h-40 w-full object-cover"
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {strengths.length > 0 && (
          <Card className="border-pass/30 bg-pass/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-pass">
                <ShieldCheck className="w-5 h-5" />
                Strengths ({strengths.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {strengths.slice(0, 5).map(({ step, question }, index) => (
                <div key={index} className="p-3 bg-pass/10 rounded-lg">
                  <p className="font-medium text-foreground">{question.label}</p>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {triggeredRules.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Intelligent Insights ({triggeredRules.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {triggeredRules.map((rule) => (
                <div
                  key={rule.id}
                  className={cn(
                    'p-3 rounded-lg',
                    rule.severity === 'critical'
                      ? 'bg-fail/10 border border-fail/30'
                      : rule.severity === 'warning'
                        ? 'bg-warning/10 border border-warning/30'
                        : 'bg-secondary'
                  )}
                >
                  <p
                    className={cn(
                      'text-sm',
                      rule.severity === 'critical'
                        ? 'text-fail'
                        : rule.severity === 'warning'
                          ? 'text-warning'
                          : 'text-foreground'
                    )}
                  >
                    {rule.message}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No Issues */}
        {criticalIssues.length === 0 && minorIssues.length === 0 && (
          <Card className="border-pass/30 bg-pass/5">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-pass/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <p className="text-lg font-medium text-pass">
                No issues found!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This vehicle passed all inspection checks
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-14"
            onClick={onRestart}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            New Inspection
          </Button>
          <Button
            size="lg"
            className="flex-1 h-14 bg-primary text-primary-foreground"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share Report
          </Button>
        </div>
      </div>
    </div>
  )
}
