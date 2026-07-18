'use client'

import { useEffect, useState } from 'react'
import { Download, Loader2, AlertTriangle, FileSpreadsheet, CheckCircle2, ChevronRight, Filter, Search, ChevronDown } from 'lucide-react'
import { fetchSubmissionsList, fetchAssignmentsList } from '../lib/api'
import { Assignment } from '@/types'

export default function ExportPage() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter and pagination state
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedAssignmentNo, setSelectedAssignmentNo] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    Promise.all([fetchSubmissionsList(), fetchAssignmentsList()])
      .then(([subData, assData]) => {
        setSubmissions(subData)
        setAssignments(assData)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load scorecard data')
        setLoading(false)
      })
  }, [])

  const getAssignmentTitle = (assignmentId: string) => {
    const found = assignments.find((a) => a._id === assignmentId)
    return found ? found.title : 'Unknown Assignment'
  }

  const getAssignmentBatch = (assignmentId: string) => {
    const found = assignments.find((a) => a._id === assignmentId)
    return found ? found.batch : 'N/A'
  }

  // Get unique batches and assignments
  const batches = Array.from(new Set(assignments.map(a => String(a.batch)))).sort((a, b) => Number(b) - Number(a))
  const assignmentNos = Array.from(new Set(assignments.map(a => String(a.assignmentNo)))).sort((a, b) => Number(a) - Number(b))

  // Filtered submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const foundAssignment = assignments.find((a) => a._id === sub.assignmentId) || {} as any
    
    const matchesBatch = selectedBatch ? String(foundAssignment.batch) === selectedBatch : true
    const matchesAssignmentNo = selectedAssignmentNo ? String(foundAssignment.assignmentNo) === selectedAssignmentNo : true

    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = searchTerm
      ? (sub.studentName || '').toLowerCase().includes(searchLower) ||
        (sub.liveUrl || '').toLowerCase().includes(searchLower) ||
        (sub.githubUrl || '').toLowerCase().includes(searchLower) ||
        (foundAssignment.title || '').toLowerCase().includes(searchLower)
      : true

    return matchesBatch && matchesAssignmentNo && matchesSearch
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage)
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) return

    // 1. Generate CSV Headers
    const headers = ['Student Name/Email', 'Assignment Title', 'Batch', 'Score', 'Max Score', 'Status', 'Live URL', 'GitHub URL', 'Submissions Date']
    
    // 2. Generate CSV Rows based on the FILTERED submissions list
    const rows = filteredSubmissions.map((sub) => [
      `"${sub.studentName || 'Anonymous'}"`,
      `"${getAssignmentTitle(sub.assignmentId)}"`,
      getAssignmentBatch(sub.assignmentId),
      sub.totalScore || 0,
      sub.maxScore || 0,
      sub.status,
      `"${sub.liveUrl}"`,
      `"${sub.githubUrl}"`,
      new Date(sub.createdAt).toLocaleString(),
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

    // 3. Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `AACS_Filtered_Export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="flex-1 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-8 w-8 text-blue-600" /> Export Scorecard
              </h1>
              <p className="text-slate-600 mt-2">Download student evaluations and automated check scores as CSV spreadsheets</p>
            </div>
            {filteredSubmissions.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 transition shadow-sm"
              >
                <Download className="h-5 w-5" /> Export Filtered CSV ({filteredSubmissions.length})
              </button>
            )}
          </div>

          {/* Filters card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base border-b border-slate-100 pb-3">
              <Filter className="h-5 w-5 text-blue-600" />
              <h2>Filter Scorecard</h2>
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
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Search Student / Repo</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by student name, email or URL..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Data Fetch Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-24 text-center text-slate-500 space-y-2 bg-white border border-slate-200 rounded-2xl">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <p>Loading evaluation scorecard...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-16 text-center bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 max-w-xl mx-auto space-y-4">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">No Submissions Found</h2>
              <p className="text-slate-500 text-sm">Try resetting filters to show score records.</p>
              <button
                onClick={() => { setSelectedBatch(''); setSelectedAssignmentNo(''); setSearchTerm(''); }}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name/Email</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Assignment</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Batch</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Verification Status</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Score</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Checked Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {paginatedSubmissions.map((sub) => (
                        <tr key={sub._id} className="hover:bg-slate-50/55 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">{sub.studentName || 'Anonymous Student'}</div>
                            <div className="text-xs text-slate-500 font-mono truncate max-w-[220px]">{sub.githubUrl}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                            {getAssignmentTitle(sub.assignmentId)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            Batch {getAssignmentBatch(sub.assignmentId)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              sub.status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' :
                              sub.status === 'running' ? 'bg-blue-50 border-blue-200 text-blue-700 animate-pulse' :
                              sub.status === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                              'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-slate-900">
                            {sub.status === 'completed' ? `${sub.totalScore} / ${sub.maxScore}` : '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                {totalPages > 1 && (
                  <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong> ({filteredSubmissions.length} rows)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}