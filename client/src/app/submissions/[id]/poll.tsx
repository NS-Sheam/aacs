"use client";

import { getSubmissionStatus } from "@/app/lib/api";
import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Trophy,
} from "lucide-react";

interface StatusData {
  status: string;
  progress: {
    completedChecks: number;
    totalChecks: number;
  };
  totalScore?: number;
  maxScore?: number;
  errorMessage?: string;
}

export default function Poll({ id }: { id: string }) {
  const [data, setData] = useState<StatusData | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await getSubmissionStatus(id);
        setData(res?.data || null);

        if (
          res?.data?.status === "completed" ||
          res?.data?.status === "error"
        ) {
          setDone(true);
        }
      } catch (err) {
        console.error(err);
      }
    };

    poll();

    const interval = setInterval(() => {
      if (!done) poll();
    }, 3000);

    return () => clearInterval(interval);
  }, [id, done]);

  const pct = data?.progress?.totalChecks
    ? Math.round(
        (data.progress.completedChecks / data.progress.totalChecks) * 100
      )
    : 0;

  const statusStyle = {
    queued: {
      color: "bg-gray-100 text-gray-700",
      icon: <Clock3 className="w-4 h-4" />,
    },
    running: {
      color: "bg-blue-100 text-blue-700",
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
    },
    completed: {
      color: "bg-green-100 text-green-700",
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    error: {
      color: "bg-red-100 text-red-700",
      icon: <AlertCircle className="w-4 h-4" />,
    },
  };

  const current =
    statusStyle[data?.status as keyof typeof statusStyle] ||
    statusStyle.queued;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="border-b border-slate-100 px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Submission Review
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your submission is being analyzed. This usually takes a few moments.
          </p>
        </div>

        {!data ? (
          <div className="py-16 flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="mt-4 text-slate-500">Loading submission...</p>
          </div>
        ) : (
          <div className="p-8 space-y-8">

            {/* Progress Circle */}
            <div className="flex flex-col items-center">

              <div className="relative h-36 w-36">

                <svg className="-rotate-90deg" viewBox="0 0 120 120">

                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />

                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="url(#grad)"
                    strokeWidth="8"
                    strokeDasharray={327}
                    strokeDashoffset={327 - (327 * pct) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />

                  <defs>
                    <linearGradient id="grad">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{pct}%</span>
                  <span className="text-xs text-slate-500">
                    Complete
                  </span>
                </div>

              </div>

            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium ${current.color}`}
              >
                {current.icon}
                <span className="capitalize">{data.status}</span>
              </div>
            </div>

            {/* Progress */}
            <div>

              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Progress</span>
                <span className="font-semibold">
                  {data.progress.completedChecks} /{" "}
                  {data.progress.totalChecks}
                </span>
              </div>

              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-blue-500 to-cyan-500 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>

            </div>

            {/* Score */}
            {data.totalScore !== undefined && (
              <div className="rounded-2xl bg-linear-to-r from-emerald-500 to-green-600 text-white p-5 flex justify-between items-center shadow-lg">

                <div>
                  <p className="text-sm opacity-80">Final Score</p>
                  <h2 className="text-3xl font-bold">
                    {data.totalScore}
                    <span className="text-lg opacity-80">
                      {" "}
                      / {data.maxScore}
                    </span>
                  </h2>
                </div>

                <Trophy className="w-10 h-10 opacity-80" />

              </div>
            )}

            {/* Success */}
            {done && data.status === "completed" && (
              <div className="rounded-2xl bg-green-50 border border-green-200 p-5 flex gap-4 items-start">

                <CheckCircle2 className="text-green-600 w-6 h-6" />

                <div>
                  <h3 className="font-semibold text-green-800">
                    Review Complete
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    All automated checks have finished successfully.
                  </p>
                </div>

              </div>
            )}

            {/* Error */}
            {done && data.status === "error" && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-5 flex gap-4 items-start">

                <AlertCircle className="text-red-600 w-6 h-6" />

                <div>
                  <h3 className="font-semibold text-red-700">
                    Review Failed
                  </h3>
                  <p className="text-sm text-red-600 mt-1">
                    {data.errorMessage || "Something went wrong."}
                  </p>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}