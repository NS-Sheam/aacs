"use client";

import ErrorBoundary from "@/components/ErrorBoundary";


export default function Error({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorBoundary
      title="Failed to load submissions"
      description="Please check your connection or try again."
      onRetry={reset}
    />
  );
}