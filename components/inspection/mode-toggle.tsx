'use client'

import { InspectionMode } from '@/lib/inspection-schema'
import { cn } from '@/lib/utils'

interface ModeToggleProps {
  mode: InspectionMode
  onModeChange: (mode: InspectionMode) => void
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex rounded-lg bg-secondary p-1">
        <button
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-all',
            mode === 'easy'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onModeChange('easy')}
        >
          Easy Mode
        </button>
        <button
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-all',
            mode === 'pro'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onModeChange('pro')}
        >
          Pro Mode
        </button>
      </div>
    </div>
  )
}
