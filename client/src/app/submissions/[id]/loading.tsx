export default function Loading() {
  return (
    <div className="mx-8 animate-pulse">
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-64 rounded-lg bg-slate-200" />
              <div className="h-8 w-24 rounded-full bg-slate-200" />
            </div>

            <div className="h-4 w-80 rounded bg-slate-200" />
          </div>

          <div className="flex gap-3">
            <div className="h-11 w-36 rounded-lg bg-slate-200" />
            <div className="h-11 w-36 rounded-lg bg-slate-200" />
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="mb-3 h-3 w-28 rounded bg-slate-200" />
              <div className="h-7 w-48 rounded bg-slate-200" />
              {i === 2 && (
                <div className="mt-4 h-4 w-40 rounded bg-slate-200" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="h-12 w-12 rounded-xl bg-slate-200" />

              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="h-5 w-3/4 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 flex items-center gap-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="min-w-[150px] border-r border-gray-200 pr-8 text-center">
          <div className="mx-auto h-4 w-24 rounded bg-slate-200" />
          <div className="mx-auto mt-4 h-14 w-20 rounded bg-slate-200" />
          <div className="mx-auto mt-3 h-4 w-16 rounded bg-slate-200" />
        </div>

        <div className="grid flex-1 grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-100 bg-white p-4"
            >
              <div className="h-3 w-16 rounded bg-slate-200" />
              <div className="mt-3 h-8 w-10 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex gap-3 border-b border-gray-100 pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-28 rounded-lg bg-slate-200"
            />
          ))}
        </div>

        <div className="space-y-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-100 p-5"
            >
              <div className="h-5 w-48 rounded bg-slate-200" />
              <div className="mt-4 h-4 w-full rounded bg-slate-200" />
              <div className="mt-2 h-4 w-11/12 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-8/12 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}