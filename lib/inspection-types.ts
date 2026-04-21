export type InspectionStatus = 'pass' | 'warning' | 'fail' | null

export interface InspectionItem {
  id: string
  title: string
  helperText: string
  status: InspectionStatus
  notes: string
  photoUrl?: string
  isProOnly?: boolean
}

export interface InspectionStep {
  id: string
  name: string
  icon: string
  items: InspectionItem[]
  isProOnly?: boolean
}

export type InspectionMode = 'easy' | 'pro'

export interface InspectionState {
  mode: InspectionMode
  currentStepIndex: number
  steps: InspectionStep[]
  vehicleInfo: {
    make: string
    model: string
    year: string
    mileage: string
    color: string
  }
}

export const EASY_STEPS: InspectionStep[] = [
  {
    id: 'basic-info',
    name: 'Basic Info',
    icon: '📋',
    items: [
      { id: 'vin-match', title: 'VIN matches documents?', helperText: 'Check dashboard & door frame', status: null, notes: '' },
      { id: 'odometer', title: 'Odometer reading consistent?', helperText: 'Compare with service records', status: null, notes: '' },
      { id: 'documents', title: 'All documents present?', helperText: 'RC, insurance, service history', status: null, notes: '' },
    ],
  },
  {
    id: 'exterior',
    name: 'Exterior',
    icon: '🚗',
    items: [
      { id: 'panel-gaps', title: 'Panel gaps even?', helperText: 'Check all doors, hood & boot', status: null, notes: '' },
      { id: 'paint-condition', title: 'Paint condition uniform?', helperText: 'Look for color variations', status: null, notes: '' },
      { id: 'rust-damage', title: 'Free from rust/damage?', helperText: 'Check wheel arches & underbody', status: null, notes: '' },
      { id: 'lights-working', title: 'All lights working?', helperText: 'Headlights, indicators, brake lights', status: null, notes: '' },
      { id: 'tyres-condition', title: 'Tyres in good condition?', helperText: 'Check tread depth & wear pattern', status: null, notes: '' },
    ],
  },
  {
    id: 'interior',
    name: 'Interior',
    icon: '🪑',
    items: [
      { id: 'seats-condition', title: 'Seats in good condition?', helperText: 'Check for tears, stains, wear', status: null, notes: '' },
      { id: 'ac-working', title: 'AC working properly?', helperText: 'Test cooling on all vents', status: null, notes: '' },
      { id: 'dashboard-lights', title: 'No warning lights?', helperText: 'Check with ignition on', status: null, notes: '' },
      { id: 'electrical-working', title: 'Electrical features working?', helperText: 'Windows, locks, music system', status: null, notes: '' },
    ],
  },
  {
    id: 'test-drive',
    name: 'Test Drive',
    icon: '🛣️',
    items: [
      { id: 'engine-start', title: 'Engine starts smoothly?', helperText: 'No unusual sounds on startup', status: null, notes: '' },
      { id: 'gear-shifts', title: 'Gear shifts smooth?', helperText: 'Test all gears including reverse', status: null, notes: '' },
      { id: 'brakes-effective', title: 'Brakes effective?', helperText: 'No pulling, squeaking or vibration', status: null, notes: '' },
      { id: 'steering-aligned', title: 'Steering aligned?', helperText: 'Car should drive straight', status: null, notes: '' },
      { id: 'suspension-ok', title: 'Suspension comfortable?', helperText: 'Test over speed breakers', status: null, notes: '' },
    ],
  },
  {
    id: 'final',
    name: 'Final Report',
    icon: '📊',
    items: [],
  },
]

export const PRO_STEPS: InspectionStep[] = [
  ...EASY_STEPS.slice(0, 4),
  {
    id: 'engine',
    name: 'Engine',
    icon: '⚙️',
    isProOnly: true,
    items: [
      { id: 'oil-level', title: 'Engine oil level OK?', helperText: 'Check dipstick - golden/amber color', status: null, notes: '', isProOnly: true },
      { id: 'coolant-level', title: 'Coolant level adequate?', helperText: 'Check reservoir when cold', status: null, notes: '', isProOnly: true },
      { id: 'battery-condition', title: 'Battery in good condition?', helperText: 'Check terminals for corrosion', status: null, notes: '', isProOnly: true },
      { id: 'belts-hoses', title: 'Belts & hoses intact?', helperText: 'No cracks or wear visible', status: null, notes: '', isProOnly: true },
      { id: 'exhaust-smoke', title: 'Exhaust smoke normal?', helperText: 'Should be clear/light white', status: null, notes: '', isProOnly: true },
      { id: 'engine-sound', title: 'Engine sound healthy?', helperText: 'No knocking or ticking', status: null, notes: '', isProOnly: true },
      { id: 'turbo-check', title: 'Turbo functioning well?', helperText: 'For diesel - check boost response', status: null, notes: '', isProOnly: true },
    ],
  },
  {
    id: 'final',
    name: 'Final Report',
    icon: '📊',
    items: [],
  },
]

export function calculateScore(steps: InspectionStep[]): number {
  const inspectionSteps = steps.filter(s => s.id !== 'final')
  const allItems = inspectionSteps.flatMap(s => s.items)
  const completedItems = allItems.filter(item => item.status !== null)
  
  if (completedItems.length === 0) return 0
  
  const passCount = completedItems.filter(i => i.status === 'pass').length
  const warningCount = completedItems.filter(i => i.status === 'warning').length
  
  // Pass = 100%, Warning = 50%, Fail = 0%
  const score = ((passCount * 100) + (warningCount * 50)) / completedItems.length
  return Math.round(score)
}

export function getScoreStatus(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Good', color: 'text-pass' }
  if (score >= 50) return { label: 'Needs Attention', color: 'text-warning' }
  return { label: 'Avoid', color: 'text-fail' }
}

export function calculateRecommendedPrice(score: number, basePrice: number = 450000): number {
  // Base price for 2013 Maruti Suzuki Ertiga Diesel: ~₹4.5L
  const modifier = score / 100
  return Math.round(basePrice * modifier)
}
