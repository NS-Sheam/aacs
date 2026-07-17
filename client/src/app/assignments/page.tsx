'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, Filter, ChevronDown, RefreshCw, AlertCircle, FileText,
  User, CheckCircle2, XCircle, ArrowUpRight, Play, ExternalLink, Calendar, Loader2
} from 'lucide-react'
import { fetchSubmissionsList, fetchAssignmentsList, bulkRecheckSubmissions } from '../lib/api'

export default function SubmissionsListPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [rechecking, setRechecking] = useState(false)

  // Filters
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedAssignmentNo, setSelectedAssignmentNo] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [subsData, assignsData] = await Promise.all([
        fetchSubmissionsList(),
        fetchAssignmentsList()
      ])
      setSubmissions(subsData)
      setAssignments(assignsData)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to load submissions')
      setLoading(false)
    }
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const idsOnPage = paginatedSubmissions.map(sub => sub._id)
      setSelectedIds(prev => Array.from(new Set([...prev, ...idsOnPage])))
    } else {
      const idsOnPage = paginatedSubmissions.map(sub => sub._id)
      setSelectedIds(prev => prev.filter(id => !idsOnPage.includes(id)))
    }
  }

  const handleSelectToggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleBulkRecheck = async () => {
    if (selectedIds.length === 0) return
    setRechecking(true)
    try {
      await bulkRecheckSubmissions(selectedIds)
      setSelectedIds([])
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to bulk recheck submissions')
    } finally {
      setRechecking(false)
    }
  }

  const handleRecheckErrored = async () => {
    const erroredIds = filteredSubmissions
      .filter(sub => sub.status === 'error')
      .map(sub => sub._id)
    if (erroredIds.length === 0) return
    setRechecking(true)
    try {
      await bulkRecheckSubmissions(erroredIds)
      setSelectedIds([])
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to recheck errored submissions')
    } finally {
      setRechecking(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Calculate dynamic options
  const batches = Array.from(new Set(assignments.map(a => String(a.batch)))).sort((a, b) => Number(b) - Number(a))
  const assignmentNos = Array.from(new Set(assignments.map(a => String(a.assignmentNo)))).sort((a, b) => Number(a) - Number(b))

  // Filter logic
  const filteredSubmissions = submissions.filter(sub => {
    const assign = sub.assignmentId || {}
    const matchesBatch = selectedBatch ? String(assign.batch) === selectedBatch : true
    const matchesAssignmentNo = selectedAssignmentNo ? String(assign.assignmentNo) === selectedAssignmentNo : true

    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = searchTerm
      ? (sub.studentName || '').toLowerCase().includes(searchLower) ||
        (sub.liveUrl || '').toLowerCase().includes(searchLower) ||
        (sub.githubUrl || '').toLowerCase().includes(searchLower) ||
        (assign.title || '').toLowerCase().includes(searchLower)
      : true

    return matchesBatch && matchesAssignmentNo && matchesSearch
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage)
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="flex-1 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Browse Submissions</h1>
              <p className="text-slate-500 mt-2 text-sm md:text-base">Browse and filter student evaluations across all batches</p>
            </div>
            <div className="flex gap-3">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkRecheck}
                  disabled={rechecking}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                >
                  {rechecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Recheck Selected ({selectedIds.length})
                </button>
              )}
              {filteredSubmissions.some(sub => sub.status === 'error') && (
                <button
                  onClick={handleRecheckErrored}
                  disabled={rechecking}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
                >
                  {rechecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
                  Recheck Errored ({filteredSubmissions.filter(sub => sub.status === 'error').length})
                </button>
              )}
              <button
                onClick={loadData}
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                <RefreshCw className="h-4 w-4" /> Refresh List
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-lg border-b border-slate-100 pb-3">
              <Filter className="h-5 w-5 text-blue-600" />
              <h2>Filter & Search</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Batch</label>
                <div className="relative">
                  <select
                    value={selectedBatch}
                    onChange={e => { setSelectedBatch(e.target.value); setCurrentPage(1); }}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">All Batches</option>
                    {batches.map(b => (
                      <option key={b} value={b}>Batch {b}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assignment</label>
                <div className="relative">
                  <select
                    value={selectedAssignmentNo}
                    onChange={e => { setSelectedAssignmentNo(e.target.value); setCurrentPage(1); }}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">All Assignments</option>
                    {assignmentNos.map(no => (
                      <option key={no} value={no}>Assignment {no}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-slate-400" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Search Students / URLs</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by student name, email, assignment title..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center gap-2 mb-6">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Submissions Table List */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3 shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-slate-500 font-medium">Fetching evaluation histories...</p>
            </div>
          ) : filteredSubmissions.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200">
                      <th className="px-4 py-4 text-center w-12">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={paginatedSubmissions.length > 0 && paginatedSubmissions.every(sub => selectedIds.includes(sub._id))}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Student Info</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Assignment Details</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 w-32">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 w-28">Score</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 w-24">Links</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 w-28">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedSubmissions.map((sub) => {
                      const assign = sub.assignmentId || {}
                      const isComplete = sub.status === 'completed'
                      const isError = sub.status === 'error'
                      const isRunning = sub.status === 'running'

                      return (
                        <tr key={sub._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(sub._id)}
                              onChange={() => handleSelectToggle(sub._id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                          </td>
                          {/* Student Info */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm">{sub.studentName || 'Anonymous'}</div>
                                <div className="text-xs text-slate-500 font-medium">Submitted {new Date(sub.createdAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </td>

                          {/* Assignment Details */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-slate-800">
                              {assign.title || 'Assignment Detail'}
                            </div>
                            <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                              <span>Batch {assign.batch || '—'}</span>
                              <span>•</span>
                              <span>No. {assign.assignmentNo || '—'}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border uppercase tracking-wide ${
                              isComplete ? 'bg-green-50 border-green-200 text-green-700' :
                              isError ? 'bg-red-50 border-red-200 text-red-700' :
                              isRunning ? 'bg-blue-50 border-blue-200 text-blue-700 animate-pulse' :
                              'bg-slate-50 border-slate-200 text-slate-600'
                            }`}>
                              {isComplete && <CheckCircle2 className="h-3 w-3" />}
                              {isError && <XCircle className="h-3 w-3" />}
                              {isRunning && <Loader2 className="h-3 w-3 animate-spin" />}
                              {sub.status}
                            </span>
                          </td>

                          {/* Score */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {isComplete ? (
                              <div>
                                <span className="text-base font-extrabold text-blue-600">{sub.totalScore}</span>
                                <span className="text-xs text-slate-400 font-bold"> / {sub.maxScore || 12}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">—</span>
                            )}
                          </td>

                          {/* Links */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center items-center gap-1.5">
                              <a
                                href={sub.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-500 transition"
                                title="Live Site"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                              <a
                                href={sub.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition"
                                title="GitHub Code"
                              >
                                <FileText className="h-4 w-4" />
                              </a>
                            </div>
                          </td>

                          {/* Action Button */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Link
                              href={`/submissions/${sub._id}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-xl transition"
                            >
                              Details <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between text-sm text-slate-500">
                <div>
                  Showing <span className="font-bold text-slate-800">{paginatedSubmissions.length}</span> of <span className="font-bold text-slate-800">{filteredSubmissions.length}</span> submissions
                </div>
                
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white disabled:opacity-40 transition bg-slate-50"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                          currentPage === page
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'border-slate-200 text-slate-700 hover:bg-white bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white disabled:opacity-40 transition bg-slate-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm max-w-lg mx-auto">
              <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-lg">No Submissions Found</h3>
              <p className="text-slate-500 text-sm mt-1 mb-4">Try clearing filters or search queries to see all evaluated submissions.</p>
              <button
                onClick={() => { setSelectedBatch(''); setSelectedAssignmentNo(''); setSearchTerm(''); }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Clear Filters
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}