"use client";

import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export default function ErrorBoundary({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again or return to the homepage.",
  onRetry,
}: ErrorBoundaryProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-red-50 px-6">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-red-200/30 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative w-full max-w-lg rounded-3xl border border-white/40 bg-white/80 p-10 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-red-100 ring-8 ring-red-50">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>

        <h2 className="mt-8 text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-500">
          {description}
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:bg-slate-800 active:scale-95"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          )}

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 font-medium text-slate-700 transition-all duration-200 hover:scale-[1.02] hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          >
            <Home size={18} />
            Back Home
          </Link>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-400">
            If the problem continues, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}