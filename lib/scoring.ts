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
      const answer = answers[question.id]
      if (!answer) continue

      let value: number | null = null
      if (question.type === 'status') {
        const status = answer.status
        if (status === null || status === undefined) continue
        value = status === 'pass' ? 1 : status === 'warning' ? 0.5 : 0

        if (question.critical && status === 'fail') {
          hasCriticalFail = true
        }
      } else if (question.type === 'boolean') {
        if (typeof answer.booleanValue !== 'boolean') continue
        value = answer.booleanValue ? 1 : 0
      } else if (question.type === 'rating') {
        const rating = answer.ratingValue
        if (typeof rating !== 'number') continue
        const min = question.minRating ?? 1
        const max = question.maxRating ?? 5
        value = (rating - min) / (max - min || 1)
      } else if (question.type === 'select') {
        const selected = answer.selectValue
        if (!selected) continue
        const option = question.options?.find((opt) => opt.value === selected)
        value = option?.score ?? 0.5
      } else {
        continue
      }

      total += value * question.weight
      max += question.weight
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
