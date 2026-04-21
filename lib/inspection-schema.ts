export type InspectionMode = 'easy' | 'pro'
export type InspectionStatus = 'pass' | 'warning' | 'fail' | null
export type InspectionQuestionType = 'status' | 'boolean' | 'rating' | 'select' | 'text' | 'photo'

export interface SelectOption {
  label: string
  value: string
  score?: number
}

export interface InspectionQuestion {
  id: string
  label: string
  helperText: string
  type: InspectionQuestionType
  weight: number
  critical: boolean
  cost?: number | { minor?: number; medium?: number; severe?: number }
  mode?: InspectionMode
  minRating?: number
  maxRating?: number
  options?: SelectOption[]
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
  status?: InspectionStatus
  booleanValue?: boolean
  ratingValue?: number
  selectValue?: string
  textValue?: string
  photo?: string
  notes?: string
}

export type InspectionAnswers = Record<string, InspectionAnswer>

export function getStepsByMode(schema: InspectionSchema, mode: InspectionMode): InspectionStep[] {
  return schema.steps.filter((step) => !step.mode || step.mode === mode)
}

export function getQuestions(step: InspectionStep): InspectionQuestion[] {
  return step.sections.flatMap((section) => section.questions)
}

export function isQuestionAnswered(question: InspectionQuestion, answer?: InspectionAnswer): boolean {
  if (!answer) return false

  switch (question.type) {
    case 'status':
      if (answer.status === null || answer.status === undefined) return false
      if (answer.status === 'fail') {
        return typeof answer.photo === 'string' && answer.photo.length > 0
      }
      return true
    case 'boolean':
      return typeof answer.booleanValue === 'boolean'
    case 'rating':
      return typeof answer.ratingValue === 'number'
    case 'select':
      return typeof answer.selectValue === 'string' && answer.selectValue.length > 0
    case 'text':
      return typeof answer.textValue === 'string' && answer.textValue.trim().length > 0
    case 'photo':
      return typeof answer.photo === 'string' && answer.photo.length > 0
    default:
      return false
  }
}
