'use client'

import { useEffect, useState } from 'react'
import { PlayCircle, Globe, GitFork, User, ArrowRight, Loader2, CheckCircle2, XCircle, ChevronLeft, RefreshCw, AlertTriangle, Layers } from 'lucide-react'
import { fetchAssignmentsList, submitStudentSubmission, getSubmissionResults, CreateSubmissionDTO } from '../lib/api'
import { Assignment, Requirement } from '@/types'
import ProgressBar from '@/components/ProgressBar'

export default function SubmissionsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')

  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [step, setStep] = useState<'form' | 'checking' | 'results'>('form')
  const [results, setResults] = useState<any[]>([])
  const [submissionMeta, setSubmissionMeta] = useState<any>(null)

  const [loadingAssignments, setLoadingAssignments] = useState(true)
  const [loadingResults, setLoadingResults] = useState(false)
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Load assignments list for dropdown
  useEffect(() => {
    fetchAssignmentsList()
      .then((data) => {
        setAssignments(data)
        if (data.length > 0) {
          setSelectedAssignmentId(data[0]._id)
        }
        setLoadingAssignments(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch assignments')
        setLoadingAssignments(false)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors([])
    setError(null)

    const errs: string[] = []
    if (!selectedAssignmentId) errs.push('Please select an assignment')
    if (!studentName.trim()) errs.push('Student Name is required')
    if (!studentId.trim()) errs.push('Student ID is required (e.g. WEB13-0001)')
    if (!studentEmail.trim()) errs.push('Student Email is required')
    if (!liveUrl.trim().startsWith('http')) errs.push('Live Link must start with http:// or https://')
    if (!githubUrl.trim().includes('github.com')) errs.push('GitHub Link must be a valid github.com repository URL')

    if (errs.length > 0) {
      setFormErrors(errs)
      return
    }

    try {
      const payload: CreateSubmissionDTO = {
        assignmentId: selectedAssignmentId,
        studentName: studentName.trim(),
        studentId: studentId.trim(),
        email: studentEmail.trim(),
        liveUrl: liveUrl.trim(),
        githubUrl: githubUrl.trim(),
      }
      const response = await submitStudentSubmission(payload)
      setSubmissionId(response.submissionId)
      setStep('checking')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    }
  }

  // Load detailed results once checks are complete
  const handleCheckingComplete = async () => {
    if (!submissionId) return
    setLoadingResults(true)
    try {
      // 1. Fetch results list
      const data = await getSubmissionResults(submissionId)
      setResults(data)

      // 2. Fetch submission metadata (e.g. score)
      const subResponse = await fetch(`/api/v1/submissions/${submissionId}`)
      if (subResponse.ok) {
        const subData = await subResponse.json()
        setSubmissionMeta(subData.data)
      }
      setStep('results')
      setLoadingResults(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results')
      setLoadingResults(false)
    }
  }

  const resetForm = () => {
    setStudentName('')
    setLiveUrl('')
    setGithubUrl('')
    setSubmissionId(null)
    setResults([])
    setSubmissionMeta(null)
    setStep('form')
    setFormErrors([])
    setError(null)
  }

  // Group requirements by section
  const resultsBySection = results.reduce((acc: Record<string, any[]>, item: any) => {
    const sec = item.section || 'General'
    if (!acc[sec]) acc[sec] = []
    acc[sec].push(item)
    return acc;
  }, {})

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="flex-1 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <PlayCircle className="h-8 w-8 text-blue-600 animate-pulse" /> Submit & Check
            </h1>
            <p className="text-slate-600 mt-2">Test your code repositories and get automated check scores instantly</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">System Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Form Step */}
          {step === 'form' && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-6">
              {loadingAssignments ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                  <p>Loading assignments...</p>
                </div>
              ) : assignments.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                  <p className="font-medium text-slate-700">No Assignments Available</p>
                  <p className="text-sm">Please register/upload an assignment config first.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Select Assignment */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Select Assignment
                    </label>
                    <select
                      value={selectedAssignmentId}
                      onChange={(e) => setSelectedAssignmentId(e.target.value)}
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      {assignments.map((a) => (
                        <option key={a._id} value={a._id}>
                          Batch {a.batch} — {a.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Student Name */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Student Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Student ID */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Student ID <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. WEB13-0001"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Student Email */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Student Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. john@gmail.com"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Live Link */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Live Deployment Link <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="https://nasrinrahman19924.github.io/My-first-assignment01"
                        value={liveUrl}
                        onChange={(e) => setLiveUrl(e.target.value)}
                        className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* GitHub Link */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      GitHub Repository Link <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <GitFork className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="https://github.com/nasrinrahman19924/My-first-assignment01"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Validation Summary */}
                  {formErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <ul className="space-y-1">
                        {formErrors.map((err, idx) => (
                          <li key={idx} className="text-sm text-red-700">
                            • {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full flex justify-center items-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition"
                  >
                    Run Automated Checker <ArrowRight className="h-5 w-5" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Checking / Polling Step */}
          {step === 'checking' && submissionId && (
            <div className="rounded-2xl border bg-white p-8 shadow-sm max-w-xl mx-auto">
              <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Checker Running</h2>
              <ProgressBar
                submissionId={submissionId}
                onComplete={handleCheckingComplete}
              />
            </div>
          )}

          {/* Detailed Results Step */}
          {step === 'results' && (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="rounded-xl border bg-white p-6 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg text-slate-900">
                    Results: {submissionMeta?.studentName || 'Student Submission'}
                  </h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                    <span>Status: <strong className="text-slate-700 capitalize">{submissionMeta?.status}</strong></span>
                    <span>•</span>
                    <span>Github: <a href={submissionMeta?.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link</a></span>
                    <span>•</span>
                    <span>Live URL: <a href={submissionMeta?.liveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link</a></span>
                  </div>
                </div>

                {submissionMeta && (
                  <div className="text-right">
                    <span className="text-sm text-slate-500">Total Score</span>
                    <div className="text-3xl font-extrabold text-blue-600">
                      {submissionMeta.totalScore} / {submissionMeta.maxScore}
                    </div>
                  </div>
                )}
              </div>

              {/* Requirement Section Checks */}
              {loadingResults ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                  <p>Fetching evaluation logs...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(resultsBySection).map(([sectionName, items]) => (
                    <div key={sectionName} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                      <div className="flex items-center gap-2 border-b bg-slate-50 px-6 py-4">
                        <Layers className="h-4 w-4 text-slate-500" />
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-700">
                          {sectionName}
                        </h3>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {items.map((item: any) => {
                          const isPass = item.status === 'pass' || item.correct === true
                          const isFail = item.status === 'fail' || item.correct === false
                          const isReview = item.status === 'needsReview'

                          return (
                            <div key={item._id} className="p-6 flex items-start gap-4 hover:bg-slate-50/50">
                              <div className="mt-0.5">
                                {isPass ? (
                                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                                ) : isFail ? (
                                  <XCircle className="h-6 w-6 text-red-500" />
                                ) : (
                                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-800">
                                    {item.reqKey} (Weight: {item.number || 1})
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                    isPass ? 'bg-green-50 border-green-200 text-green-700' :
                                    isFail ? 'bg-red-50 border-red-200 text-red-700' :
                                    'bg-amber-50 border-amber-200 text-amber-700'
                                  }`}>
                                    {item.status || (item.correct ? 'pass' : 'fail')}
                                  </span>
                                </div>
                                <p className="text-slate-600 text-sm mt-1">{item.description}</p>
                                {item.message && (
                                  <p className={`text-xs mt-2 font-mono p-2 border rounded-lg ${
                                    isPass ? 'bg-green-50/30 border-green-100 text-green-800' : 'bg-red-50/30 border-red-100 text-red-800'
                                  }`}>
                                    {item.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 max-w-md mx-auto">
                <button
                  onClick={resetForm}
                  className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition"
                >
                  <RefreshCw className="h-4 w-4" /> Submit Another Submission
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}