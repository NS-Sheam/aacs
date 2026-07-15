/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Copy, Check, Download, FileJson } from "lucide-react";
import { exportAssignment } from "../lib/api";
import JsonPreview from "./preview";


export default function ExportForm() {
  const [submissionId, setSubmissionId] = useState("");
  const [result, setResult] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleExport() {
    if (!submissionId.trim()) {
      setError("Please enter a submission ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
       const res = await exportAssignment(submissionId.trim());
       console.log("Export result:", res);
      setResult(res?.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyJSON() {
    await navigator.clipboard.writeText(
      JSON.stringify(result, null, 2)
    );

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8">

      <div className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40">

        <div className="border-b px-8 py-6">
          <h2 className="text-xl font-semibold">
            Export Submission
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter a submission ID to generate instructor-ready JSON.
          </p>
        </div>

        <div className="p-8">

          <label className="mb-2 block text-sm font-medium">
            Submission ID
          </label>

          <div className="flex gap-4">

            <input
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              placeholder="e.g. 64fe932baae..."
              className="
              flex-1
              rounded-xl
              border
              border-slate-300
              px-5
              py-3
              font-mono
              outline-none
              transition
              focus:border-black
              focus:ring-4
              focus:ring-slate-200"
            />

            <button
              onClick={handleExport}
              disabled={loading}
              className="
              flex
              items-center
              gap-2
              rounded-xl
              bg-black
              px-6
              py-3
              text-white
              transition
              hover:opacity-90
              disabled:opacity-60"
            >
              <Download size={18} />
              {loading ? "Exporting..." : "Export"}
            </button>

          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40">

          <div className="flex items-center justify-between border-b px-8 py-5">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-slate-100 p-3">
                <FileJson size={22} />
              </div>

              <div>
                <h3 className="font-semibold">
                  JSON Export
                </h3>

                <p className="text-sm text-slate-500">
                  Ready for instructor portal
                </p>
              </div>

            </div>

            <button
              onClick={copyJSON}
              className="
              flex
              items-center
              gap-2
              rounded-lg
              border
              px-4
              py-2
              hover:bg-slate-50"
            >
              {copied ? (
                <>
                  <Check size={18} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={18} />
                  Copy JSON
                </>
              )}
            </button>

          </div>

          <div className="p-10">
            <JsonPreview data={result} />
          </div>
        </div>
      )}
    </div>
  );
}