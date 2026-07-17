'use client'

import { useState, useEffect } from 'react'
import { Eye, ShieldAlert, RotateCw, Edit3, Save, X, Globe, GitBranch } from 'lucide-react'
import Link from 'next/link'
import { getSubmissionsByAssignmentId, recheckSubmission, updateSubmission } from '@/app/lib/api'
import StatusBadge from '@/components/StatusBadge'

interface Submission {
  _id: string
  studentName?: string
  studentEmail?: string
  liveUrl: string
  githubUrl: string
  status: string
  totalScore?: number
  maxScore?: number
  autoCommitted?: number
  flagged?: number
  createdAt: string
}

interface SubmissionListProps {
  assignmentId: string
}

export default function SubmissionList({ assignmentId }: SubmissionListProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ studentName: '', studentEmail: '', liveUrl: '', githubUrl: '' })
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const fetchSubmissions = async () => {
    try {
      const res = await getSubmissionsByAssignmentId(assignmentId, 1, 100)
      setSubmissions(res?.data ?? [])
    } catch (err) {
      console.error('Error fetching submissions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()

    // Poll running/queued submissions
    const interval = setInterval(() => {
      const hasRunning = submissions.some(s => s.status === 'running' || s.status === 'queued')
      if (hasRunning) {
        fetchSubmissions()
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [assignmentId, submissions.length])

  const handleRecheck = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: true }))
    try {
      await recheckSubmission(id)
      fetchSubmissions()
    } catch (err) {
      alert('Failed to start recheck')
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleStartEdit = (sub: Submission) => {
    setEditingId(sub._id)
    setEditForm({
      studentName: sub.studentName || '',
      studentEmail: sub.studentEmail || '',
      liveUrl: sub.liveUrl,
      githubUrl: sub.githubUrl,
    })
  }

  const handleSaveEdit = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: true }))
    try {
      await updateSubmission(id, editForm)
      setEditingId(null)
      fetchSubmissions()
    } catch (err: any) {
      alert(err.message || 'Failed to update links')
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <RotateCw className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Submissions</h2>
        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
          {submissions.length} total
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white/70 backdrop-blur-md shadow-sm">
        <div className="grid grid-cols-[2.5fr_100px_80px_140px_200px] bg-slate-50/70 px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
          <span>Student & Links</span>
          <span>Score</span>
          <span>Status</span>
          <span>Actions</span>
          <span className="text-right">Controls</span>
        </div>

        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3">📄</span>
            <p className="text-sm font-semibold text-slate-800">No submissions found</p>
            <p className="text-xs text-slate-400 mt-1">Submit student links to start checking.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {submissions.map(sub => {
              const isEditing = editingId === sub._id
              const isActionLoading = actionLoading[sub._id]
              const percentage =
                sub.totalScore != null && sub.maxScore
                  ? (sub.totalScore / sub.maxScore) * 100
                  : null

              return (
                <div
                  key={sub._id}
                  className="grid grid-cols-[2.5fr_100px_80px_140px_200px] items-center px-6 py-4 hover:bg-slate-50/40 transition-colors duration-200"
                >
                  {/* Left Column: Student and Links */}
                  <div className="min-w-0 pr-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editForm.studentName}
                          onChange={e => setEditForm({ ...editForm, studentName: e.target.value })}
                          placeholder="Student Name"
                          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="email"
                          value={editForm.studentEmail}
                          onChange={e => setEditForm({ ...editForm, studentEmail: e.target.value })}
                          placeholder="Student Email"
                          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={editForm.liveUrl}
                          onChange={e => setEditForm({ ...editForm, liveUrl: e.target.value })}
                          placeholder="Live URL"
                          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={editForm.githubUrl}
                          onChange={e => setEditForm({ ...editForm, githubUrl: e.target.value })}
                          placeholder="GitHub Repo URL"
                          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-800 text-sm flex flex-wrap items-center gap-1.5">
                          <span>{sub.studentName || 'Unknown Student'}</span>
                          {sub.studentEmail && (
                            <span className="font-normal text-xs text-slate-500">({sub.studentEmail})</span>
                          )}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <a
                            href={sub.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                          >
                            <Globe size={12} className="text-slate-400" />
                            Live Site
                          </a>
                          <a
                            href={sub.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                          >
                            <GitBranch size={12} className="text-slate-400" />
                            Repository
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div>
                    {percentage !== null ? (
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          percentage >= 80
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : percentage >= 50
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                            : 'bg-red-50 text-red-700 border border-red-100'
                        }`}
                      >
                        {sub.totalScore}/{sub.maxScore}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={sub.status} size="sm" />
                  </div>

                  {/* Actions (View/Review) */}
                  <div className="flex gap-2">
                    <Link href={`/submissions/${sub._id}`}>
                      <button className="inline-flex items-center gap-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                        <Eye size={12} />
                        Results
                      </button>
                    </Link>
                    {sub.flagged ? (
                      <Link href={`/review?submissionId=${sub._id}`}>
                        <button className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer">
                          <ShieldAlert size={12} />
                          Review
                        </button>
                      </Link>
                    ) : null}
                  </div>

                  {/* Controls (Recheck/Fix links) */}
                  <div className="flex justify-end gap-1.5">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(sub._id)}
                          disabled={isActionLoading}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
                          title="Save Changes"
                        >
                          {isActionLoading ? (
                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRecheck(sub._id)}
                          disabled={isActionLoading || sub.status === 'running' || sub.status === 'queued'}
                          className={`p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors ${
                            isActionLoading || sub.status === 'running' || sub.status === 'queued' ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Trigger Recheck"
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${isActionLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleStartEdit(sub)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          title="Fix Link"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
