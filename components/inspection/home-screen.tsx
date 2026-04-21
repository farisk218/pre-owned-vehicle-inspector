'use client'

import { useEffect, useMemo, useState } from 'react'
import { Car, Wrench, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { InspectionMode } from '@/lib/inspection-schema'
import { listMakeOptions, listModelOptions, VehicleSelection } from '@/lib/schema-loader'

interface HomeScreenProps {
  onStartInspection: (mode: InspectionMode, selection: VehicleSelection) => void
}

export function HomeScreen({ onStartInspection }: HomeScreenProps) {
  const makeOptions = useMemo(() => listMakeOptions(), [])
  const [make, setMake] = useState(makeOptions[0]?.make ?? 'Maruti Suzuki')
  const modelOptions = useMemo(() => listModelOptions(make), [make])
  const [carId, setCarId] = useState(modelOptions[0]?.id ?? 'ertiga')
  const [year, setYear] = useState(2013)
  useEffect(() => {
    if (!modelOptions.some((item) => item.id === carId)) {
      setCarId(modelOptions[0]?.id ?? '')
    }
  }, [modelOptions, carId])
  const selectedOption = modelOptions.find((item) => item.id === carId)
  const yearSupported = selectedOption ? year >= selectedOption.years[0] && year <= selectedOption.years[1] : false
  const canStart = Boolean(selectedOption?.enabled && yearSupported)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      {/* Logo & Title */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
          <Car className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Used Car Inspector
        </h1>
        <p className="text-muted-foreground text-lg">
          Vehicle-aware inspection platform
        </p>
      </div>

      <Card className="w-full max-w-md border-border bg-card">
        <CardContent className="p-5 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Make</label>
            <select
              value={make}
              onChange={(event) => {
                const newMake = event.target.value
                setMake(newMake)
                const nextModels = listModelOptions(newMake)
                setCarId(nextModels[0]?.id ?? '')
              }}
              className="w-full mt-1 h-11 rounded-md border border-border bg-input px-3 text-sm"
            >
              {makeOptions.map((option) => (
                <option key={option.make} value={option.make}>
                  {option.make}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Model</label>
            <select
              value={carId}
              onChange={(event) => setCarId(event.target.value)}
              className="w-full mt-1 h-11 rounded-md border border-border bg-input px-3 text-sm"
            >
              {modelOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.model} ({option.years[0]}-{option.years[1]})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Model Year</label>
            <input
              type="number"
              value={year}
              onChange={(event) => setYear(Number(event.target.value) || 0)}
              className="w-full mt-1 h-11 rounded-md border border-border bg-input px-3 text-sm"
            />
          </div>
          {!canStart && (
            <p className="text-xs text-fail">
              Inspection not supported for selected year. Choose a supported generation year.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mode Selection */}
      <div className="w-full max-w-md space-y-4">
        <Card 
          className="border-2 border-primary/30 hover:border-primary transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-50"
          onClick={() => canStart && onStartInspection('easy', { carId, year })}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  Easy Check
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="w-4 h-4" />
                  <span>10–15 minutes</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Quick inspection covering essential checkpoints for buyers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-2 border-accent/30 hover:border-accent transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-50"
          onClick={() => canStart && onStartInspection('pro', { carId, year })}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <Wrench className="w-7 h-7 text-accent" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  Pro Check
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="w-4 h-4" />
                  <span>30–45 minutes</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Comprehensive inspection including engine diagnostics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Tap a mode to begin your professional vehicle inspection
      </p>
    </div>
  )
}
