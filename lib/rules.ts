import { InspectionAnswers, InspectionSchema } from '@/lib/inspection-schema'

export type RuleSeverity = 'info' | 'warning' | 'critical'

export interface RuleContext {
  car: InspectionSchema['car']
  answers: InspectionAnswers
  derived: {
    odometer?: number
    score?: number
    hasCriticalFail?: boolean
  }
}

export interface Rule {
  id: string
  appliesTo: {
    make?: string
    model?: string
    yearRange?: [number, number]
  }
  severity: RuleSeverity
  message: string
  condition: (context: RuleContext) => boolean
}

export interface TriggeredRule {
  id: string
  severity: RuleSeverity
  message: string
}

const RULES: Rule[] = [
  {
    id: 'timing_chain_due_by_mileage',
    appliesTo: { model: 'Ertiga', yearRange: [2012, 2018] },
    severity: 'warning',
    message: 'Odometer is high; request timing chain inspection history.',
    condition: (ctx) => (ctx.derived.odometer ?? 0) >= 80000,
  },
  {
    id: 'critical_rust_detected',
    appliesTo: { model: 'Ertiga' },
    severity: 'critical',
    message: 'Rear wheel arch rust failure indicates structural risk and higher repair exposure.',
    condition: (ctx) => ctx.answers.rust?.status === 'fail',
  },
  {
    id: 'turbo_issue_detected',
    appliesTo: { model: 'Ertiga' },
    severity: 'warning',
    message: 'Turbo seepage failed; budget for seal/turbo line repair before purchase.',
    condition: (ctx) => ctx.answers.turbo_oil_seepage?.status === 'fail',
  },
  {
    id: 'injector_egr_attention',
    appliesTo: { model: 'Ertiga' },
    severity: 'warning',
    message: 'EGR/injector behavior failed; expect cleaning/service and fuel efficiency impact.',
    condition: (ctx) => ctx.answers.egr_injector_behavior?.status === 'fail',
  },
  {
    id: 'serious_dtc_detected',
    appliesTo: {},
    severity: 'critical',
    message: 'Serious ECU/ABS/airbag fault codes detected. Budget diagnosis before purchase.',
    condition: (ctx) => ctx.answers.dtc_present?.selectValue === 'serious',
  },
  {
    id: 'commercial_usage_risk',
    appliesTo: {},
    severity: 'warning',
    message: 'Vehicle marked as commercial/taxi use. Inspect wear items and documents carefully.',
    condition: (ctx) => ctx.answers.usage_type?.selectValue === 'commercial',
  },
  {
    id: 'overall_high_risk',
    appliesTo: {},
    severity: 'critical',
    message: 'Inspection includes critical failure; vehicle is high risk without major negotiation.',
    condition: (ctx) => Boolean(ctx.derived.hasCriticalFail),
  },
  {
    id: 'crysta_brake_judder_risk',
    appliesTo: { model: 'Innova Crysta', yearRange: [2016, 2022] },
    severity: 'critical',
    message: 'Brake judder or steering shake detected at speed. Prioritize rotor/suspension inspection.',
    condition: (ctx) => ctx.answers.brake_performance?.status === 'fail',
  },
  {
    id: 'crysta_dpf_risk',
    appliesTo: { model: 'Innova Crysta', yearRange: [2016, 2022] },
    severity: 'warning',
    message: 'DPF/AdBlue warning observed. Plan regen diagnostics before final purchase.',
    condition: (ctx) => ctx.answers.dpf_status_check?.selectValue === 'warning',
  },
  {
    id: 'crysta_dpf_limp_mode',
    appliesTo: { model: 'Innova Crysta', yearRange: [2016, 2022] },
    severity: 'critical',
    message: 'DPF limp mode risk detected. Expect immediate service and negotiation leverage.',
    condition: (ctx) => ctx.answers.dpf_status_check?.selectValue === 'limp',
  },
  {
    id: 'crysta_driveline_clunk',
    appliesTo: { model: 'Innova Crysta', yearRange: [2016, 2022] },
    severity: 'warning',
    message: 'Driveline clunk noted. Check propeller shaft/U-joints and mount condition.',
    condition: (ctx) => ctx.answers.propeller_shaft_greasing?.status === 'fail',
  },
]

function matchesAppliesTo(rule: Rule, context: RuleContext): boolean {
  const { make, model, yearRange } = rule.appliesTo
  if (make && context.car.make !== make) return false
  if (model && context.car.model !== model) return false
  if (yearRange) {
    const [start, end] = yearRange
    if (context.car.year < start || context.car.year > end) return false
  }
  return true
}

export function evaluateRules(context: RuleContext): TriggeredRule[] {
  return RULES.filter((rule) => matchesAppliesTo(rule, context) && rule.condition(context)).map(
    (rule) => ({
      id: rule.id,
      severity: rule.severity,
      message: rule.message,
    })
  )
}

export function deriveOdometer(answers: InspectionAnswers): number | undefined {
  const raw = answers.odometer_reading?.textValue
  if (!raw) return undefined
  const numeric = Number(raw.replace(/[^0-9]/g, ''))
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined
}
