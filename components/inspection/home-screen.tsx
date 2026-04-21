'use client'

import { Car, Wrench, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { InspectionMode } from '@/lib/inspection-schema'

interface HomeScreenProps {
  onStartInspection: (mode: InspectionMode) => void
}

export function HomeScreen({ onStartInspection }: HomeScreenProps) {
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
          2013 Maruti Suzuki Ertiga Diesel
        </p>
      </div>

      {/* Mode Selection */}
      <div className="w-full max-w-md space-y-4">
        <Card 
          className="border-2 border-primary/30 hover:border-primary transition-colors cursor-pointer active:scale-[0.98]"
          onClick={() => onStartInspection('easy')}
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
          className="border-2 border-accent/30 hover:border-accent transition-colors cursor-pointer active:scale-[0.98]"
          onClick={() => onStartInspection('pro')}
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
