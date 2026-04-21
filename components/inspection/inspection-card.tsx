'use client'

import { useEffect, useState } from 'react'
import { Camera, Check, AlertTriangle, X, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { InspectionAnswer, InspectionQuestion, InspectionStatus } from '@/lib/inspection-schema'
import { cn } from '@/lib/utils'

interface InspectionCardProps {
  question: InspectionQuestion
  answer?: InspectionAnswer
  onUpdate: (id: string, patch: Partial<InspectionAnswer>) => void
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
    onUpdate(question.id, { status, notes })
  }

  const handleNotesChange = (value: string) => {
    setNotes(value)
    onUpdate(question.id, { notes: value })
  }

  const handlePhotoUpload = () => {
    // In a real app, this would open the camera/file picker
    const photoUrl = `/photos/${question.id}-${Date.now()}.jpg`
    onUpdate(question.id, { photo: photoUrl })
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

        {question.type === 'status' && (
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
        )}

        {question.type === 'boolean' && (
          <div className="flex gap-3 mb-4">
            <Button
              variant={answer?.booleanValue === true ? 'default' : 'outline'}
              size="lg"
              className="flex-1 h-14"
              onClick={() => onUpdate(question.id, { booleanValue: true })}
            >
              Yes
            </Button>
            <Button
              variant={answer?.booleanValue === false ? 'destructive' : 'outline'}
              size="lg"
              className="flex-1 h-14"
              onClick={() => onUpdate(question.id, { booleanValue: false })}
            >
              No
            </Button>
          </div>
        )}

        {question.type === 'rating' && (
          <div className="flex gap-2 mb-4">
            {Array.from({ length: question.maxRating ?? 5 }).map((_, idx) => {
              const value = idx + 1
              return (
                <Button
                  key={value}
                  variant="outline"
                  size="icon"
                  className={cn('h-12 w-12', (answer?.ratingValue ?? 0) >= value && 'border-warning text-warning')}
                  onClick={() => onUpdate(question.id, { ratingValue: value })}
                >
                  <Star className="w-5 h-5" />
                </Button>
              )
            })}
          </div>
        )}

        {question.type === 'select' && (
          <div className="mb-4">
            <select
              className="w-full h-12 rounded-md border border-border bg-input px-3 text-sm"
              value={answer?.selectValue || ''}
              onChange={(e) => onUpdate(question.id, { selectValue: e.target.value })}
            >
              <option value="">Select an option</option>
              {question.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {question.type === 'text' && (
          <div className="mb-4">
            <Textarea
              placeholder="Enter details..."
              value={answer?.textValue || ''}
              onChange={(e) => onUpdate(question.id, { textValue: e.target.value })}
              className="min-h-[100px] bg-input border-border"
            />
          </div>
        )}

        {question.type === 'photo' && (
          <div className="mb-4 space-y-2">
            <Button variant="outline" size="lg" className="w-full h-12" onClick={handlePhotoUpload}>
              <Camera className="w-5 h-5 mr-2" />
              {answer?.photo ? 'Photo Added' : 'Upload Photo'}
            </Button>
            {answer?.photo && <Input readOnly value={answer.photo} className="text-xs" />}
          </div>
        )}

        {/* Notes & Photo (shown for warning/fail) */}
        {question.type === 'status' && showNotes && (
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
