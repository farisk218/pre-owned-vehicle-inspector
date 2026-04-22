'use client'

import { useState } from 'react'
import { HomeScreen } from '@/components/inspection/home-screen'
import { InspectionFlow } from '@/components/inspection/inspection-flow'
import { InspectionMode, InspectionSchema } from '@/lib/inspection-schema'
import { buildGenericInspectionSchema, buildInspectionSchema, GenericSelection, VehicleSelection } from '@/lib/schema-loader'

type AppScreen = 'home' | 'inspection'

export default function UsedCarInspector() {
  const [screen, setScreen] = useState<AppScreen>('home')
  const [inspectionMode, setInspectionMode] = useState<InspectionMode>('easy')
  const [schema, setSchema] = useState<InspectionSchema | null>(null)

  const handleStartInspection = (
    mode: InspectionMode,
    config:
      | { profile: 'vehicle-specific'; selection: VehicleSelection }
      | { profile: 'general'; selection: GenericSelection }
  ) => {
    const builtSchema =
      config.profile === 'vehicle-specific'
        ? buildInspectionSchema(config.selection)
        : buildGenericInspectionSchema(config.selection)
    if (!builtSchema) return
    setInspectionMode(mode)
    setSchema(builtSchema)
    setScreen('inspection')
  }

  const handleExit = () => {
    setScreen('home')
  }

  return (
    <main className="min-h-screen bg-background">
      {screen === 'home' && (
        <HomeScreen onStartInspection={handleStartInspection} />
      )}
      {screen === 'inspection' && (
        schema ? (
          <InspectionFlow
            initialMode={inspectionMode}
            schema={schema}
            onExit={handleExit}
          />
        ) : null
      )}
    </main>
  )
}
