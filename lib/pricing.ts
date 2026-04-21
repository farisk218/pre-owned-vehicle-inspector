import { InspectionAnswers, InspectionStep, getQuestions } from '@/lib/inspection-schema'
import { TriggeredRule } from '@/lib/rules'

const RULE_COST_ADJUSTMENTS: Record<string, number> = {
  critical_rust_detected: 1500,
  turbo_issue_detected: 1000,
  injector_egr_attention: 800,
}

export function estimateRepairCost(
  steps: InspectionStep[],
  answers: InspectionAnswers,
  triggeredRules: TriggeredRule[] = []
): number {
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

  for (const rule of triggeredRules) {
    total += RULE_COST_ADJUSTMENTS[rule.id] || 0
  }

  return total
}

export function calculateRecommendedOffer(askingPrice: number, repairCost: number): number {
  return Math.max(0, askingPrice - repairCost)
}
