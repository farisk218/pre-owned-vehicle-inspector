import { InspectionAnswers, InspectionStep, getQuestions } from '@/lib/inspection-schema'

export interface ScoreResult {
  score: number
  hasCriticalFail: boolean
}

export function calculateScore(steps: InspectionStep[], answers: InspectionAnswers): ScoreResult {
  let total = 0
  let max = 0
  let hasCriticalFail = false

  for (const step of steps) {
    if (step.id === 'final') continue

    for (const question of getQuestions(step)) {
      const answer = answers[question.id]?.status
      if (answer === null || answer === undefined) continue

      const value = answer === 'pass' ? 1 : answer === 'warning' ? 0.5 : 0
      total += value * question.weight
      max += question.weight

      if (question.critical && answer === 'fail') {
        hasCriticalFail = true
      }
    }
  }

  if (max === 0) return { score: 0, hasCriticalFail }
  return { score: Math.round((total / max) * 100), hasCriticalFail }
}

export function getScoreStatus(
  score: number,
  hasCriticalFail: boolean
): { label: string; color: string } {
  if (hasCriticalFail) return { label: 'HIGH RISK - NOT RECOMMENDED', color: 'text-fail' }
  if (score >= 80) return { label: 'Good', color: 'text-pass' }
  if (score >= 50) return { label: 'Needs Attention', color: 'text-warning' }
  return { label: 'Avoid', color: 'text-fail' }
}
