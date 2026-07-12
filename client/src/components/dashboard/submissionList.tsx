'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getStatusColor } from '@/app/lib/getStatusColor'

const submissions = [
  {
    id: 1,
    studentName: "Alice",
    assignmentTitle: "Assignment 1",
    createdAt: "2023-08-01 10:00",
    status: "completed",
    score: 85,
    maxScore: 100,
    passedChecks: 8,
    totalChecks: 10,
  },
    {
    id: 2,
    studentName: "Bob",
    assignmentTitle: "Assignment 1",
    createdAt: "2023-08-01 10:00",
    status: "running",
    score: 0,
    maxScore: 100,
    passedChecks: 0,
    totalChecks: 0,
  },
  { 
    id: 3,  
    studentName: "Charlie",
    assignmentTitle: "Assignment 1",
    createdAt: "2023-08-01 10:00",
    status: "queued",
    score: 0,
    maxScore: 100,
    passedChecks: 0,
    totalChecks: 0, 
    },
    {
    id: 4,  
    studentName: "David",
    assignmentTitle: "Assignment 1",
    createdAt: "2023-08-01 10:00",
    status: "error",
    score: 0,
    maxScore: 100,
    passedChecks: 0,
    totalChecks: 0, 
    },
]



export function SubmissionsList() {
 

  return (
    <div className="space-y-2">
      {submissions.map((submission) => (
        <Link
          key={submission.id}
          href={`/submissions/${submission.id}`}
          className="group flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-2">
              <h3 className="font-semibold text-slate-900 truncate">{submission.studentName}</h3>
              {getStatusColor(submission.status) && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(submission.status)}`}>
                  {submission.status}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>{submission.assignmentTitle}</span>
              <span className="text-xs text-slate-500">{(submission.createdAt)}</span>
            </div>
          </div>

          {submission.status === 'completed' && (
            <div className="flex items-center gap-4 ml-4">
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900">
                  {submission.score}/{submission.maxScore}
                </div>
                <div className="text-xs text-slate-500">
                  {submission.passedChecks}/{submission.totalChecks} passed
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
          )}

          {submission.status !== 'completed' && (
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors ml-4" />
          )}
        </Link>
      ))}
    </div>
  )
}
