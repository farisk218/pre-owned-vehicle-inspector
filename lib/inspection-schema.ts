export type InspectionMode = 'easy' | 'pro'
export type InspectionStatus = 'pass' | 'warning' | 'fail' | null

export interface InspectionQuestion {
  id: string
  label: string
  helperText: string
  type: 'status'
  weight: number
  critical: boolean
  cost?: number
  mode?: InspectionMode
}

export interface InspectionSection {
  id: string
  label: string
  questions: InspectionQuestion[]
}

export interface InspectionStep {
  id: string
  label: string
  icon: string
  helperText: string
  sections: InspectionSection[]
  mode?: InspectionMode
}

export interface InspectionSchema {
  car: {
    make: string
    model: string
    year: number
    engine?: string
  }
  steps: InspectionStep[]
}

export interface InspectionAnswer {
  status: InspectionStatus
  notes?: string
  photo?: string
}

export type InspectionAnswers = Record<string, InspectionAnswer>

export function getStepsByMode(schema: InspectionSchema, mode: InspectionMode): InspectionStep[] {
  return schema.steps.filter((step) => !step.mode || step.mode === mode)
}

export function getQuestions(step: InspectionStep): InspectionQuestion[] {
  return step.sections.flatMap((section) => section.questions)
}
