import Link from "next/link";
import { Eye, ShieldAlert } from "lucide-react";

import { getSubmissionsByAssignmentId } from "@/app/lib/api";
import Pagination from "./pagination";
import StatusBadge from "@/components/StatusBadge";

interface Submission {
  _id: string;
  studentName?: string;
  liveUrl: string;
  githubUrl: string;
  status: string;
  totalScore?: number;
  maxScore?: number;
  autoCommitted?: number;
  flagged?: number;
  createdAt: string;
}

export default async function SubmissionListPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  const { id } = await params;
  const {page}=await searchParams;

   const res = await getSubmissionsByAssignmentId(id, Number(page) || 1, 10);


  const submissions = res?.data?.submissions ?? [];

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Assignment Submissions
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {res?.data?.total ?? 0} submissions
          </p>
        </div>

        <Link href={`/submissions/new?assignmentId=${id}`}>
          <button className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
            + Add Submission
          </button>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-[2.8fr_120px_90px_90px_120px_180px] bg-gray-50 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <span>Student</span>
          <span>Score</span>
          <span>Auto</span>
          <span>Flags</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Empty */}
        {submissions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-5xl">📄</div>

            <h3 className="mt-4 text-lg font-semibold">
              No submissions yet
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Students haven&lsquo;t submitted this assignment.
            </p>
          </div>
        )}

        {/* Rows */}
        {submissions.map((sub: Submission) => {
          const percentage =
            sub.totalScore != null && sub.maxScore
              ? (sub.totalScore / sub.maxScore) * 100
              : null;

          return (
            <div
              key={sub._id}
              className="grid grid-cols-[2.8fr_120px_90px_90px_120px_180px] items-center border-t px-6 py-5 transition hover:bg-gray-50"
            >
              {/* Student */}
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
                  {(sub.studentName ?? "?").charAt(0).toUpperCase()}
                </div>

                <div>
                  <p className="font-medium text-gray-900">
                    {sub.studentName ?? "Unknown Student"}
                  </p>

                  <p className="max-w-sm truncate text-xs text-gray-500">
                    {sub.liveUrl}
                  </p>
                </div>
              </div>

              {/* Score */}
              <div>
                {percentage !== null ? (
                  <span
                    className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                      percentage >= 80
                        ? "bg-green-100 text-green-700"
                        : percentage >= 50
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {sub.totalScore}/{sub.maxScore}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>

              {/* Auto */}
              <div className="font-medium text-gray-700">
                {sub.autoCommitted ?? 0}
              </div>

              {/* Flags */}
              <div>
                {sub.flagged ? (
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                    {sub.flagged}
                  </span>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </div>

              {/* Status */}
              <div>
                <StatusBadge status={sub.status} size="sm" />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Link href={`/submissions/${sub._id}`}>
                  <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium transition hover:bg-gray-100">
                    <Eye size={14} />
                    Results
                  </button>
                </Link>

                {sub.flagged! > 0 && (
                  <Link href={`/review?submissionId=${sub._id}`}>
                    <button className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800 transition hover:bg-amber-200">
                      <ShieldAlert size={14} />
                      Review
                    </button>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <Pagination
        page={res?.data?.page ?? 1}
        totalPages={res?.data?.totalPages ?? 1}
      />
    </div>
  );
}