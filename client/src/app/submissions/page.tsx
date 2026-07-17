import Link from 'next/link'
import { Eye, ClipboardList, Calendar, User } from 'lucide-react'
import { getAllSubmissions } from '@/app/lib/api'
import StatusBadge from '@/components/StatusBadge'

interface SubmissionItem {
  _id: string
  studentName?: string
  studentEmail?: string
  liveUrl: string
  githubUrl: string
  status: string
  totalScore?: number
  maxScore?: number
  createdAt: string
  assignmentId?: {
    _id: string
    title: string
    assignmentNo: number
    batch: number
  }
}

export default async function SubmissionsPage() {
  let submissions: SubmissionItem[] = []
  try {
    const res = await getAllSubmissions()
    submissions = res?.data || []
  } catch (err) {
    console.error('Error loading submissions:', err)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Submissions Log</h1>
          <p className="mt-1 text-sm text-slate-500">
            A comprehensive history of all student assignment evaluations.
          </p>
        </div>

        {/* List of submissions */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="grid grid-cols-[2fr_2fr_100px_100px_120px_100px] bg-slate-50 px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <span>Student</span>
            <span>Assignment</span>
            <span>Score</span>
            <span>Status</span>
            <span>Date</span>
            <span className="text-right">Action</span>
          </div>

          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ClipboardList className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No submissions found</h3>
              <p className="text-xs text-slate-400 mt-1">No evaluations have been processed yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {submissions.map((sub) => {
                const percentage =
                  sub.totalScore != null && sub.maxScore
                    ? (sub.totalScore / sub.maxScore) * 100
                    : null
                const formattedDate = new Date(sub.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })

                return (
                  <div
                    key={sub._id}
                    className="grid grid-cols-[2fr_2fr_100px_100px_120px_100px] items-center px-6 py-4 hover:bg-slate-50/40 transition-colors"
                  >
                    {/* Student */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-semibold text-sm border border-blue-100">
                        <User size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">
                          {sub.studentName || 'Unknown Student'}
                        </p>
                        {sub.studentEmail && (
                          <p className="text-xs text-slate-400 truncate">{sub.studentEmail}</p>
                        )}
                      </div>
                    </div>

                    {/* Assignment */}
                    <div className="min-w-0 pr-4">
                      {sub.assignmentId ? (
                        <Link href={`/assignments/${sub.assignmentId._id}`} className="hover:text-blue-500 transition-colors">
                          <p className="font-semibold text-slate-800 text-sm truncate">
                            A{sub.assignmentId.assignmentNo}: {sub.assignmentId.title}
                          </p>
                          <p className="text-[10px] text-slate-400">Batch {sub.assignmentId.batch}</p>
                        </Link>
                      ) : (
                        <p className="text-slate-400 text-xs">—</p>
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

                    {/* Date */}
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar size={12} className="text-slate-300" />
                      {formattedDate}
                    </div>

                    {/* Action */}
                    <div className="flex justify-end">
                      <Link href={`/submissions/${sub._id}`}>
                        <button className="inline-flex items-center gap-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                          <Eye size={12} />
                          Details
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
      </div>
    </div>
  )
}