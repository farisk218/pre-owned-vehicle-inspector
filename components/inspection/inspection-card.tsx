'use client'

import { useEffect, useState } from 'react'
import { Camera, Check, AlertTriangle, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { InspectionAnswer, InspectionQuestion, InspectionStatus } from '@/lib/inspection-schema'
import { cn } from '@/lib/utils'

interface InspectionCardProps {
  question: InspectionQuestion
  answer?: InspectionAnswer
  onUpdate: (id: string, status: InspectionStatus, notes?: string, photo?: string) => void
}

export function InspectionCard({ question, answer, onUpdate }: InspectionCardProps) {
  const [showNotes, setShowNotes] = useState(answer?.status === 'warning' || answer?.status === 'fail')
  const [notes, setNotes] = useState(answer?.notes || '')

  useEffect(() => {
    setShowNotes(answer?.status === 'warning' || answer?.status === 'fail')
    setNotes(answer?.notes || '')
  }, [answer?.status, answer?.notes])

  const handleStatusChange = (status: InspectionStatus) => {
    const shouldShowNotes = status === 'warning' || status === 'fail'
    setShowNotes(shouldShowNotes)
    onUpdate(question.id, status, notes, answer?.photo)
  }

  const handleNotesChange = (value: string) => {
    setNotes(value)
    onUpdate(question.id, answer?.status || null, value, answer?.photo)
  }

  const handlePhotoUpload = () => {
    // In a real app, this would open the camera/file picker
    const photoUrl = `/photos/${question.id}-${Date.now()}.jpg`
    onUpdate(question.id, answer?.status || null, notes, photoUrl)
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5">
        {/* Title & Helper */}
        <div className="mb-4">
          <h3 className="text-lg font-medium text-foreground mb-1">
            {question.label}
          </h3>
          <p className="text-sm text-muted-foreground">
            {question.helperText}
          </p>
        </div>

        {/* Status Buttons */}
        <div className="flex gap-3 mb-4">
          <Button
            variant="outline"
            size="lg"
            className={cn(
              'flex-1 h-14 text-base font-medium transition-all',
              answer?.status === 'pass' 
                ? 'bg-pass text-pass-foreground border-pass hover:bg-pass/90' 
                : 'hover:border-pass hover:text-pass'
            )}
            onClick={() => handleStatusChange('pass')}
          >
            <Check className="w-5 h-5 mr-2" />
            Pass
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className={cn(
              'flex-1 h-14 text-base font-medium transition-all',
              answer?.status === 'warning' 
                ? 'bg-warning text-warning-foreground border-warning hover:bg-warning/90' 
                : 'hover:border-warning hover:text-warning'
            )}
            onClick={() => handleStatusChange('warning')}
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            Warning
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className={cn(
              'flex-1 h-14 text-base font-medium transition-all',
              answer?.status === 'fail' 
                ? 'bg-fail text-fail-foreground border-fail hover:bg-fail/90' 
                : 'hover:border-fail hover:text-fail'
            )}
            onClick={() => handleStatusChange('fail')}
          >
            <X className="w-5 h-5 mr-2" />
            Fail
          </Button>
        </div>

        {/* Notes & Photo (shown for warning/fail) */}
        {showNotes && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
            <Textarea
              placeholder="Add notes about this issue..."
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="min-h-[80px] bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12"
              onClick={handlePhotoUpload}
            >
              <Camera className="w-5 h-5 mr-2" />
              {answer?.photo ? 'Photo Added' : 'Add Photo'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
