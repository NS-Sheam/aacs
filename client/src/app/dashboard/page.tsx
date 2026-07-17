'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, CheckCircle2, AlertCircle, XCircle, RefreshCw, Loader2, BarChart3, TrendingUp, Sparkles, Award } from 'lucide-react'
import StatsCard from "@/components/dashboard/statsCard"
import { SubmissionsList } from "@/components/dashboard/submissionList"
import { fetchDashboardStats, fetchSubmissionsList } from "../lib/api"

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, autoChecked: 0, needsReview: 0, failed: 0 })
  const [submissions, setSubmissions] = useState<any[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, statsSetError] = useState<string | null>(null)

  const loadStats = async () => {
    try {
      const [statsData, subsData] = await Promise.all([
        fetchDashboardStats(),
        fetchSubmissionsList()
      ])
      setStats(statsData)
      setSubmissions(subsData)
      statsSetError(null)
    } catch (err) {
      statsSetError(err instanceof Error ? err.message : 'Failed to load dashboard metrics')
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 10000)
    return () => clearInterval(interval)
  }, [])

  // Calculate statistics analytics for Feature 3
  const completedSubs = submissions.filter(s => s.status === 'completed')
  
  // Calculate average class score
  const avgScore = completedSubs.length > 0
    ? (completedSubs.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / completedSubs.length).toFixed(1)
    : '0.0'

  // Calculate highest score in class
  const maxClassScore = completedSubs.length > 0
    ? Math.max(...completedSubs.map(s => s.totalScore || 0))
    : 0

  // Calculate pass rates (score >= 30 out of 60)
  const passRate = completedSubs.length > 0
    ? Math.round((completedSubs.filter(s => (s.totalScore || 0) >= 30).length / completedSubs.length) * 100)
    : 0

  // Score distribution ranges (Histogram segments)
  const scoreBuckets = {
    excellent: completedSubs.filter(s => (s.totalScore || 0) >= 50).length, // 50-60
    good: completedSubs.filter(s => (s.totalScore || 0) >= 35 && (s.totalScore || 0) < 50).length, // 35-49
    average: completedSubs.filter(s => (s.totalScore || 0) >= 20 && (s.totalScore || 0) < 35).length, // 20-34
    belowAverage: completedSubs.filter(s => (s.totalScore || 0) < 20).length, // 0-19
  }

  return (
    <main className="pt-8 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Dashboard</h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">Real-time assignment submission tracking and automated checking status</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/bulk-submit" className="rounded-xl bg-blue-600 text-white px-4 py-2.5 text-sm font-bold hover:bg-blue-700 transition shadow-sm">
              Run Bulk Submissions
            </Link>
            <button
              onClick={loadStats}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 transition shadow-sm"
              title="Refresh stats"
            >
              <RefreshCw className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {statsError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" /> {statsError}
          </div>
        ) : statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              label="Total Submissions"
              value={stats.total}
              icon={<Activity className="h-5 w-5" />}
              color="blue"
              description="Across all batches"
            />
            <StatsCard
              label="Auto-Checked"
              value={stats.autoChecked}
              icon={<CheckCircle2 className="h-5 w-5" />}
              color="green"
              description={stats.total > 0 ? `${Math.round((stats.autoChecked / stats.total) * 100)}% completed` : "0% completed"}
            />
            <StatsCard
              label="Needs Review"
              value={stats.needsReview}
              icon={<AlertCircle className="h-5 w-5" />}
              color="amber"
              description="Awaiting instructor approval"
            />
            <StatsCard
              label="Failed Checks"
              value={stats.failed}
              icon={<XCircle className="h-5 w-5" />}
              color="red"
              description="Require code updates"
            />
          </div>
        )}

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { href: '/review', label: 'Review Queue', color: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/75', badge: stats.needsReview > 0 ? stats.needsReview : null },
            { href: '/assignments', label: 'Browse Requirements', color: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100/75', badge: null },
            { href: '/bulk-submit', label: 'Bulk Submit Class', color: 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100/75', badge: null },
            { href: '/export', label: 'Export Scorecards', color: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100/75', badge: null },
          ].map(nav => (
            <Link key={nav.href} href={nav.href}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold transition ${nav.color}`}>
              <span>{nav.label}</span>
              {nav.badge !== null && (
                <span className="ml-2 bg-amber-500 text-white text-3xs font-extrabold rounded-full h-5 w-5 flex items-center justify-center">
                  {nav.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Feature 3: Interactive Analytics and Histograms Section */}
        {!statsLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Visual Analytics Cards */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Class Highlights</h3>
              </div>
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Average Score</div>
                  <div className="text-xl font-black text-slate-800">{avgScore} <span className="text-xs text-slate-400 font-bold">/ 60</span></div>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Top Class Score</div>
                  <div className="text-xl font-black text-blue-600 flex items-center gap-1">
                    <Award className="h-5 w-5 text-amber-500" /> {maxClassScore} <span className="text-xs text-slate-400 font-bold">/ 60</span>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pass Rate (≥30 pt)</div>
                  <div className="text-xl font-black text-emerald-600">{passRate}%</div>
                </div>
              </div>
            </div>

            {/* Score Distribution Histogram */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Score Distribution Histogram</h3>
                </div>
                <span className="text-3xs font-extrabold uppercase bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded">
                  {completedSubs.length} graded
                </span>
              </div>
              
              <div className="flex items-end justify-between h-48 pt-4 gap-4 px-2">
                {[
                  { range: '0-19 pt', val: scoreBuckets.belowAverage, label: 'Below Avg', color: 'bg-red-500 hover:bg-red-600' },
                  { range: '20-34 pt', val: scoreBuckets.average, label: 'Average', color: 'bg-amber-500 hover:bg-amber-600' },
                  { range: '35-49 pt', val: scoreBuckets.good, label: 'Good', color: 'bg-blue-500 hover:bg-blue-600' },
                  { range: '50-60 pt', val: scoreBuckets.excellent, label: 'Excellent', color: 'bg-emerald-500 hover:bg-emerald-600' },
                ].map((bar, idx) => {
                  const maxVal = Math.max(1, scoreBuckets.belowAverage, scoreBuckets.average, scoreBuckets.good, scoreBuckets.excellent)
                  const percentHeight = Math.max(6, Math.min(100, (bar.val / maxVal) * 100))
                  
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                      <span className="text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        {bar.val} students
                      </span>
                      <div className="w-full bg-slate-100 rounded-lg h-32 flex items-end overflow-hidden">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${bar.color}`}
                          style={{ height: `${percentHeight}%` }}
                        />
                      </div>
                      <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider">{bar.label}</span>
                      <span className="text-3xs font-medium text-slate-400 font-mono mt-0.5">{bar.range}</span>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}

        {/* Recent Submissions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Recent Submissions</h2>
              <p className="text-sm text-slate-500 mt-0.5 font-medium">Auto-updates in real-time via SSE streams</p>
            </div>
            <Link href="/assignments" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition">
              View all submissions →
            </Link>
          </div>
          <SubmissionsList />
        </div>
      </div>
    </main>
  )
}