export default function Loading() {
  return (
    <main className="flex justify-center min-h-screen bg-linear-to-br from-slate-50 via-white to-gray-100">
      <div className="mx-auto max-w-7xl px-8 py-20 animate-pulse">
        <div className="mb-10 max-w-2xl">
          <div className="h-4 w-32 rounded bg-gray-200" />

          <div className="mt-4 h-14 w-96 rounded-xl bg-gray-200" />

          <div className="mt-6 space-y-3">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-11/12 rounded bg-gray-200" />
          </div>
        </div>

        <div className="max-w-2xl rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/40">
          <div className="border-b border-gray-100 p-8">
            <div className="h-8 w-60 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-80 rounded bg-gray-200" />
          </div>

          <div className="space-y-7 p-8">
            <InputSkeleton />
            <InputSkeleton />
            <InputSkeleton />
            <InputSkeleton />

            <div className="h-14 w-full rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    </main>
  );
}

function InputSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-36 rounded bg-gray-200" />

      <div className="flex h-14 items-center rounded-2xl border border-gray-200 bg-gray-100 px-5">
        <div className="mr-3 h-5 w-5 rounded-full bg-gray-300" />
        <div className="h-4 w-2/3 rounded bg-gray-300" />
      </div>
    </div>
  );
}