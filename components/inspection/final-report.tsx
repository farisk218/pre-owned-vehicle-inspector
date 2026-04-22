'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, XCircle, RotateCcw, Share2, IndianRupee, ShieldCheck, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { InspectionAnswers, InspectionSchema, InspectionStep, getQuestions } from '@/lib/inspection-schema'
import { calculateScore, getScoreStatus } from '@/lib/scoring'
import { calculateRecommendedOffer, estimateRepairCost } from '@/lib/pricing'
import { deriveOdometer, evaluateRules } from '@/lib/rules'
import { cn } from '@/lib/utils'

interface FinalReportProps {
  schema: InspectionSchema
  steps: InspectionStep[]
  answers: InspectionAnswers
  onRestart: () => void
  onExported: () => void
}

export function FinalReport({ schema, steps, answers, onRestart, onExported }: FinalReportProps) {
  const [askingPrice, setAskingPrice] = useState(450000)
  const { score, hasCriticalFail } = useMemo(() => calculateScore(steps, answers), [steps, answers])
  const { label, color } = getScoreStatus(score, hasCriticalFail)
  const triggeredRules = useMemo(
    () =>
      evaluateRules({
        car: schema.car,
        answers,
        derived: {
          odometer: deriveOdometer(answers),
          score,
          hasCriticalFail,
        },
      }),
    [schema.car, answers, score, hasCriticalFail]
  )
  const estimatedRepairCost = useMemo(
    () => estimateRepairCost(steps, answers, triggeredRules),
    [steps, answers, triggeredRules]
  )
  const recommendedPrice = calculateRecommendedOffer(askingPrice, estimatedRepairCost)

  const inspectionSteps = steps.filter(s => s.id !== 'final')
  const criticalIssues = inspectionSteps.flatMap((s) =>
    getQuestions(s)
      .filter((q) => q.critical && answers[q.id]?.status === 'fail')
      .map((q) => ({ step: s.label, question: q }))
  )
  const minorIssues = inspectionSteps.flatMap((s) =>
    getQuestions(s)
      .filter((q) => !q.critical && answers[q.id]?.status !== 'pass' && answers[q.id]?.status !== null && answers[q.id]?.status !== undefined)
      .map((q) => ({ step: s.label, question: q }))
  )
  const strengths = inspectionSteps.flatMap((s) =>
    getQuestions(s)
      .filter((q) => answers[q.id]?.status === 'pass')
      .map((q) => ({ step: s.label, question: q }))
  )
  const photoEvidence = inspectionSteps.flatMap((s) =>
    getQuestions(s)
      .filter((q) => Boolean(answers[q.id]?.photo))
      .map((q) => ({ step: s.label, question: q, photo: answers[q.id]?.photo as string }))
  )

  // Calculate circle properties
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  const exportPdfReport = async () => {
    const { jsPDF } = await import('jspdf/dist/jspdf.es.min.js')
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageHeight = doc.internal.pageSize.getHeight()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 14
    const contentWidth = pageWidth - margin * 2
    let y = margin

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
    }

    const addLine = (text: string, size = 11, spacing = 6, color: [number, number, number] = [31, 41, 55]) => {
      ensureSpace(spacing + 1)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(size)
      doc.setTextColor(...color)
      const lines = doc.splitTextToSize(text, contentWidth)
      doc.text(lines, margin, y)
      y += Math.max(spacing, lines.length * 5)
    }

    const drawSectionTitle = (title: string, tone: 'neutral' | 'danger' | 'warning' | 'success' | 'primary' = 'neutral') => {
      const tones: Record<string, [number, number, number]> = {
        neutral: [31, 41, 55],
        danger: [185, 28, 28],
        warning: [180, 83, 9],
        success: [21, 128, 61],
        primary: [30, 64, 175],
      }
      ensureSpace(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...tones[tone])
      doc.setFontSize(13)
      doc.text(title, margin, y)
      y += 6
      doc.setDrawColor(226, 232, 240)
      doc.line(margin, y, pageWidth - margin, y)
      y += 4
    }

    const getImageFormat = (dataUrl: string): 'JPEG' | 'PNG' | 'WEBP' => {
      const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/)
      const mimeSubtype = match?.[1]?.toLowerCase() || ''
      if (mimeSubtype.includes('png')) return 'PNG'
      if (mimeSubtype.includes('webp')) return 'WEBP'
      return 'JPEG'
    }

    const addEvidenceImage = (photo: string) => {
      ensureSpace(48)
      const format = getImageFormat(photo)
      try {
        doc.addImage(photo, format, margin, y, 58, 40)
        y += 42
      } catch {
        // Retry with JPEG fallback for malformed mime headers.
        try {
          doc.addImage(photo, 'JPEG', margin, y, 58, 40)
          y += 42
        } catch {
          addLine('Photo attached (preview unavailable in PDF export).', 9, 5, [100, 116, 139])
        }
      }
    }

    const addPhotoEvidenceGrid = (
      photos: Array<{ step: string; question: { label: string }; photo: string }>
    ) => {
      const gutter = 6
      const colWidth = (contentWidth - gutter) / 2
      const imageHeight = 30
      const itemHeight = imageHeight + 10

      for (let i = 0; i < photos.length; i += 2) {
        ensureSpace(itemHeight + 4)
        const rowItems = photos.slice(i, i + 2)

        rowItems.forEach((item, colIndex) => {
          const x = margin + colIndex * (colWidth + gutter)
          const format = getImageFormat(item.photo)

          try {
            doc.setDrawColor(226, 232, 240)
            doc.roundedRect(x, y, colWidth, itemHeight, 2, 2, 'S')
            doc.addImage(item.photo, format, x + 2, y + 2, colWidth - 4, imageHeight - 2)
          } catch {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(8)
            doc.setTextColor(100, 116, 139)
            doc.text('Preview unavailable', x + 4, y + 10)
          }

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(51, 65, 85)
          const caption = `${item.question.label} (${item.step})`
          const lines = doc.splitTextToSize(caption, colWidth - 4)
          doc.text(lines.slice(0, 2), x + 2, y + imageHeight + 5)
        })

        y += itemHeight + 4
      }
    }

    const drawStatCard = (
      x: number,
      title: string,
      value: string,
      accent: [number, number, number],
      style: 'default' | 'price' = 'default'
    ) => {
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(x, y, 43, 20, 2, 2, 'FD')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(title, x + 3, y + 6)
      if (style === 'price') {
        doc.setFont('times', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(...accent)
        doc.text(value, x + 3, y + 13.5)
      } else {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(...accent)
        doc.text(value, x + 3, y + 14)
      }
    }

    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, pageWidth, 28, 'F')
    doc.setFillColor(34, 197, 94)
    doc.circle(margin + 4, 10, 3, 'F')
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('UCI', margin + 1.4, 11.1)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(17)
    doc.text('USED CAR INSPECTION REPORT', margin + 10, 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`${schema.car.year} ${schema.car.make} ${schema.car.model} ${schema.car.engine || ''}`, margin + 10, 19)
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - margin, 19, { align: 'right' })
    y = 36

    drawStatCard(margin, 'Health Score', `${score}/100`, hasCriticalFail ? [185, 28, 28] : [21, 128, 61])
    drawStatCard(margin + 48, 'Report Status', label, hasCriticalFail ? [185, 28, 28] : [30, 64, 175])
    drawStatCard(margin + 96, 'Recommended Offer', `₹${recommendedPrice.toLocaleString('en-IN')}`, [21, 128, 61], 'price')
    y += 24

    drawSectionTitle('Negotiation Summary', 'primary')
    addLine(`Asking Price: ₹${askingPrice.toLocaleString('en-IN')}`, 11)
    addLine(`Estimated Repair Cost: ₹${estimatedRepairCost.toLocaleString('en-IN')}`, 11)
    addLine(`Recommended Offer Price: ₹${recommendedPrice.toLocaleString('en-IN')}`, 11)

    drawSectionTitle(`Critical Issues (${criticalIssues.length})`, 'danger')
    if (criticalIssues.length === 0) {
      addLine('No critical issues identified.', 11, 6, [71, 85, 105])
    } else {
      criticalIssues.forEach(({ step, question }, index) => {
        ensureSpace(14)
        doc.setFillColor(254, 242, 242)
        doc.setDrawColor(254, 202, 202)
        doc.roundedRect(margin, y - 4, contentWidth, 10, 2, 2, 'FD')
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(127, 29, 29)
        doc.setFontSize(11)
        doc.text(`${index + 1}. ${question.label}`, margin + 2, y + 2)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 116, 139)
        doc.setFontSize(9)
        doc.text(step, pageWidth - margin - 2, y + 2, { align: 'right' })
        y += 9
        const notes = answers[question.id]?.notes
        if (notes) addLine(`Notes: ${notes}`, 10, 5, [71, 85, 105])
        const photo = answers[question.id]?.photo
        if (photo) {
          addEvidenceImage(photo)
        }
        y += 2
      })
    }

    drawSectionTitle(`Minor Issues (${minorIssues.length})`, 'warning')
    if (minorIssues.length === 0) {
      addLine('No minor issues logged.', 11, 6, [71, 85, 105])
    } else {
      minorIssues.forEach(({ step, question }, index) => {
        addLine(`${index + 1}. ${question.label} (${step})`, 11, 6, [120, 53, 15])
      })
    }

    drawSectionTitle(`Photo Evidence (${photoEvidence.length})`, 'primary')
    if (photoEvidence.length === 0) {
      addLine('No photos attached.', 11, 6, [71, 85, 105])
    } else {
      addPhotoEvidenceGrid(photoEvidence)
    }

    drawSectionTitle(`Intelligent Insights (${triggeredRules.length})`, 'primary')
    if (triggeredRules.length === 0) {
      addLine('No additional advisory insights generated.', 11, 6, [71, 85, 105])
    } else {
      triggeredRules.forEach((rule, index) => {
        const tone = rule.severity === 'critical' ? [153, 27, 27] : rule.severity === 'warning' ? [146, 64, 14] : [30, 64, 175]
        addLine(`${index + 1}. ${rule.message}`, 11, 6, tone as [number, number, number])
      })
    }

    drawSectionTitle(`Strengths (${strengths.length})`, 'success')
    strengths.slice(0, 10).forEach(({ step, question }, index) => {
      addLine(`${index + 1}. ${question.label} (${step})`, 11, 6, [21, 128, 61])
    })

    const stamp = new Date().toISOString().slice(0, 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('Generated by Used Car Inspector', margin, pageHeight - 6)
    doc.text('Vehicle-aware inspection platform', pageWidth - margin, pageHeight - 6, { align: 'right' })
    doc.save(`inspection-report-${schema.car.model.toLowerCase()}-${stamp}.pdf`)
    onExported()
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border p-4">
        <h1 className="text-xl font-bold text-center text-foreground">
          Inspection Report
        </h1>
        <p className="text-sm text-muted-foreground text-center">
          {schema.car.year} {schema.car.make} {schema.car.model} {schema.car.engine || ''}
        </p>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Score Circle */}
        <Card className="border-border bg-card">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="relative w-44 h-44">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-secondary"
                />
                {/* Progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className={cn(
                    'transition-all duration-1000 ease-out',
                    hasCriticalFail ? 'text-fail' : score >= 80 ? 'text-pass' : score >= 50 ? 'text-warning' : 'text-fail'
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-5xl font-bold', color)}>
                  {score}
                </span>
                <span className="text-muted-foreground text-sm">out of 100</span>
              </div>
            </div>
            <div className={cn('mt-4 text-2xl font-bold', color)}>
              {label}
            </div>
          </CardContent>
        </Card>

        {/* Recommended Price */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-primary" />
              Negotiation Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Asking Price</label>
              <Input
                type="number"
                min={0}
                value={askingPrice}
                onChange={(e) => setAskingPrice(Number(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Estimated Repair Cost: <span className="text-warning font-semibold">₹{estimatedRepairCost.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              ₹{recommendedPrice.toLocaleString('en-IN')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Suggested offer after issue-based repair adjustment
            </p>
          </CardContent>
        </Card>

        {/* Critical Issues */}
        {criticalIssues.length > 0 && (
          <Card className="border-fail/30 bg-fail/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-fail">
                <XCircle className="w-5 h-5" />
                Critical Issues ({criticalIssues.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {criticalIssues.map(({ step, question }, index) => (
                <div key={index} className="p-3 bg-fail/10 rounded-lg">
                  <p className="font-medium text-foreground">{question.label}</p>
                  <p className="text-sm text-muted-foreground">{step}</p>
                  {answers[question.id]?.notes && (
                    <p className="text-sm text-fail mt-1">{answers[question.id]?.notes}</p>
                  )}
                  {answers[question.id]?.photo && (
                    <img
                      src={answers[question.id]?.photo}
                      alt={`${question.label} evidence`}
                      className="mt-2 rounded-lg border border-border max-h-40 w-full object-cover"
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Minor Issues */}
        {minorIssues.length > 0 && (
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                Minor Issues ({minorIssues.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {minorIssues.map(({ step, question }, index) => (
                <div key={index} className="p-3 bg-warning/10 rounded-lg">
                  <p className="font-medium text-foreground">{question.label}</p>
                  <p className="text-sm text-muted-foreground">{step}</p>
                  {answers[question.id]?.notes && (
                    <p className="text-sm text-warning mt-1">{answers[question.id]?.notes}</p>
                  )}
                  {answers[question.id]?.photo && (
                    <img
                      src={answers[question.id]?.photo}
                      alt={`${question.label} evidence`}
                      className="mt-2 rounded-lg border border-border max-h-40 w-full object-cover"
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {strengths.length > 0 && (
          <Card className="border-pass/30 bg-pass/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-pass">
                <ShieldCheck className="w-5 h-5" />
                Strengths ({strengths.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {strengths.slice(0, 5).map(({ step, question }, index) => (
                <div key={index} className="p-3 bg-pass/10 rounded-lg">
                  <p className="font-medium text-foreground">{question.label}</p>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {triggeredRules.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Intelligent Insights ({triggeredRules.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {triggeredRules.map((rule) => (
                <div
                  key={rule.id}
                  className={cn(
                    'p-3 rounded-lg',
                    rule.severity === 'critical'
                      ? 'bg-fail/10 border border-fail/30'
                      : rule.severity === 'warning'
                        ? 'bg-warning/10 border border-warning/30'
                        : 'bg-secondary'
                  )}
                >
                  <p
                    className={cn(
                      'text-sm',
                      rule.severity === 'critical'
                        ? 'text-fail'
                        : rule.severity === 'warning'
                          ? 'text-warning'
                          : 'text-foreground'
                    )}
                  >
                    {rule.message}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No Issues */}
        {criticalIssues.length === 0 && minorIssues.length === 0 && (
          <Card className="border-pass/30 bg-pass/5">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-pass/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <p className="text-lg font-medium text-pass">
                No issues found!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This vehicle passed all inspection checks
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-14"
            onClick={onRestart}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Back To Home
          </Button>
          <Button
            size="lg"
            className="flex-1 h-14 bg-primary text-primary-foreground"
            onClick={() => {
              void exportPdfReport()
            }}
          >
            <Share2 className="w-5 h-5 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>
    </div>
  )
}
