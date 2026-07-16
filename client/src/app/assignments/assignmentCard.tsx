/* eslint-disable @typescript-eslint/no-explicit-any */
import StatusBadge from '@/components/StatusBadge'
import { Sigma, ExternalLink, Plus, Check } from 'lucide-react'
import { getTotalRequirements } from '../lib/utils'
import Link from 'next/link'
import { Assignment } from '@/types'



export default function AssignmentCard({
  _id,
  batch,
  assignmentNo,
  title,
  status,
  figmaUrl,
  originalRequirements,
  updatedAt,
  submissionCount = 0,
  version=1,
}: Assignment) {
  const totalRequirements=getTotalRequirements(originalRequirements)

  const updatedDate = new Date(updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const assignmentLabel = `A${assignmentNo}`

  return (
    <div className="group relative mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-2xl">

  {/* Top Accent */}
  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600" />

  {/* Header */}
  <div className="flex items-start justify-between">

    <div className="flex items-start gap-4">

      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold text-white shadow-lg shadow-blue-200">
        {assignmentLabel}
      </div>

      <div>

        <div className="flex items-center gap-2 flex-wrap">

          <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-600">
            {title}
          </h3>

          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            Version {version}
          </span>

        </div>

        <p className="mt-1 text-sm text-slate-500">
          Batch <span className="font-medium text-slate-700">{batch}</span>
          <span className="mx-2">•</span>
          {totalRequirements} Requirements
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Updated {updatedDate}
        </p>

      </div>

    </div>

    <StatusBadge
      status={status}
      size="sm"
    />

  </div>

  {/* Tags */}
  <div className="mt-6 flex flex-wrap items-center gap-2">

    {figmaUrl && (
      <a
        href={figmaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
      >
        <Sigma className="h-3.5 w-3.5" />
        Figma
      </a>
    )}

    <span
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
        status === "active"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : status === "draft"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>

  </div>

  {/* Stats */}
  <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">

    <div>
      <p className="text-xs uppercase tracking-wider text-slate-400">
        Submissions
      </p>

      <div className="mt-2 flex items-center gap-2">

        <span className="text-3xl font-bold text-slate-900">
          {submissionCount}
        </span>

        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="h-2 w-2 rounded-full bg-red-500" />
        </div>

      </div>

    </div>

    <div>
      <p className="text-xs uppercase tracking-wider text-slate-400">
        Requirements
      </p>

      <h2 className="mt-2 text-3xl font-bold text-slate-900">
        {totalRequirements}
      </h2>
    </div>

    <div>
      <p className="text-xs uppercase tracking-wider text-slate-400">
        Version
      </p>

      <h2 className="mt-2 text-3xl font-bold text-blue-600">
        {version}
      </h2>
    </div>

  </div>

  {/* Footer */}
  <div className="mt-6 flex items-center gap-3">

    <Link href={`/submissions/new?assignmentId=${_id}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg">
      <Plus className="h-4 w-4" />
      Add Submission
    </Link>

    <button className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600">
      <Check className="h-5 w-5" />
    </button>

    <Link href={`/assignments/${_id}`} className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600">
      <ExternalLink className="h-5 w-5" />
    </Link>

  </div>

</div>
  )
}
