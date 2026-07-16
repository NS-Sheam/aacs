export default function Loading() {
  return (
    <div className="flex min-h-screen animate-pulse">
      <main className="flex-1 pb-12">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 md:pt-8">

          <div className="mb-8">
            <div className="h-10 w-72 rounded-lg bg-slate-200" />
            <div className="mt-3 h-4 w-96 rounded bg-slate-200" />
          </div>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-5
                "
              >
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="mt-4 h-8 w-16 rounded bg-slate-200" />
              </div>
            ))}
          </div>


          <div className="mt-8 flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-28 rounded-xl bg-slate-200"
              />
            ))}
          </div>


          <div
            className="
              mt-6
              flex
              flex-col
              gap-4
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
              md:flex-row
            "
          >
            <div className="h-11 flex-1 rounded-xl bg-slate-200" />
            <div className="h-11 w-full rounded-xl bg-slate-200 md:w-40" />
            <div className="h-11 w-full rounded-xl bg-slate-200 md:w-40" />
          </div>


          <div
            className="
              mt-8
              rounded-[28px]
              border
              border-zinc-200
              bg-white
              p-8
              shadow-sm
            "
          >
            <div className="space-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <AssignmentCardSkeleton key={i} />
              ))}
            </div>
          </div>


          <div className="mt-8 flex justify-center">
            <div className="h-4 w-72 rounded bg-slate-200" />
          </div>

        </div>
      </main>
    </div>
  );
}


function AssignmentCardSkeleton() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-6
      "
    >
      <div className="flex flex-col gap-5 md:flex-row md:justify-between">

        <div className="flex-1 space-y-4">

          <div className="flex gap-3">
            <div className="h-6 w-24 rounded-full bg-slate-200" />
            <div className="h-6 w-20 rounded-full bg-slate-200" />
          </div>


          <div className="h-7 w-80 rounded bg-slate-200" />

          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-9/12 rounded bg-slate-200" />
          </div>

          <div className="flex gap-4">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-4 w-28 rounded bg-slate-200" />
          </div>

        </div>

        <div className="flex items-start">
          <div className="h-10 w-28 rounded-xl bg-slate-200" />
        </div>

      </div>
    </div>
  );
}