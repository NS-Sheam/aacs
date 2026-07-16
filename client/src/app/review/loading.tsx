export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="mx-auto max-w-5xl">

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="h-8 w-52 rounded-lg bg-gray-200" />
            <div className="mt-3 h-4 w-80 rounded bg-gray-200" />
          </div>

          <div className="flex gap-3">
            <StatSkeleton />
            <StatSkeleton />
          </div>
        </div>


        <div className="mb-6 flex gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="h-10 w-10 rounded-full bg-blue-200" />

          <div className="flex-1 space-y-3">
            <div className="h-5 w-56 rounded bg-blue-200" />
            <div className="h-4 w-full max-w-xl rounded bg-blue-100" />
          </div>
        </div>


        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <ReviewCardSkeleton key={index} />
          ))}
        </div>


        <div className="mt-8">
          <div className="mb-4 h-4 w-40 rounded bg-gray-200" />

          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="
                  flex items-center justify-between
                  rounded-xl border bg-white
                  px-5 py-4
                "
              >
                <div className="h-4 w-80 rounded bg-gray-200" />
                <div className="h-6 w-20 rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}


function StatSkeleton() {
  return (
    <div className="w-28 rounded-xl border bg-white px-5 py-3 shadow-sm">
      <div className="h-3 w-16 rounded bg-gray-200" />
      <div className="mt-3 h-7 w-10 rounded bg-gray-200" />
    </div>
  );
}


function ReviewCardSkeleton() {
  return (
    <div
      className="
        overflow-hidden rounded-2xl
        border border-gray-200
        bg-white shadow-sm
      "
    >

      <div
        className="
          border-b bg-linear-to-r
          from-gray-50 to-white
          p-5
          flex justify-between gap-4
        "
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="h-6 w-28 rounded-full bg-gray-200" />
            <div className="h-5 w-20 rounded bg-gray-200" />
          </div>

          <div className="h-5 w-96 rounded bg-gray-200" />

          <div className="h-3 w-32 rounded bg-gray-200" />
        </div>

        <div className="text-right space-y-2">
          <div className="h-3 w-12 rounded bg-gray-200" />
          <div className="h-7 w-10 rounded bg-gray-200" />
        </div>
      </div>


      <div className="p-5">

        <div className="rounded-xl border bg-gray-50 p-4 space-y-3">
          <div className="h-3 w-28 rounded bg-gray-200" />

          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-11/12 rounded bg-gray-200" />
            <div className="h-4 w-8/12 rounded bg-gray-200" />
          </div>
        </div>


        <div className="mt-5">
          <div className="flex justify-between">
            <div className="h-3 w-32 rounded bg-gray-200" />
            <div className="h-3 w-10 rounded bg-gray-200" />
          </div>

          <div className="mt-3 h-2 rounded-full bg-gray-200" />
        </div>

      </div>


      <div className="flex gap-3 border-t bg-gray-50 p-5">
        <div className="h-10 flex-1 rounded-xl bg-gray-200" />
        <div className="h-10 flex-1 rounded-xl bg-gray-200" />
      </div>

    </div>
  );
}