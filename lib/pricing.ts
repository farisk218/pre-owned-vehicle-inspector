import { InspectionAnswers, InspectionStep, getQuestions } from '@/lib/inspection-schema'

export function estimateRepairCost(steps: InspectionStep[], answers: InspectionAnswers): number {
  let total = 0

  for (const step of steps) {
    if (step.id === 'final') continue
    for (const question of getQuestions(step)) {
      const answer = answers[question.id]
      const hasFailure = answer?.status === 'fail' || answer?.booleanValue === false
      if (hasFailure) {
        total += question.cost || 0
      }
    }
  }

  return total
}

export function calculateRecommendedOffer(askingPrice: number, repairCost: number): number {
  return Math.max(0, askingPrice - repairCost)
}
