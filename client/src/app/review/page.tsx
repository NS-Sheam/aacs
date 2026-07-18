'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Loader2, AlertTriangle, MessageSquare, Check, RefreshCw, Search, Filter, Code, Send } from 'lucide-react'
import { fetchReviewQueue, resolveReviewItem } from '../lib/api'
import { useToast } from '@/components/Toast'

export default function ReviewQueuePage() {
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  // Per-item state: { marks, feedback }
  const [itemInputs, setItemInputs] = useState<Record<string, { marks: string; feedback: string }>>({})

  // Filtering & search states
  const [searchQuery, setSearchQuery] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [assignmentFilter, setAssignmentFilter] = useState('')
  const [statusTriggerFilter, setStatusTriggerFilter] = useState('')

  const loadQueue = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchReviewQueue()
      setItems(data)
      // Pre-populate marks with the full (max) mark for each item
      const initialInputs: Record<string, { marks: string; feedback: string }> = {}
      data.forEach((item: any) => {
        const maxMark = item.resultId?.marks ?? 0
        initialInputs[item._id] = { marks: String(maxMark), feedback: '' }
      })
      setItemInputs(initialInputs)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch review queue')
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
  }, [])

  const updateInput = (itemId: string, field: 'marks' | 'feedback', value: string) => {
    setItemInputs(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }))
  }

  const handleSubmit = async (item: any) => {
    const res = item.resultId || {}
    const maxMark = res.marks ?? 0
    const inputState = itemInputs[item._id] || { marks: String(maxMark), feedback: '' }

    const marksNum = Number(inputState.marks)
    if (inputState.marks.trim() === '' || isNaN(marksNum)) {
      toast('Please enter a valid mark', 'error')
      return
    }
    if (marksNum < 0) {
      toast('Mark cannot be negative', 'error')
      return
    }
    if (marksNum > maxMark) {
      toast(`Mark cannot exceed the section maximum of ${maxMark}`, 'error')
      return
    }

    // Derive approval status from marks
    const decision: 'approved' | 'rejected' = marksNum > 0 ? 'approved' : 'rejected'

    setSubmittingId(item._id)
    try {
      await resolveReviewItem(item._id, decision, inputState.feedback, marksNum)
      toast(`Review submitted: ${marksNum}/${maxMark} pts — ${decision.toUpperCase()}`, 'success')
      setItems(prev => prev.filter(i => i._id !== item._id))
      setSubmittingId(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Resolution failed', 'error')
      setSubmittingId(null)
    }
  }

  // Deduplicate options for filters
  const batches = Array.from(new Set(items.map(item => item.submissionId?.assignmentId?.batch).filter(Boolean)))
  const assignments = Array.from(new Set(items.map(item => item.submissionId?.assignmentId?.title).filter(Boolean)))

  // Filter items matching query and dropdown choices
  const filteredItems = items.filter(item => {
    const sub = item.submissionId || {}
    const assg = sub.assignmentId || {}
    const res = item.resultId || {}
    const desc = item.description || res.description || ''
    const student = sub.studentName || ''
    const key = item.reqKey || ''
    const sec = item.section || ''
    const email = sub.studentEmail || sub.email || ''
    const githubUrl = sub.githubUrl || ''
    const liveUrl = sub.liveUrl || ''

    const matchesSearch =
      student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      githubUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      liveUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesBatch = batchFilter === '' || String(assg.batch) === String(batchFilter)
    const matchesAssignment = assignmentFilter === '' || assg.title === assignmentFilter
    const matchesTrigger = statusTriggerFilter === '' || item.automatedResult === statusTriggerFilter

    return matchesSearch && matchesBatch && matchesAssignment && matchesTrigger
  })

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="flex-1 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <CheckCircle className="h-8 w-8 text-blue-600 animate-pulse" /> Manual Review Queue
              </h1>
              <p className="text-slate-500 mt-1 text-sm md:text-base">Approve or reject checks requiring manual instructor verification</p>
            </div>
            <button
              onClick={loadQueue}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm bg-white border border-slate-300 font-bold rounded-xl hover:bg-slate-50 text-slate-700 transition shadow-sm"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Queue Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Filtering Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Search & Filter Reviews</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student, description..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-4 text-sm text-slate-700 outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <select
                  value={batchFilter}
                  onChange={e => setBatchFilter(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500"
                >
                  <option value="">All Batches</option>
                  {batches.map(b => (
                    <option key={b} value={b}>Batch {b}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={assignmentFilter}
                  onChange={e => setAssignmentFilter(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500"
                >
                  <option value="">All Assignments</option>
                  {assignments.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={statusTriggerFilter}
                  onChange={e => setStatusTriggerFilter(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500"
                >
                  <option value="">All Automated Results</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
              <span>Showing <strong>{filteredItems.length}</strong> of <strong>{items.length}</strong> review request items</span>
              {(searchQuery || batchFilter || assignmentFilter || statusTriggerFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setBatchFilter('')
                    setAssignmentFilter('')
                    setStatusTriggerFilter('')
                  }}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center text-slate-500 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <p>Loading pending review items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 max-w-xl mx-auto space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Review Queue Clear!</h2>
              <p className="text-slate-500 text-sm font-medium">All submissions matching your current filters have been fully resolved.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredItems.map((item) => {
                const sub = item.submissionId || {}
                const assg = sub.assignmentId || {}
                const res = item.resultId || {}
                const maxMark = res.marks ?? 0
                const inputState = itemInputs[item._id] || { marks: String(maxMark), feedback: '' }
                const marksNum = Number(inputState.marks)
                const isSubmitting = submittingId === item._id

                // Determine preview badge
                let previewBadge = null
                if (!isNaN(marksNum) && inputState.marks.trim() !== '') {
                  if (marksNum === maxMark && maxMark > 0) {
                    previewBadge = <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Full Mark</span>
                  } else if (marksNum > 0) {
                    previewBadge = <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Partial Mark</span>
                  } else {
                    previewBadge = <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Rejected (0 pts)</span>
                  }
                }

                // Description and Check Message
                const requirementDescription = item.description || res.description || "No description provided."
                const checkStatusMessage = res.message || "Manual check required."
                const selectorUsed = res.evidence?.selectorUsed || ""
                const liveUrl = sub.liveUrl || ""
                const githubUrl = sub.githubUrl || ""

                return (
                  <div key={item._id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md">

                    {/* Details Column */}
                    <div className="p-6 flex-1 min-w-0 space-y-4 border-r border-slate-100">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          Batch {assg.batch || 'N/A'}
                        </span>
                        <span className="text-sm text-slate-500">•</span>
                        <span className="text-sm font-semibold text-slate-800 truncate">
                          {assg.title || 'Unknown Assignment'}
                        </span>
                      </div>

                      <div>
                        {(() => {
                          const nameStr = sub.studentName || 'Anonymous Student'
                          const emailMatch = nameStr.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)
                          const emailText = emailMatch ? emailMatch[1] : ""
                          const displayName = emailMatch ? nameStr.replace(emailMatch[0], "").replace(/[()]/g, "").trim() : nameStr

                          return (
                            <>
                              <h3 className="font-bold text-lg text-slate-900">
                                Student: <span className="text-blue-600 font-bold">{displayName}</span>
                                {(sub.studentEmail || emailText) && (
                                  <span className="text-sm font-semibold text-slate-500 ml-2">({sub.studentEmail || emailText})</span>
                                )}
                              </h3>
                            </>
                          )
                        })()}
                        <div className="flex flex-wrap gap-x-4 mt-1.5 text-xs text-slate-500 font-mono">
                          <span>Live: <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600 font-bold">{liveUrl}</a></span>
                          <span>•</span>
                          <span>Repo: <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600 font-bold">{githubUrl}</a></span>
                        </div>
                      </div>

                      {/* Requirement Details and Description */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center text-xs font-extrabold uppercase tracking-wider text-slate-400">
                          <span>Section: {item.section}</span>
                          <span>Key: {item.reqKey}</span>
                        </div>

                        <div>
                          <label className="block text-3xs font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Requirement Description</label>
                          <p className="text-sm text-slate-800 font-semibold leading-relaxed">
                            {requirementDescription}
                          </p>
                        </div>

                        {selectorUsed && (
                          <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-100">
                            <Code className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span className="text-3xs font-mono text-slate-600 font-bold truncate">Selector: {selectorUsed}</span>
                          </div>
                        )}

                        <div className="border-t border-slate-200/60 pt-3">
                          <label className="block text-3xs font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Automated Check Response</label>
                          <p className="text-xs text-slate-600 leading-relaxed italic">
                            "{checkStatusMessage}"
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                          <span className="font-semibold">
                            Automated Result: <strong className={`uppercase ${item.automatedResult === 'pass' ? 'text-green-600' : 'text-red-500'}`}>{item.automatedResult}</strong>
                          </span>
                          {item.confidence !== undefined && (
                            <span className="font-medium text-slate-400">AI Confidence: {Math.round(item.confidence * 100)}%</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="p-6 md:w-80 flex flex-col gap-4 bg-slate-50/50 shrink-0">

                      {/* Mark Input */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Mark Awarded
                          </label>
                          <span className="text-xs text-slate-400 font-semibold">Max: <span className="text-slate-700 font-bold">{maxMark}</span></span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={maxMark}
                          step="0.5"
                          value={inputState.marks}
                          onChange={(e) => {
                            const raw = e.target.value
                            updateInput(item._id, 'marks', raw)
                          }}
                          disabled={isSubmitting}
                          className={`w-full h-12 rounded-xl border-2 px-4 text-lg font-bold text-slate-800 outline-none transition bg-white
                            ${!isNaN(marksNum) && marksNum > maxMark
                              ? 'border-red-400 ring-2 ring-red-200'
                              : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                            }`}
                          placeholder="0"
                        />
                        {/* Validation warning */}
                        {!isNaN(marksNum) && marksNum > maxMark && (
                          <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> Cannot exceed {maxMark}
                          </p>
                        )}
                        {/* Live badge */}
                        {previewBadge && (
                          <div className="pt-0.5">{previewBadge}</div>
                        )}
                      </div>

                      {/* Feedback Textarea */}
                      <div className="space-y-2 flex-1">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" /> Instructor Feedback
                        </label>
                        <textarea
                          placeholder="Add review notes / feedback for the student..."
                          value={inputState.feedback}
                          onChange={(e) => updateInput(item._id, 'feedback', e.target.value)}
                          disabled={isSubmitting}
                          rows={4}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white resize-none"
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={() => handleSubmit(item)}
                        disabled={isSubmitting || (!isNaN(marksNum) && marksNum > maxMark)}
                        className={`w-full inline-flex justify-center items-center gap-2 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition shadow-sm
                          ${isSubmitting
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : !isNaN(marksNum) && marksNum > maxMark
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : marksNum === 0
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                      >
                        {isSubmitting ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                        ) : (
                          <><Send className="h-4 w-4" /> Submit Review</>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}