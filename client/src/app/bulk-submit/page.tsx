'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Upload, Play, CheckCircle2, XCircle, Loader2, AlertTriangle,
  Users, FileText, ChevronLeft, Trash2, Plus, RefreshCw, Download,
  Info
} from 'lucide-react'
import { fetchAssignmentsList, submitStudentSubmission } from '../lib/api'

interface StudentRow {
  id: string
  studentName: string
  liveUrl: string
  githubUrl: string
  assignmentNo?: string // Feature 4: dynamic assignment matching
  status: 'pending' | 'queued' | 'error'
  error?: string
  submissionId?: string
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

export default function BulkSubmitPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState('')
  const [rows, setRows] = useState<StudentRow[]>([
    { id: generateId(), studentName: '', liveUrl: '', githubUrl: '', status: 'pending' },
  ])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAssignmentsList()
      .then((data) => {
        setAssignments(data)
        if (data.length === 1) setSelectedAssignment(data[0]._id)
      })
      .catch(console.error)
  }, [])

  const addRow = () => {
    setRows(prev => [...prev, { id: generateId(), studentName: '', liveUrl: '', githubUrl: '', status: 'pending' }])
  }

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const updateRow = (id: string, field: keyof StudentRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } as any : r))
  }

  // Feature 4: Parse CSV with optional assignmentNo column and autodetect match
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.trim().split('\n').filter(Boolean)
      const parsed: StudentRow[] = []

      // Read header row
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
      const nameIdx = headers.indexOf('studentname') !== -1 ? headers.indexOf('studentname') : 0
      const liveIdx = headers.indexOf('liveurl') !== -1 ? headers.indexOf('liveurl') : 1
      const gitIdx = headers.indexOf('githuburl') !== -1 ? headers.indexOf('githuburl') : 2
      const assignIdx = headers.indexOf('assignmentno') !== -1 ? headers.indexOf('assignmentno') : headers.indexOf('assignment')

      const startIndex = lines[0].includes('Url') || lines[0].includes('url') ? 1 : 0

      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(/,|\t/).map(p => p.replace(/"/g, '').trim())
        if (parts.length >= 3) {
          parsed.push({
            id: generateId(),
            studentName: parts[nameIdx] || parts[0] || '',
            liveUrl: parts[liveIdx] || parts[1] || '',
            githubUrl: parts[gitIdx] || parts[2] || '',
            assignmentNo: assignIdx !== -1 ? parts[assignIdx] : undefined,
            status: 'pending',
          })
        }
      }

      if (parsed.length > 0) {
        setRows(parsed)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Feature 4: Parse JSON array with optional assignmentNo field
  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string)
        const arr = Array.isArray(json) ? json : json.students || json.submissions || []
        const parsed: StudentRow[] = arr.map((s: any) => ({
          id: generateId(),
          studentName: s.studentName || s.name || s.email || '',
          liveUrl: s.liveUrl || s.live_url || s.url || '',
          githubUrl: s.githubUrl || s.github_url || s.github || '',
          assignmentNo: s.assignmentNo || s.assignment_no || s.assignment || undefined,
          status: 'pending' as const,
        }))
        if (parsed.length > 0) setRows(parsed)
      } catch {
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const downloadTemplate = () => {
    const csv = `studentName,liveUrl,githubUrl,assignmentNo\nJohn Doe,https://johndoe.github.io/project,https://github.com/johndoe/project,1\nJane Smith,https://janesmith.github.io/assignment,https://github.com/janesmith/assignment,1`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk-submit-autodetect-template.csv'
    a.click()
  }

  const validRows = rows.filter(r => r.liveUrl && r.githubUrl && r.studentName)
  
  // Can run if global selected OR individual rows have assignmentNo mapping
  const canRun = (selectedAssignment || validRows.every(r => r.assignmentNo)) && validRows.length > 0 && !running

  const handleSubmitAll = async () => {
    if (!canRun) return
    setRunning(true)
    setDone(false)

    for (const row of validRows) {
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'pending' } : r))
    }

    for (const row of validRows) {
      try {
        // Feature 4: Autodetect matching assignment specifications from row input
        let targetAssignmentId = selectedAssignment
        if (row.assignmentNo) {
          const match = assignments.find(a => String(a.assignmentNo) === String(row.assignmentNo))
          if (match) {
            targetAssignmentId = match._id
          } else {
            throw new Error(`Assignment No. ${row.assignmentNo} spec config not found in DB`)
          }
        }

        if (!targetAssignmentId) {
          throw new Error('No target assignment specified')
        }

        const result = await submitStudentSubmission({
          assignmentId: targetAssignmentId,
          studentName: row.studentName,
          liveUrl: row.liveUrl,
          githubUrl: row.githubUrl,
        })
        setRows(prev => prev.map(r =>
          r.id === row.id
            ? { ...r, status: 'queued', submissionId: result.submissionId }
            : r
        ))
      } catch (err: any) {
        setRows(prev => prev.map(r =>
          r.id === row.id
            ? { ...r, status: 'error', error: err.message || 'Submission failed' }
            : r
        ))
      }
    }

    setRunning(false)
    setDone(true)
  }

  const queued = rows.filter(r => r.status === 'queued').length
  const errors = rows.filter(r => r.status === 'error').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Back nav */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center animate-pulse">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Bulk Submission Upload</h1>
              <p className="text-slate-500 text-sm font-medium">Upload a class list with autodetect support to check all students at once</p>
            </div>
          </div>
        </div>

        {/* Assignment Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-bold text-slate-700">
              Select Default Assignment
            </label>
            <span className="text-3xs font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
              Optional if CSV contains assignmentNo column
            </span>
          </div>
          <select
            value={selectedAssignment}
            onChange={e => setSelectedAssignment(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-blue-500 transition"
          >
            <option value="">-- Choose an assignment --</option>
            {assignments.map(a => (
              <option key={a._id} value={a._id}>
                Batch {a.batch} — {a.title}
              </option>
            ))}
          </select>
        </div>

        {/* Import / Template Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-sm font-semibold text-slate-600 mr-1">Import:</span>

          <label className="cursor-pointer flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <FileText className="h-4 w-4 text-blue-600" />
            CSV File
            <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCSVImport} />
          </label>

          <label className="cursor-pointer flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <FileText className="h-4 w-4 text-green-600" />
            JSON File
            <input type="file" accept=".json" className="hidden" onChange={handleJSONImport} />
          </label>

          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Download CSV Template
          </button>

          <div className="ml-auto text-sm text-slate-500 font-medium">
            <span className="font-semibold text-slate-700">{rows.length}</span> student{rows.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
            <span className="font-semibold text-blue-600">{validRows.length}</span> ready
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 w-8">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Student Name / Email</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Live URL</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">GitHub URL</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 w-24">Assignment</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 w-24">Status</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => {
                  const isQueued = row.status === 'queued'
                  const isErr = row.status === 'error'
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.studentName}
                          onChange={e => updateRow(row.id, 'studentName', e.target.value)}
                          placeholder="Student Name"
                          disabled={running}
                          className="w-full text-sm bg-transparent outline-none focus:border-b focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.liveUrl}
                          onChange={e => updateRow(row.id, 'liveUrl', e.target.value)}
                          placeholder="https://..."
                          disabled={running}
                          className="w-full text-sm bg-transparent outline-none focus:border-b focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.githubUrl}
                          onChange={e => updateRow(row.id, 'githubUrl', e.target.value)}
                          placeholder="https://github.com/..."
                          disabled={running}
                          className="w-full text-sm bg-transparent outline-none focus:border-b focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.assignmentNo || ''}
                          onChange={e => updateRow(row.id, 'assignmentNo', e.target.value)}
                          placeholder="Auto"
                          disabled={running}
                          className="w-full text-center text-sm bg-transparent outline-none font-bold text-slate-700"
                        />
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-semibold border ${
                          isQueued ? 'bg-green-50 border-green-200 text-green-700' :
                          isErr ? 'bg-red-50 border-red-200 text-red-700' :
                          'bg-slate-50 border-slate-200 text-slate-600'
                        }`} title={row.error}>
                          {isQueued ? 'Enqueued' : isErr ? 'Failed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          disabled={running || rows.length <= 1}
                          className="p-1.5 rounded bg-slate-50 border border-slate-200 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-between">
            <button
              onClick={addRow}
              disabled={running}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition"
            >
              <Plus className="h-4 w-4" /> Add Row
            </button>

            <button
              onClick={handleSubmitAll}
              disabled={!canRun}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition disabled:opacity-40"
            >
              {running ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                <><Play className="h-4 w-4" /> Run Bulk Checks</>
              )}
            </button>
          </div>
        </div>

        {/* Results notification banner */}
        {done && (
          <div className="mb-6 p-4 rounded-xl border bg-slate-50 border-slate-200">
            <div className={`flex items-center gap-2 text-sm font-semibold mb-2 ${
              errors > 0 ? 'text-red-800' : 'text-green-800'
            }`}>
              {errors > 0 ? (
                <><AlertTriangle className="h-4 w-4" /> {queued} queued, {errors} failed</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> All {queued} submissions queued! Check the dashboard.</>
              )}
            </div>
          </div>
        )}

        {/* Format hint */}
        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 uppercase tracking-wider">
            <Info className="h-4.5 w-4.5 text-blue-600" />
            <span>Upload Template Formats</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">CSV Format Preview</p>
                <span className="text-4xs font-bold bg-blue-50 border border-blue-200 text-blue-600 px-1 py-0.5 rounded">AUTO-MATCH</span>
              </div>
              <pre className="text-3xs font-mono bg-white p-3 rounded-lg border border-slate-200 overflow-x-auto">
{`studentName,liveUrl,githubUrl,assignmentNo
John Doe,https://johndoe.github.io/app,https://github.com/johndoe/app,1`}
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">JSON Array Format Preview</p>
                <span className="text-4xs font-bold bg-blue-50 border border-blue-200 text-blue-600 px-1 py-0.5 rounded">AUTO-MATCH</span>
              </div>
              <pre className="text-3xs font-mono bg-white p-3 rounded-lg border border-slate-200 overflow-x-auto">
{`[
  {
    "studentName": "John Doe",
    "liveUrl": "https://johndoe.github.io/app",
    "githubUrl": "https://github.com/johndoe/app",
    "assignmentNo": 1
  }
]`}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
