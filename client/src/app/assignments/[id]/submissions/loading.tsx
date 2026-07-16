export default function Loading() {
  return (
    <div className="space-y-6 p-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="mt-3 h-4 w-36 rounded bg-gray-200" />
        </div>

        <div className="h-10 w-40 rounded-xl bg-gray-200" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-[2.8fr_120px_90px_90px_120px_180px] bg-gray-50 px-6 py-4">
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="h-4 w-12 rounded bg-gray-200" />
          <div className="h-4 w-10 rounded bg-gray-200" />
          <div className="h-4 w-10 rounded bg-gray-200" />
          <div className="h-4 w-14 rounded bg-gray-200" />
          <div className="ml-auto h-4 w-16 rounded bg-gray-200" />
        </div>

        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[2.8fr_120px_90px_90px_120px_180px] items-center border-t px-6 py-5"
          >
            {/* Student */}
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-full bg-gray-200" />

              <div className="space-y-2">
                <div className="h-4 w-36 rounded bg-gray-200" />
                <div className="h-3 w-56 rounded bg-gray-100" />
              </div>
            </div>

            {/* Score */}
            <div>
              <div className="h-7 w-20 rounded-lg bg-gray-200" />
            </div>

            {/* Auto */}
            <div className="h-4 w-8 rounded bg-gray-200" />

            {/* Flags */}
            <div className="h-6 w-8 rounded-full bg-gray-200" />

            {/* Status */}
            <div className="h-7 w-24 rounded-full bg-gray-200" />

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <div className="h-9 w-20 rounded-lg bg-gray-200" />
              <div className="h-9 w-20 rounded-lg bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-gray-200" />

        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-lg bg-gray-200" />
          <div className="h-10 w-20 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}