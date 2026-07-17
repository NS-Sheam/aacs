'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Upload, Play, CheckCircle2, XCircle, Loader2, AlertTriangle,
  Users, FileText, ChevronLeft, Trash2, Plus, Download,
  Info
} from 'lucide-react'
import { fetchAssignmentsList, submitStudentSubmission } from '../lib/api'
import { useToast } from '@/components/Toast'

interface StudentRow {
  id: string
  studentName: string
  studentId: string
  email: string
  liveUrl: string
  githubUrl: string
  assignmentNo?: string
  status: 'pending' | 'queued' | 'error'
  error?: string
  submissionId?: string
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

export default function BulkSubmitPage() {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<any[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState('')
  const [rows, setRows] = useState<StudentRow[]>([
    { id: generateId(), studentName: '', studentId: '', email: '', liveUrl: '', githubUrl: '', status: 'pending' },
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
    setRows(prev => [...prev, { id: generateId(), studentName: '', studentId: '', email: '', liveUrl: '', githubUrl: '', status: 'pending' }])
  }

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const updateRow = (id: string, field: keyof StudentRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } as any : r))
  }

  // Parse CSV with studentId, email, assignmentNo columns
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.trim().split('\n').filter(Boolean)
      const parsed: StudentRow[] = []

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
      const nameIdx = headers.indexOf('studentname') !== -1 ? headers.indexOf('studentname') : 0
      const idIdx = headers.indexOf('studentid') !== -1 ? headers.indexOf('studentid') : -1
      const emailIdx = headers.indexOf('email') !== -1 ? headers.indexOf('email') : -1
      const liveIdx = headers.indexOf('liveurl') !== -1 ? headers.indexOf('liveurl') : (idIdx === -1 ? 1 : 2)
      const gitIdx = headers.indexOf('githuburl') !== -1 ? headers.indexOf('githuburl') : (idIdx === -1 ? 2 : 3)
      const assignIdx = headers.indexOf('assignmentno') !== -1 ? headers.indexOf('assignmentno') : headers.indexOf('assignment')

      const startIndex = lines[0].toLowerCase().includes('url') ? 1 : 0

      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(/,|\t/).map(p => p.replace(/"/g, '').trim())
        if (parts.length >= 2) {
          parsed.push({
            id: generateId(),
            studentName: parts[nameIdx] || '',
            studentId: idIdx !== -1 ? (parts[idIdx] || '') : '',
            email: emailIdx !== -1 ? (parts[emailIdx] || '') : '',
            liveUrl: parts[liveIdx] || '',
            githubUrl: parts[gitIdx] || '',
            assignmentNo: assignIdx !== -1 ? parts[assignIdx] : undefined,
            status: 'pending',
          })
        }
      }

      if (parsed.length > 0) {
        setRows(parsed)
        toast(`Imported ${parsed.length} students from CSV`, 'success')
      } else {
        toast('No valid rows found in CSV', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Parse JSON array with studentId, email, assignmentNo fields
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
          studentName: s.studentName || s.name || '',
          studentId: s.studentId || s.student_id || s.id || '',
          email: s.email || s.studentEmail || '',
          liveUrl: s.liveUrl || s.live_url || s.url || '',
          githubUrl: s.githubUrl || s.github_url || s.github || '',
          assignmentNo: s.assignmentNo || s.assignment_no || s.assignment || undefined,
          status: 'pending' as const,
        }))
        if (parsed.length > 0) {
          setRows(parsed)
          toast(`Imported ${parsed.length} students from JSON`, 'success')
        } else {
          toast('No valid entries found in JSON', 'error')
        }
      } catch {
        toast('Invalid JSON file — check the format and try again', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const downloadTemplate = () => {
    const csv = `studentName,studentId,email,liveUrl,githubUrl,assignmentNo\nJohn Doe,WEB13-0001,john@gmail.com,https://johndoe.github.io/app,https://github.com/johndoe/app,1\nJane Smith,WEB13-0002,jane@gmail.com,https://janesmith.github.io/assignment,https://github.com/janesmith/assignment,1`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk-submit-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // All 4 student fields + URLs are required
  const validRows = rows.filter(r => r.studentName && r.studentId && r.email && r.liveUrl && r.githubUrl)

  // Can run if global selected OR individual rows have assignmentNo mapping
  const canRun = (selectedAssignment || validRows.every(r => r.assignmentNo)) && validRows.length > 0 && !running

  const handleSubmitAll = async () => {
    if (!canRun) return
    setRunning(true)
    setDone(false)

    for (const row of validRows) {
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'pending' } : r))
    }

    let successCount = 0
    let errorCount = 0

    for (const row of validRows) {
      try {
        let targetAssignmentId = selectedAssignment
        if (row.assignmentNo) {
          const match = assignments.find(a => String(a.assignmentNo) === String(row.assignmentNo))
          if (match) {
            targetAssignmentId = match._id
          } else {
            throw new Error(`Assignment No. ${row.assignmentNo} not found in DB`)
          }
        }

        if (!targetAssignmentId) {
          throw new Error('No target assignment specified')
        }

        const result = await submitStudentSubmission({
          assignmentId: targetAssignmentId,
          studentName: row.studentName,
          studentId: row.studentId,
          email: row.email,
          liveUrl: row.liveUrl,
          githubUrl: row.githubUrl,
        })
        setRows(prev => prev.map(r =>
          r.id === row.id
            ? { ...r, status: 'queued', submissionId: result.submissionId }
            : r
        ))
        successCount++
      } catch (err: any) {
        setRows(prev => prev.map(r =>
          r.id === row.id
            ? { ...r, status: 'error', error: err.message || 'Submission failed' }
            : r
        ))
        errorCount++
      }
    }

    setRunning(false)
    setDone(true)

    if (errorCount === 0) {
      toast(`✅ All ${successCount} submissions queued successfully!`, 'success')
    } else {
      toast(`${successCount} queued, ${errorCount} failed — check rows in red`, 'error')
    }
  }

  const queued = rows.filter(r => r.status === 'queued').length
  const errors = rows.filter(r => r.status === 'error').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Back nav */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Bulk Submission Upload</h1>
              <p className="text-slate-500 text-sm font-medium">Import a class list (CSV or JSON) to check all students at once</p>
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
              Optional if JSON has assignmentNo field
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
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 w-8">#</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Student Name</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Student ID</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Live URL</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">GitHub URL</th>
                  <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 w-20">Assign #</th>
                  <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 w-24">Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => {
                  const isQueued = row.status === 'queued'
                  const isErr = row.status === 'error'
                  return (
                    <tr key={row.id} className={`hover:bg-slate-50/50 transition-colors ${isErr ? 'bg-red-50/30' : ''}`}>
                      <td className="px-3 py-2.5 text-sm font-semibold text-slate-400">{idx + 1}</td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={row.studentName}
                          onChange={e => updateRow(row.id, 'studentName', e.target.value)}
                          placeholder="Full name"
                          disabled={running}
                          className="w-full min-w-[120px] text-sm bg-transparent outline-none focus:border-b focus:border-blue-500 placeholder:text-slate-300"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={row.studentId}
                          onChange={e => updateRow(row.id, 'studentId', e.target.value)}
                          placeholder="WEB13-0001"
                          disabled={running}
                          className="w-full min-w-[100px] text-sm bg-transparent outline-none focus:border-b focus:border-blue-500 placeholder:text-slate-300 font-mono"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="email"
                          value={row.email}
                          onChange={e => updateRow(row.id, 'email', e.target.value)}
                          placeholder="student@gmail.com"
                          disabled={running}
                          className="w-full min-w-[140px] text-sm bg-transparent outline-none focus:border-b focus:border-blue-500 placeholder:text-slate-300"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={row.liveUrl}
                          onChange={e => updateRow(row.id, 'liveUrl', e.target.value)}
                          placeholder="https://..."
                          disabled={running}
                          className="w-full min-w-[160px] text-sm bg-transparent outline-none focus:border-b focus:border-blue-500 placeholder:text-slate-300"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={row.githubUrl}
                          onChange={e => updateRow(row.id, 'githubUrl', e.target.value)}
                          placeholder="https://github.com/..."
                          disabled={running}
                          className="w-full min-w-[160px] text-sm bg-transparent outline-none focus:border-b focus:border-blue-500 placeholder:text-slate-300"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={row.assignmentNo || ''}
                          onChange={e => updateRow(row.id, 'assignmentNo', e.target.value)}
                          placeholder="Auto"
                          disabled={running}
                          className="w-full text-center text-sm bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-normal"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-semibold border ${
                            isQueued ? 'bg-green-50 border-green-200 text-green-700' :
                            isErr ? 'bg-red-50 border-red-200 text-red-700' :
                            'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                          title={row.error}
                        >
                          {isQueued ? <CheckCircle2 className="h-3 w-3" /> : isErr ? <XCircle className="h-3 w-3" /> : null}
                          {isQueued ? 'Queued' : isErr ? 'Failed' : 'Pending'}
                        </span>
                        {isErr && row.error && (
                          <p className="text-2xs text-red-500 mt-0.5 max-w-[100px] truncate" title={row.error}>{row.error}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
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

          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-between items-center">
            <button
              onClick={addRow}
              disabled={running}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition"
            >
              <Plus className="h-4 w-4" /> Add Row
            </button>

            <div className="flex items-center gap-3">
              {!canRun && validRows.length > 0 && !selectedAssignment && (
                <p className="text-xs text-amber-600 font-medium">
                  Select an assignment above or add <code className="font-mono bg-amber-50 px-1 rounded">assignmentNo</code> to each row
                </p>
              )}
              <button
                onClick={handleSubmitAll}
                disabled={!canRun}
                className="flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {running ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Play className="h-4 w-4" /> Run Bulk Checks</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results notification banner */}
        {done && (
          <div className={`mb-6 p-4 rounded-xl border ${errors > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className={`flex items-center gap-2 text-sm font-semibold ${errors > 0 ? 'text-red-800' : 'text-green-800'}`}>
              {errors > 0 ? (
                <><AlertTriangle className="h-4 w-4" /> {queued} queued, {errors} failed — check rows highlighted in red above</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> All {queued} submissions queued successfully! Check the dashboard for results.</>
              )}
            </div>
          </div>
        )}

        {/* Format hint */}
        <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
            <Info className="h-4 w-4 text-blue-600" />
            <span>Upload Template Formats</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CSV Format */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">CSV Format</p>
                <span className="text-4xs font-bold bg-blue-50 border border-blue-200 text-blue-600 px-1.5 py-0.5 rounded">AUTO-MATCH</span>
              </div>
              <pre className="text-2xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-x-auto leading-relaxed">
{`studentName,studentId,email,liveUrl,githubUrl,assignmentNo
John Doe,WEB13-0001,john@gmail.com,https://johndoe.github.io/app,https://github.com/johndoe/app,1
Jane Smith,WEB13-0002,jane@gmail.com,https://janesmith.github.io/hw,https://github.com/janesmith/hw,1`}
              </pre>
              <p className="text-3xs text-slate-400 font-medium">
                Columns: <code className="bg-slate-100 px-1 rounded">studentName</code> <code className="bg-slate-100 px-1 rounded">studentId</code> <code className="bg-slate-100 px-1 rounded">email</code> <code className="bg-slate-100 px-1 rounded">liveUrl</code> <code className="bg-slate-100 px-1 rounded">githubUrl</code> <code className="bg-slate-100 px-1 rounded">assignmentNo</code>
              </p>
            </div>

            {/* JSON Format */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">JSON Array Format</p>
                <span className="text-4xs font-bold bg-green-50 border border-green-200 text-green-600 px-1.5 py-0.5 rounded">RECOMMENDED</span>
              </div>
              <pre className="text-2xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-x-auto leading-relaxed">
{`[
  {
    "studentName": "John Doe",
    "studentId": "WEB13-0001",
    "email": "john@gmail.com",
    "liveUrl": "https://johndoe.github.io/app",
    "githubUrl": "https://github.com/johndoe/app",
    "assignmentNo": 1
  }
]`}
              </pre>
              <p className="text-3xs text-slate-400 font-medium">
                All fields optional except <code className="bg-slate-100 px-1 rounded">liveUrl</code> and <code className="bg-slate-100 px-1 rounded">githubUrl</code>
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-2xs font-semibold text-amber-800">
              💡 <strong>assignmentNo</strong> auto-matches each student to the correct assignment spec. Without it, you must select the assignment from the dropdown above before running.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
