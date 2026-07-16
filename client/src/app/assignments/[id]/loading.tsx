export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 animate-pulse">
      <div className="mx-auto max-w-5xl space-y-8">

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          <div className="bg-linear-to-r from-gray-900 to-gray-800 px-6 py-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-6 w-24 rounded-full bg-gray-700" />
                  <div className="h-5 w-12 rounded bg-gray-700" />
                </div>

                <div className="h-8 w-96 rounded-lg bg-gray-700" />

                <div className="h-4 w-60 rounded bg-gray-700" />
              </div>


              <div className="h-11 w-40 rounded-xl bg-gray-700" />

            </div>
          </div>


          <div className="grid grid-cols-2 divide-x border-t md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5">
                <div className="h-3 w-20 rounded bg-gray-200" />
                <div className="mt-3 h-6 w-14 rounded bg-gray-200" />
              </div>
            ))}
          </div>

        </div>



        <section>

          <div className="mb-4 flex items-center justify-between">
            <div className="h-6 w-36 rounded bg-gray-200" />
            <div className="h-4 w-16 rounded bg-gray-200" />
          </div>


          <div className="space-y-5">

            {Array.from({ length: 3 }).map((_, sectionIndex) => (
              <div
                key={sectionIndex}
                className="
                  overflow-hidden
                  rounded-2xl
                  border
                  bg-white
                  shadow-sm
                "
              >

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    border-b
                    bg-gray-50
                    px-5
                    py-4
                  "
                >
                  <div className="h-5 w-40 rounded bg-gray-200" />
                  <div className="h-6 w-16 rounded-full bg-gray-200" />
                </div>


                <div className="divide-y">

                  {Array.from({ length: 3 }).map((_, reqIndex) => (
                    <div
                      key={reqIndex}
                      className="p-5"
                    >

                      <div className="flex justify-between gap-5">

                        <div className="flex-1 space-y-3">

                          <div className="h-6 w-20 rounded bg-gray-200" />

                          <div className="space-y-2">
                            <div className="h-4 w-full rounded bg-gray-200" />
                            <div className="h-4 w-10/12 rounded bg-gray-200" />
                          </div>

                        </div>


                        <div className="flex flex-col items-end gap-3">
                          <div className="h-6 w-20 rounded-full bg-gray-200" />
                          <div className="h-6 w-24 rounded-full bg-gray-200" />
                        </div>

                      </div>

                    </div>
                  ))}

                </div>

              </div>
            ))}

          </div>

        </section>

      </div>
    </div>
  );
}