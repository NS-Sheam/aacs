/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Code2,
  GitBranch,
} from "lucide-react";

const GithubTab = ({ githubSection }: { githubSection: any }) => {
  const isPassed = githubSection.correct;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Top accent */}
      <div
        className={`h-1 w-full ${
          isPassed
            ? "bg-gradient-to-r from-emerald-400 to-green-600"
            : "bg-gradient-to-r from-red-400 to-rose-600"
        }`}
      />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gray-900 text-white shadow-sm">
              <GitBranch className="w-5 h-5" />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                GitHub Activity Check
              </h3>
              <p className="text-sm text-gray-500">
                Repository verification result
              </p>
            </div>
          </div>


          {/* Status */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
              isPassed
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-600"
            }`}
          >
            {isPassed ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}

            {isPassed ? "Passed" : "Failed"}
          </div>
        </div>


        {/* Message */}
        <div
          className={`rounded-xl p-4 mb-5 border ${
            isPassed
              ? "bg-emerald-50 border-emerald-100"
              : "bg-red-50 border-red-100"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck
              className={`w-4 h-4 ${
                isPassed ? "text-emerald-600" : "text-red-500"
              }`}
            />

            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Validation Result
            </span>
          </div>

          <p
            className={`text-sm ${
              isPassed ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {githubSection.message}
          </p>
        </div>


        {/* Evidence */}
        {githubSection.evidence?.selectorUsed && (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
              <Code2 className="w-4 h-4 text-gray-500" />

              <span className="text-sm font-medium text-gray-700">
                Evidence
              </span>
            </div>

            <pre className="p-4 text-xs text-gray-700 overflow-x-auto leading-relaxed">
              {(() => {
                try {
                  return JSON.stringify(
                    JSON.parse(githubSection.evidence.selectorUsed),
                    null,
                    2
                  );
                } catch {
                  return githubSection.evidence.selectorUsed;
                }
              })()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default GithubTab;