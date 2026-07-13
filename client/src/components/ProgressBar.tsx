/* eslint-disable prefer-const */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock, AlertCircle, Loader2, X, Check,  } from 'lucide-react'
import { apiFetch } from '@/app/lib/api'
import { SubmissionProgress } from '@/types'


interface ProgressBarProps {
  submissionId: string
  onComplete?: () => void
}

export function ProgressBar({
  submissionId,
  onComplete,
}: ProgressBarProps) {
  const [progress, setProgress] = useState<SubmissionProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
 
  useEffect(() => {
    let interval: NodeJS.Timeout

    const pollStatus = async () => {
      try {
        const data = await apiFetch<SubmissionProgress>(
          `/api/submissions/${submissionId}/status`
        )

        setProgress(data)
        setError(null)

        if (
          data.status === 'completed' ||
          data.status === 'error'
        ) {
          clearInterval(interval)

          if (data.status === 'completed') {
            onComplete?.()
          }
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch progress'
        )

        clearInterval(interval)
      }
    }

    pollStatus()

    interval = setInterval(pollStatus, 3000)

    return () => clearInterval(interval)
  }, [submissionId, onComplete])

  const percentage = useMemo(() => {
    if (!progress) return 0

    const { completedChecks, totalChecks } = progress.progress

    if (totalChecks === 0) return 0

    return Math.round((completedChecks / totalChecks) * 100)
  }, [progress])

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

        <div>
          <p className="font-medium text-red-900">Error</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  if (!progress) {
    return (
      <div className="space-y-4">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

        <p className="text-center text-slate-600">
          Loading progress...
        </p>
      </div>
    )
  }

  const isCompleted = progress.status === 'completed'
  const isRunning = progress.status === 'running'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : isRunning ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          ) : (
            <Clock className="h-5 w-5 text-slate-600" />
          )}

          <span className="font-semibold capitalize">
            {progress.status}
          </span>
        </div>

        <span className="font-bold text-blue-600">
          {percentage}%
        </span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full transition-all duration-500 ${
            isCompleted
              ? 'bg-green-600'
              : isRunning
              ? 'bg-blue-600'
              : 'bg-slate-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-slate-50 p-4">
          <p className="text-xs uppercase text-slate-500">
            Completed Checks
          </p>

          <p className="mt-2 text-2xl font-bold">
            {progress.progress.completedChecks}
          </p>
        </div>

        <div className="rounded-lg border bg-slate-50 p-4">
          <p className="text-xs uppercase text-slate-500">
            Total Checks
          </p>

          <p className="mt-2 text-2xl font-bold">
            {progress.progress.totalChecks}
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-slate-50 p-4 text-center">
        {progress.status === 'queued' && (
          <p className="text-slate-700">
            Waiting in queue...
          </p>
        )}

        {progress.status === 'running' && (
          <p className="text-blue-700">
            Running automated checks...
          </p>
        )}

        {progress.status === 'completed' && (
          <p className="font-medium text-green-700">
            <Check /> All checks completed successfully!
          </p>
        )}

        {progress.status === 'error' && (
          <p className="font-medium text-red-700">
            <X /> Failed to complete checks.
          </p>
        )}
      </div>
    </div>
  )
}
export default ProgressBar