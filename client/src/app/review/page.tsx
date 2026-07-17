'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Loader2, AlertTriangle, MessageSquare, ThumbsUp, ThumbsDown, Check, X, RefreshCw, Search, Eye, Filter, Code } from 'lucide-react'
import { fetchReviewQueue, resolveReviewItem } from '../lib/api'

export default function ReviewQueuePage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [notesInputs, setNotesInputs] = useState<Record<string, string>>({})

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
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch review queue')
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
  }, [])

  const handleResolve = async (itemId: string, decision: 'approved' | 'rejected') => {
    setSubmittingId(itemId)
    try {
      const notes = notesInputs[itemId] || ''
      await resolveReviewItem(itemId, decision, notes)
      
      // Animate/remove item from local state list
      setItems((prev) => prev.filter((item) => item._id !== itemId))
      setSubmittingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resolution failed')
      setSubmittingId(null)
    }
  }

  const handleNotesChange = (itemId: string, val: string) => {
    setNotesInputs((prev) => ({ ...prev, [itemId]: val }))
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
                const notes = notesInputs[item._id] || ''

                // Description and Check Message updates
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
                          // Extract email from name (e.g. "Sakib (sakib@gmail.com)" or "sakib@gmail.com")
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
                    <div className="p-6 md:w-80 flex flex-col justify-between bg-slate-50/50 space-y-4">
                      {/* Notes Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                          Review Notes (Optional)
                        </label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <textarea
                            placeholder="Add manual override feedback..."
                            value={notes}
                            onChange={(e) => handleNotesChange(item._id, e.target.value)}
                            disabled={submittingId === item._id}
                            className="w-full h-24 rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 bg-white"
                          />
                        </div>
                      </div>

                      {/* Decision Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolve(item._id, 'approved')}
                          disabled={submittingId === item._id}
                          className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-xl bg-green-600 py-3 px-3 text-sm font-semibold text-white hover:bg-green-700 transition"
                        >
                          {submittingId === item._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ThumbsUp className="h-4 w-4" />
                          )}
                          Approve
                        </button>

                        <button
                          onClick={() => handleResolve(item._id, 'rejected')}
                          disabled={submittingId === item._id}
                          className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-xl bg-red-600 py-3 px-3 text-sm font-semibold text-white hover:bg-red-700 transition"
                        >
                          {submittingId === item._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ThumbsDown className="h-4 w-4" />
                          )}
                          Reject
                        </button>
                      </div>
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