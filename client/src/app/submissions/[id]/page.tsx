/* eslint-disable @typescript-eslint/no-explicit-any */
import { getResultBySubmissionId, getSubmissionById, summaryResults } from "@/app/lib/api";
import { SubmissionData, Summary } from "@/types";
import { formatDate } from "@/app/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import { GitBranch, Globe } from "lucide-react";
import Tabs from "./tabs";
import Link from "next/link";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const SubmissionDetails = async ({ params }: Props) => {
  const { id } = await params;
  const res = await getSubmissionById(id);
  const submissionDetail: SubmissionData = res?.data;
  const res1 = await summaryResults(id);
  const summary: Summary = res1?.data;
  const res2 = await getResultBySubmissionId(id);
  const result: any = res2?.data;
   const githubSection = result["GitHub"]?.[0];
  const reqSections = Object.entries(result).filter(([k]) => k !== "GitHub");
  return (
    <div className="mx-8">
      <div className=" relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 mb-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
        {/* Soft Background Accent */}
        <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-purple-100/60 blur-3xl" />

        <div className="relative">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  Submission Details
                </h1>
                <div className="md:pt-3">
              <StatusBadge
                status={
                  submissionDetail?.status === "completed"
                    ? "completed"
                    : "active"
                }
                size="lg"
              />
            </div>
              </div>

             

              <p className="mt-2 text-slate-500">
                Assignment submission overview and evaluation details
              </p>
            </div>
            <div className="flex gap-3">
              <Link href={`/export?submissionId=${id}`} className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 hover:shadow-md">
                <span>Export JSON</span>
              </Link>
              <Link href={`/review?submissionId=${id}`} className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100 hover:shadow-md">
                <span>Review Queue</span>
              </Link>
            </div>

            
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 transition hover:border-blue-200 hover:bg-blue-50/40">
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
                Student Name
              </p>

              <p className="text-xl font-semibold text-slate-900">
                {submissionDetail.studentName}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 transition hover:border-blue-200 hover:bg-blue-50/40">
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
                Submission Date
              </p>

              <p className="text-xl font-semibold text-slate-900">
                {formatDate(submissionDetail.createdAt)}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Last checked:
                <span className="ml-1 font-medium text-slate-600">
                  {formatDate(submissionDetail.updatedAt!)}
                </span>
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <a
              href={submissionDetail.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
          group flex items-center gap-4 rounded-xl
          border border-slate-200 bg-white
          p-5 shadow-sm
          transition-all duration-300
          hover:-translate-y-1
          hover:border-blue-300
          hover:shadow-lg hover:shadow-blue-100
        "
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>

              <div className="min-w-0">
                <p className="text-sm text-slate-500">Live Preview</p>

                <p className="mt-1 truncate font-semibold text-slate-900 group-hover:text-blue-600 transition">
                  {submissionDetail.liveUrl?.replace(/^https?:\/\//, "")}
                </p>
              </div>
            </a>

            <a
              href={submissionDetail.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
          group flex items-center gap-4 rounded-xl
          border border-slate-200 bg-white
          p-5 shadow-sm
          transition-all duration-300
          hover:-translate-y-1
          hover:border-purple-300
          hover:shadow-lg hover:shadow-purple-100
        "
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 border border-purple-100">
                <GitBranch className="h-6 w-6 text-purple-600" />
              </div>

              <div className="min-w-0">
                <p className="text-sm text-slate-500">GitHub Repository</p>

                <p className="mt-1 truncate font-semibold text-slate-900 group-hover:text-purple-600 transition">
                  {submissionDetail.githubUrl?.replace(
                    /^https?:\/\/github\.com\//,
                    "",
                  )}
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 mb-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-8">
        {/* Score Section */}
        <div className="relative text-center min-w-[150px] pr-8 border-r border-gray-200">
          <div className="absolute inset-0 bg-green-100/40 blur-3xl rounded-full -z-10" />

          <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Total Score
          </div>

          <div className="mt-2 text-5xl font-bold bg-gradient-to-r from-green-700 to-emerald-500 bg-clip-text text-transparent">
            {summary.totalScore}
          </div>

          <div className="mt-1 text-sm text-gray-400">
            out of {summary.maxScore}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-5 flex-1">
          {[
            {
              label: "Passed",
              value: summary.passed,
              color: "text-green-700",
              bg: "bg-green-50",
            },
            {
              label: "Failed",
              value: summary.failed,
              color: "text-red-600",
              bg: "bg-red-50",
            },
            {
              label: "Flagged",
              value: summary.flagged,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Auto Checked",
              value: summary.autoCommitted,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="group rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              

              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {s.label}
              </div>

              <div className={`mt-1 text-3xl font-bold ${s.color}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* <Poll id={id} /> */}
      <Tabs reqSections={reqSections} git={githubSection} />
    </div>
  );
};

export default SubmissionDetails;
