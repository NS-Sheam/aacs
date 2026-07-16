/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAssignmentById, getEnrichedAssignmentById } from "@/app/lib/api";
import Link from "next/link";

export default async function AssignmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  const assignment = await getAssignmentById(id);
  const enrichment = await getEnrichedAssignmentById(id);

  if (!assignment)
    return (
      <div className="p-8 text-sm text-red-500">
        Assignment not found
      </div>
    );

  const reqs = assignment?.data?.originalRequirements;

  const totalReqs = Object.values(reqs).reduce(
    (acc: number, s: any) => acc + Object.keys(s).length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

          <div className="bg-linear-to-r from-black via-gray-900 to-gray-800 px-6 py-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-xs">
                    Assignment
                  </span>

                  <span className="text-xs text-gray-300">
                    v{assignment.data.version}
                  </span>
                </div>


                <h1 className="text-2xl font-semibold tracking-tight">
                  {assignment.data.assignmentNo}
                  <span className="text-gray-400 mx-2">
                    —
                  </span>
                  {assignment.data.title}
                </h1>


                <p className="text-sm text-gray-400 mt-3">
                  Batch {assignment.data.batch}
                  <span className="mx-2">•</span>
                  {totalReqs} total requirements
                </p>
              </div>


              <Link
                href={`/submissions/new?assignmentId=${assignment.data._id}`}
              >
                <button
                  className="
                  bg-white text-black 
                  hover:bg-gray-100
                  transition
                  rounded-xl
                  px-5 py-2.5
                  text-sm
                  font-medium
                  shadow-lg
                  "
                >
                  + Add Submission
                </button>
              </Link>

            </div>
          </div>


          <div className="grid grid-cols-2 md:grid-cols-4 divide-x border-t">

            <Stat
              title="Batch"
              value={assignment.data.batch}
            />

            <Stat
              title="Version"
              value={`v${assignment.data.version}`}
            />

            <Stat
              title="Requirements"
              value={totalReqs}
            />

            <Stat
              title="Enriched"
              value={
                enrichment?.data?.enriched
              }
            />

          </div>

        </div>

        <section>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Requirements
            </h2>

            <span className="text-xs text-gray-400">
              {totalReqs} items
            </span>
          </div>



          <div className="space-y-5">

            {Object.entries(reqs).map(
              ([section, requirements]) => (

                <div
                  key={section}
                  className="
                  bg-white
                  rounded-2xl
                  border
                  shadow-sm
                  overflow-hidden
                  "
                >

                  <div
                    className="
                    px-5 py-4
                    bg-gray-50
                    border-b
                    flex
                    justify-between
                    items-center
                    "
                  >

                    <h3 className="font-medium text-sm">
                      {section}
                    </h3>


                    <span
                      className="
                      text-xs
                      bg-white
                      border
                      px-3 py-1
                      rounded-full
                      text-gray-500
                      "
                    >
                      {
                        Object.keys(
                          requirements as object
                        ).length
                      } items
                    </span>

                  </div>



                  <div className="divide-y">

                    {Object.entries(
                      requirements as Record<string, any>
                    ).map(
                      ([reqKey, req]) => (

                        <div
                          key={reqKey}
                          className="
                          p-5
                          hover:bg-gray-50
                          transition
                          "
                        >

                          <div
                            className="
                            flex
                            justify-between
                            gap-5
                            "
                          >

                            <div className="space-y-2">

                              <div className="flex items-center gap-2">

                                <span
                                  className="
                                  font-mono
                                  text-xs
                                  bg-gray-100
                                  px-2 py-1
                                  rounded
                                  text-gray-500
                                  "
                                >
                                  {reqKey}
                                </span>

                              </div>


                              <p className="text-sm text-gray-700 leading-relaxed">
                                {req.description}
                              </p>

                            </div>



                            <div
                              className="
                              flex
                              flex-col
                              items-end
                              gap-2
                              "
                            >

                              <span
                                className="
                                text-xs
                                font-medium
                                bg-black
                                text-white
                                px-3 py-1
                                rounded-full
                                "
                              >
                                {req.number} pts
                              </span>


                              {req.checkType && (
                                <span
                                  className="
                                  text-xs
                                  bg-blue-50
                                  text-blue-700
                                  px-3 py-1
                                  rounded-full
                                  "
                                >
                                  {req.checkType}
                                </span>
                              )}

                            </div>


                          </div>

                        </div>

                      )
                    )}

                  </div>


                </div>

              )
            )}

          </div>


        </section>

      </div>
    </div>
  );
}



function Stat({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wide">
        {title}
      </p>

      <p className="mt-2 text-lg font-semibold">
        {value}
      </p>
    </div>
  );
}