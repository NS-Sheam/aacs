export default function Loading() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 px-6 py-12 animate-pulse">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gray-200" />

          <div className="space-y-3">
            <div className="h-8 w-64 rounded-lg bg-gray-200" />
            <div className="h-4 w-80 rounded bg-gray-200" />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/80 p-10 shadow-[0_20px_60px_rgba(0,0,0,.06)] backdrop-blur-xl space-y-10">
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="h-6 w-48 rounded bg-gray-200" />
              <div className="h-4 w-72 rounded bg-gray-200" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <InputSkeleton />
              <InputSkeleton />
            </div>

            <InputSkeleton />
            <InputSkeleton />
          </section>

          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-6 w-44 rounded bg-gray-200" />
                <div className="h-4 w-64 rounded bg-gray-200" />
              </div>

              <div className="h-8 w-24 rounded-full bg-gray-200" />
            </div>

            <div className="h-95 rounded-2xl border border-gray-200 bg-gray-100" />
          </section>

          <div className="h-14 w-full rounded-xl bg-gray-300" />
        </div>
      </div>
    </div>
  );
}

function InputSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-28 rounded bg-gray-200" />
      <div className="h-12 w-full rounded-xl bg-gray-100 border border-gray-200" />
    </div>
  );
}