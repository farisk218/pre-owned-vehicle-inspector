'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Camera, Check, AlertTriangle, X, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoError, setPhotoError] = useState('')

  useEffect(() => {
    setShowNotes(answer?.status === 'warning' || answer?.status === 'fail')
    setNotes(answer?.notes || '')
  }, [answer?.status, answer?.notes])

  const handleStatusChange = (status: InspectionStatus) => {
    const shouldShowNotes = status === 'warning' || status === 'fail'
    setShowNotes(shouldShowNotes)
    if (status === 'fail' && !answer?.photo) {
      setPhotoError('Photo evidence is required for failed items.')
    } else {
      setPhotoError('')
    }
    onUpdate(question.id, { status, notes })
  }

  const handleNotesChange = (value: string) => {
    setNotes(value)
    onUpdate(question.id, { notes: value })
  }

  const handlePhotoUpload = () => {
    fileInputRef.current?.click()
  }

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()

      reader.onload = () => {
        img.src = String(reader.result || '')
      }
      reader.onerror = () => reject(new Error('Failed to read file'))

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxWidth = 1280
        const scale = Math.min(1, maxWidth / img.width)
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)

        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Could not compress image'))
          return
        }

        context.drawImage(img, 0, 0, canvas.width, canvas.height)
        const compressed = canvas.toDataURL('image/jpeg', 0.75)
        resolve(compressed)
      }
      img.onerror = () => reject(new Error('Failed to load image'))

      reader.readAsDataURL(file)
    })

  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Image too large. Max allowed size is 2MB.')
      event.target.value = ''
      return
    }

    try {
      const base64 = file.type.startsWith('image/') ? await compressImage(file) : await convertToBase64(file)
      setPhotoError('')
      onUpdate(question.id, { photo: base64 })
    } catch {
      setPhotoError('Could not process image. Please try again.')
    } finally {
      event.target.value = ''
    }
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {question.type === 'status' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
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
          <div className="flex flex-wrap gap-2 mb-4">
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
            {answer?.photo && (
              <img src={answer.photo} alt={`${question.label} evidence`} className="w-full max-h-56 object-cover rounded-lg border border-border" />
            )}
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
            {answer?.photo && (
              <img src={answer.photo} alt={`${question.label} evidence`} className="w-full max-h-56 object-cover rounded-lg border border-border" />
            )}
          </div>
        )}
        {photoError && <p className="text-xs text-fail mt-2">{photoError}</p>}
      </CardContent>
    </Card>
  )
}
