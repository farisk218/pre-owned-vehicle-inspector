import baseInspectionData from '@/data/base-inspection.json'
import carsData from '@/data/cars.json'
import ertigaOverrideData from '@/data/ertiga-2013.json'
import { InspectionQuestion, InspectionSchema, InspectionStep } from '@/lib/inspection-schema'

interface VehicleGeneration {
  id: string
  yearRange: [number, number]
  enabled: boolean
  schema: string
  variants?: string[]
  fuelTypes?: string[]
}

interface VehicleRegistryCar {
  id: string
  make: string
  model: string
  generations: VehicleGeneration[]
}

interface CarsRegistry {
  cars: VehicleRegistryCar[]
}

interface VehicleOverride {
  car: InspectionSchema['car']
  overrides: Record<string, Partial<InspectionQuestion>>
  additions: Array<{
    stepId: string
    sectionId: string
    question: InspectionQuestion
  }>
}

export interface VehicleSelection {
  carId: string
  year: number
}

export interface VehicleOption {
  id: string
  label: string
  years: [number, number]
  enabled: boolean
}

const overrideMap: Record<string, VehicleOverride> = {
  'ertiga-2013.json': ertigaOverrideData as VehicleOverride,
}

function cloneSteps(steps: InspectionStep[]): InspectionStep[] {
  return JSON.parse(JSON.stringify(steps)) as InspectionStep[]
}

export function listVehicleOptions(): VehicleOption[] {
  const registry = carsData as CarsRegistry
  return registry.cars.flatMap((car) =>
    car.generations.map((generation) => ({
      id: car.id,
      label: `${car.make} ${car.model} (${generation.yearRange[0]}-${generation.yearRange[1]})`,
      years: generation.yearRange,
      enabled: generation.enabled,
    }))
  )
}

export function resolveVehicleGeneration(selection: VehicleSelection): {
  car: VehicleRegistryCar
  generation: VehicleGeneration
} | null {
  const registry = carsData as CarsRegistry
  const car = registry.cars.find((item) => item.id === selection.carId)
  if (!car) return null
  const generation = car.generations.find(
    (g) => selection.year >= g.yearRange[0] && selection.year <= g.yearRange[1]
  )
  if (!generation) return null
  return { car, generation }
}

export function buildInspectionSchema(selection: VehicleSelection): InspectionSchema | null {
  const resolved = resolveVehicleGeneration(selection)
  if (!resolved || !resolved.generation.enabled) return null

  const base = baseInspectionData as { steps: InspectionStep[] }
  const override = overrideMap[resolved.generation.schema]
  if (!override) return null

  const mergedSteps = cloneSteps(base.steps)

  for (const step of mergedSteps) {
    for (const section of step.sections) {
      section.questions = section.questions.map((question) => {
        const patch = override.overrides[question.id]
        return patch ? { ...question, ...patch } : question
      })
    }
  }

  for (const addition of override.additions) {
    const step = mergedSteps.find((s) => s.id === addition.stepId)
    const section = step?.sections.find((s) => s.id === addition.sectionId)
    if (!section) continue
    if (!section.questions.some((q) => q.id === addition.question.id)) {
      section.questions.push(addition.question)
    }
  }

  return {
    car: override.car,
    steps: mergedSteps,
  }
}
