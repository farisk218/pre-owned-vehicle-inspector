'use client'

import { useState } from 'react'
import { HomeScreen } from '@/components/inspection/home-screen'
import { InspectionFlow } from '@/components/inspection/inspection-flow'
import { InspectionMode } from '@/lib/inspection-schema'

type AppScreen = 'home' | 'inspection'

export default function UsedCarInspector() {
  const [screen, setScreen] = useState<AppScreen>('home')
  const [inspectionMode, setInspectionMode] = useState<InspectionMode>('easy')

  const handleStartInspection = (mode: InspectionMode) => {
    setInspectionMode(mode)
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
        <InspectionFlow 
          initialMode={inspectionMode} 
          onExit={handleExit} 
        />
      )}
    </main>
  )
}
