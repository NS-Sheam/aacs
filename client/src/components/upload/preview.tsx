'use client'

import { CheckCircle2, XCircle, FileJson } from 'lucide-react'
import { AssignmentJSON } from '@/types'

interface Props {
  assignment: AssignmentJSON
}

export default function AssignmentPreview({ assignment }: Props) {
  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-3">
            <FileJson className="h-6 w-6 text-blue-600" />
          </div>

          <div>
            <h2 className="font-semibold text-lg">
              Assignment Preview
            </h2>

            <p className="text-sm text-slate-500">
              Review before submitting
            </p>
          </div>
        </div>
      </div>

      {/* Preview Card */}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">

        <div className="grid grid-cols-12 bg-slate-50 px-6 py-4 font-semibold text-sm">

         

          <div className="col-span-5">
            Description
          </div>

          <div className="col-span-2 text-center">
            Correct
          </div>

          <div className="col-span-4">
            Message
          </div>

        </div>

        <div className="grid grid-cols-12 items-center px-6 py-5 border-t">

         

          <div className="col-span-5">

            <p className="font-medium">
              {assignment.description}
            </p>

          </div>

          <div className="col-span-2 flex justify-center">

            {assignment.correct ? (
              <CheckCircle2 className="text-green-600 h-6 w-6" />
            ) : (
              <XCircle className="text-red-600 h-6 w-6" />
            )}

          </div>

          <div className="col-span-4">

            <p className="text-sm text-slate-500">
              {assignment.message}
            </p>

          </div>

        </div>

      </div>
    </div>
  )
}