'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Loader2, PlayCircle, AlertTriangle } from 'lucide-react'
import { getStatusColor } from '@/app/lib/getStatusColor'
import { fetchSubmissionsList } from '@/app/lib/api'

export function SubmissionsList() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 1. Initial list load
  const loadSubmissions = () => {
    fetchSubmissionsList()
      .then((data) => {
        setSubmissions(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch submissions')
        setLoading(false)
      })
  }

  useEffect(() => {
    loadSubmissions()

    // 2. Feature 2: Real-time progress updates SSE listener
    const eventSource = new EventSource('/api/v1/events')

    eventSource.onmessage = (event) => {
      try {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'progress') {
          // Dynamic in-place state update
          setSubmissions((prevSubs) => {
            return prevSubs.map((sub) => {
              if (sub._id === eventData.submissionId) {
                return {
                  ...sub,
                  status: eventData.status,
                  totalScore: eventData.totalScore,
                  maxScore: eventData.maxScore,
                  progress: eventData.progress
                }
              }
              return sub
            })
          })
        }
      } catch (err) {
        console.warn("Error parsing SSE real-time update:", err)
      }
    }

    // Polling fallback to pick up new submissions enqueued
    const interval = setInterval(loadSubmissions, 6000)

    return () => {
      eventSource.close()
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500 space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        <p>Loading recent submissions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-600 space-y-2">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
        <p className="font-semibold">Failed to load submissions</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 space-y-2 border-2 border-dashed border-slate-200 rounded-xl">
        <PlayCircle className="h-8 w-8 text-slate-400 mx-auto" />
        <p className="font-medium text-slate-700">No Submissions Found</p>
        <p className="text-sm">Run your first checker run to see submissions here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {submissions.slice(0, 10).map((submission) => (
        <Link
          key={submission._id}
          href={`/submissions/${submission._id}`}
          className="group flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors shadow-2xs"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-2">
              <h3 className="font-semibold text-slate-900 truncate">
                {submission.studentName || 'Anonymous Student'}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border uppercase ${getStatusColor(submission.status)}`}>
                {submission.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="truncate max-w-[200px] sm:max-w-xs">{submission.githubUrl}</span>
              <span className="text-xs text-slate-400">
                {new Date(submission.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-4">
            <div className="text-right">
              {submission.status === 'completed' ? (
                <>
                  <div className="text-lg font-bold text-slate-900">
                    {submission.totalScore}/{submission.maxScore}
                  </div>
                  <div className="text-xs text-slate-500">
                    {submission.progress?.completedChecks || 0}/{submission.progress?.totalChecks || 0} checks
                  </div>
                </>
              ) : submission.status === 'running' ? (
                <div>
                  <div className="text-sm font-semibold text-blue-600 animate-pulse">
                    Checking...
                  </div>
                  <div className="text-3xs text-slate-400 font-bold">
                    {submission.progress?.completedChecks || 0}/{submission.progress?.totalChecks || 0} checks
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400 capitalize">
                  {submission.status}
                </div>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  )
}
