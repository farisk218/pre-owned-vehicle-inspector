import { InspectionAnswers, InspectionStep, getQuestions } from '@/lib/inspection-schema'
import { TriggeredRule } from '@/lib/rules'

const RULE_COST_ADJUSTMENTS: Record<string, number> = {
  critical_rust_detected: 1500,
  turbo_issue_detected: 1000,
  injector_egr_attention: 800,
  serious_dtc_detected: 2500,
  commercial_usage_risk: 1200,
}

type SeverityTier = 'minor' | 'medium' | 'severe'

function resolveSeverityTier(answer: InspectionAnswers[string]): SeverityTier | null {
  if (!answer) return null

  if (answer.status === 'fail') return 'severe'
  if (answer.status === 'warning') return 'medium'
  if (answer.booleanValue === false) return 'severe'
  if (typeof answer.ratingValue === 'number') {
    if (answer.ratingValue <= 1) return 'severe'
    if (answer.ratingValue <= 3) return 'medium'
    return null
  }
  return null
}

function resolveQuestionCost(
  cost: InspectionStep['sections'][number]['questions'][number]['cost'],
  tier: SeverityTier
): number {
  if (!cost) return 0
  if (typeof cost === 'number') return tier === 'severe' ? cost : Math.round(cost * (tier === 'medium' ? 0.6 : 0.3))
  if (tier === 'severe') return cost.severe ?? cost.medium ?? cost.minor ?? 0
  if (tier === 'medium') return cost.medium ?? cost.minor ?? 0
  return cost.minor ?? 0
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
      const severity = resolveSeverityTier(answer)
      if (severity) {
        total += resolveQuestionCost(question.cost, severity)
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
