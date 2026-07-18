'use client'

import { FileJson, Layers, Link as LinkIcon, CheckCircle2, XCircle } from 'lucide-react'
import { AssignmentJSON } from '@/types'

interface Props {
  assignment: AssignmentJSON
}

export default function AssignmentPreview({ assignment }: Props) {
  const sections = Object.entries(assignment.originalRequirements || {})

  return (
    <div className="space-y-6">
      {/* Header / Summary Card */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-blue-100 p-3">
            <FileJson className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-lg text-slate-900">
              Assignment Preview: {assignment.title || 'Untitled Assignment'}
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
              <span>Batch: <strong className="text-slate-700">{assignment.batch}</strong></span>
              <span>•</span>
              <span>Assignment No: <strong className="text-slate-700">{assignment.assignmentNo}</strong></span>
              {assignment.figmaUrl && (
                <>
                  <span>•</span>
                  <a
                    href={assignment.figmaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <LinkIcon className="h-3.5 w-3.5" /> Figma Design Link
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sections & Requirements List */}
      <div className="space-y-4">
        {sections.length > 0 ? (
          sections.map(([sectionName, reqs]) => {
            const reqEntries = Object.entries(reqs || {})
            return (
              <div key={sectionName} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                {/* Section Header */}
                <div className="flex items-center gap-2 border-b bg-slate-50 px-6 py-4">
                  <Layers className="h-4 w-4 text-slate-500" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-700">
                    {sectionName}
                  </h3>
                  <span className="ml-auto rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {reqEntries.length} Requirements
                  </span>
                </div>

                {/* Requirements Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50/50 text-slate-500 font-medium">
                        <th className="px-6 py-3 w-16">Key</th>
                        <th className="px-6 py-3 w-20 text-center">Marks</th>
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3 w-24 text-center">Default</th>
                        <th className="px-6 py-3">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reqEntries.map(([reqKey, req]) => (
                        <tr key={reqKey} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-semibold text-slate-700">
                            {reqKey}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-900">
                            {req.number}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {req.description}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              {req.correct ? (
                                <CheckCircle2 className="text-emerald-600 h-5 w-5" />
                              ) : (
                                <XCircle className="text-red-500 h-5 w-5" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400 italic">
                            {req.message || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-xl border border-dashed bg-slate-50 p-12 text-center">
            <p className="text-slate-500">No requirements found in the uploaded JSON.</p>
          </div>
        )}
      </div>
    </div>
  )
}