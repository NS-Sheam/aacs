'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Globe, GitFork, Loader2, CheckCircle2, XCircle, ChevronLeft,
  RefreshCw, AlertTriangle, Layers, Calendar, ExternalLink,
  Clock, Award, AlertCircle, Camera, Tag
} from 'lucide-react'
import { getSubmissionResults, recheckSubmission, apiFetch } from '../../lib/api'
import ProgressBar from '@/components/ProgressBar'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function SubmissionDetailsPage() {
  const params = useParams()
  const id = params?.id as string

  const [step, setStep] = useState<'results' | 'checking'>('results')
  const [submission, setSubmission] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rechecking, setRechecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showScreenshot, setShowScreenshot] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('all')

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const subData = await apiFetch<{ success: boolean; data: any }>(`/api/v1/submissions/${id}`)
      if (!subData?.data) throw new Error('Submission not found')
      setSubmission(subData.data)

      if (subData.data.status === 'queued' || subData.data.status === 'running') {
        setStep('checking')
        setLoading(false)
        return
      }

      const resultsData = await getSubmissionResults(id)
      setResults(resultsData)
      setStep('results')
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submission')
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const handleRecheck = async () => {
    setRechecking(true)
    setError(null)
    try {
      await recheckSubmission(id)
      setStep('checking')
      setResults([])
      setSubmission((s: any) => ({ ...s, status: 'queued' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate recheck')
    } finally {
      setRechecking(false)
    }
  }

  const handleCheckingComplete = useCallback(() => {
    setTimeout(() => loadData(), 500)
  }, [loadData])

  // Group results by section
  const resultsBySection = results.reduce((acc: Record<string, any[]>, item: any) => {
    const sec = item.section || 'General'
    if (!acc[sec]) acc[sec] = []
    acc[sec].push(item)
    return acc
  }, {})

  const sections = ['all', ...Object.keys(resultsBySection)]

  const passCount = results.filter(r => r.status === 'pass' || r.correct === true).length
  const failCount = results.filter(r => r.status === 'fail' && r.status !== 'needsReview').length
  const reviewCount = results.filter(r => r.status === 'needsReview').length

  const filteredResults = activeSection === 'all'
    ? results
    : resultsBySection[activeSection] || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="text-slate-500 font-medium">Loading submission details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* ---- CHECKING STEP ---- */}
        {step === 'checking' && (
          <div className="rounded-2xl border bg-white p-8 shadow-sm max-w-xl mx-auto my-12">
            <div className="text-center mb-8">
              <div className="h-16 w-16 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Automated Checks Running</h2>
              <p className="text-slate-500 text-sm mt-1">Playwright is evaluating the live site against assignment criteria</p>
            </div>
            <ProgressBar submissionId={id} onComplete={handleCheckingComplete} />
          </div>
        )}

        {/* ---- RESULTS STEP ---- */}
        {step === 'results' && submission && (
          <div className="space-y-6">

            {/* Header Card */}
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
              <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-slate-900">
                      {submission.studentName || 'Anonymous Student'}
                    </h1>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wide ${
                      submission.status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' :
                      submission.status === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                      submission.status === 'running' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                      'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      {submission.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                      {submission.status === 'error' && <XCircle className="h-3 w-3" />}
                      {submission.status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
                      {submission.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-500">
                    <a href={submission.liveUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-blue-600 transition-colors font-mono text-xs truncate max-w-xs">
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{submission.liveUrl}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-blue-600 transition-colors font-mono text-xs truncate max-w-xs">
                      <GitFork className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{submission.githubUrl}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    <span className="flex items-center gap-1.5 text-xs">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(submission.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Score + Actions */}
                <div className="flex items-center gap-4 shrink-0">
                  {submission.status === 'completed' && (
                    <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl px-6 py-3">
                      <Award className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <span className="text-3xl font-black text-blue-700 block leading-none">
                        {submission.totalScore}
                      </span>
                      <span className="text-xs text-blue-500 font-semibold">/ {submission.maxScore} pts</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleRecheck}
                      disabled={rechecking}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-2 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-blue-300 transition shadow-sm disabled:opacity-50"
                    >
                      {rechecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 text-blue-600" />}
                      Re-run Checks
                    </button>
                    <button
                      onClick={() => setShowScreenshot(s => !s)}
                      className={`flex items-center gap-2 rounded-xl py-2 px-4 text-sm font-semibold transition shadow-sm border ${
                        showScreenshot
                          ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-blue-300'
                      }`}
                    >
                      <Camera className={`h-4 w-4 ${showScreenshot ? 'text-white' : 'text-blue-600'}`} />
                      {showScreenshot ? 'Hide Screenshot' : 'Inspect Design'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Stats Bar */}
              {results.length > 0 && (
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-t bg-slate-50/50">
                  <div className="text-center py-3">
                    <div className="text-lg font-bold text-green-600">{passCount}</div>
                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Passed</div>
                  </div>
                  <div className="text-center py-3">
                    <div className="text-lg font-bold text-red-500">{failCount}</div>
                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Failed</div>
                  </div>
                  <div className="text-center py-3">
                    <div className="text-lg font-bold text-amber-500">{reviewCount}</div>
                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Needs Review</div>
                  </div>
                </div>
              )}
            </div>

            {/* Screenshot Inspector */}
            {showScreenshot && (
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900">Playwright Screenshot Evidence</h3>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-semibold">
                    Captured at evaluation time
                  </span>
                </div>
                <div className="p-4 bg-slate-900 max-h-[60vh] overflow-y-auto">
                  <img
                    src={`${API_URL}/screenshots/${id}_base.png`}
                    alt="Page screenshot"
                    className="w-full h-auto rounded-lg shadow-2xl"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                      const p = document.createElement('p');
                      p.className = 'text-slate-400 text-center py-8 text-sm';
                      p.textContent = 'Screenshot not available for this submission';
                      e.currentTarget.parentElement?.appendChild(p);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error Info */}
            {submission.status === 'error' && submission.errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <h3 className="font-bold text-red-900 flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-red-600" /> Checker Error
                </h3>
                <pre className="text-xs text-red-800 bg-white p-4 border border-red-100 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                  {submission.errorMessage}
                </pre>
              </div>
            )}

            {/* Section Tabs */}
            {results.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {sections.map(sec => (
                  <button
                    key={sec}
                    onClick={() => setActiveSection(sec)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition border ${
                      activeSection === sec
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    <span className="capitalize">{sec === 'all' ? `All (${results.length})` : `${sec} (${resultsBySection[sec]?.length || 0})`}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Results Grid */}
            {filteredResults.length > 0 && (
              <div className="grid gap-3">
                {filteredResults.map((item: any) => {
                  const isPass = item.status === 'pass'
                  const isReview = item.status === 'needsReview'
                  const isFail = !isPass && !isReview

                  return (
                    <div key={item._id}
                      className={`rounded-xl border bg-white p-5 flex items-start gap-4 transition hover:shadow-sm ${
                        isPass ? 'border-l-4 border-l-green-400' :
                        isReview ? 'border-l-4 border-l-amber-400' :
                        'border-l-4 border-l-red-400'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isPass ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : isReview ? (
                          <AlertTriangle className="h-6 w-6 text-amber-500" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-slate-900 text-sm">{item.description}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            isPass ? 'bg-green-50 text-green-700 border-green-200' :
                            isReview ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {item.status}
                          </span>
                          {item.marks > 0 && (
                            <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-mono">
                              {item.marks} pt{item.marks !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" /> {item.section}
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" /> {item.reqKey}
                          </span>
                        </div>

                        {item.message && (
                          <p className={`text-xs font-mono px-3 py-2 rounded-lg border ${
                            isPass
                              ? 'bg-green-50/50 border-green-100 text-green-800'
                              : isReview
                              ? 'bg-amber-50/50 border-amber-100 text-amber-800'
                              : 'bg-red-50/50 border-red-100 text-red-800'
                          }`}>
                            {item.message}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <div className={`text-lg font-black ${
                          isPass ? 'text-green-600' : isReview ? 'text-amber-500' : 'text-red-500'
                        }`}>
                          {isPass ? `+${item.marks || 1}` : '0'}
                        </div>
                        <div className="text-xs text-slate-400">pts</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {results.length === 0 && submission.status === 'completed' && (
              <div className="rounded-2xl border bg-white p-12 text-center text-slate-500">
                <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="font-medium">No check results found for this submission.</p>
                <p className="text-sm mt-1">Try re-running the checks.</p>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}