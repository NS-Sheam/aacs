/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReviewItem } from "@/types";
import Actions from "./actions";
import { getReviewQueueItems } from "../lib/api";


export default async function ReviewPage({searchParams}: {searchParams: {submissionId: string}}) {
    const {submissionId}=await searchParams
    const res = await getReviewQueueItems(submissionId);
    const queueItems: ReviewItem[] = res?.data || [];
    const pending = queueItems?.filter((i) => i.status === "pending") || [];
    const resolved = queueItems?.filter((i) => i.status === "resolved") || [];

    

  return (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Review Queue
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manually verify low-confidence AI grading decisions
          </p>
        </div>

        <div className="flex gap-3">
          <div className="bg-white border rounded-xl px-5 py-3 shadow-sm">
            <p className="text-xs text-gray-400 uppercase">
              Pending
            </p>
            <p className="text-xl font-semibold text-amber-600">
              {pending?.length}
            </p>
          </div>

          <div className="bg-white border rounded-xl px-5 py-3 shadow-sm">
            <p className="text-xs text-gray-400 uppercase">
              Resolved
            </p>
            <p className="text-xl font-semibold text-green-600">
              {resolved?.length}
            </p>
          </div>
        </div>
      </div>


      {/* Info Banner */}
      {pending.length > 0 && (
        <div className="
          mb-6 rounded-2xl border border-blue-200
          bg-gradient-to-r from-blue-50 to-indigo-50
          p-5 flex gap-4 items-start
        ">
          <div className="
            w-10 h-10 rounded-full 
            bg-blue-100 flex items-center justify-center
            text-blue-600 font-bold
          ">
            AI
          </div>

          <div>
            <h3 className="font-medium text-blue-900">
              Human verification required
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              These requirements have low confidence scores and need
              instructor approval before final grading.
            </p>
          </div>
        </div>
      )}


      {/* Empty */}
      {pending.length === 0 && (
        <div className="
          bg-white border rounded-2xl p-12
          text-center shadow-sm
        ">
          <div className="
            mx-auto mb-4 w-14 h-14 rounded-full
            bg-green-100 flex items-center justify-center
            text-green-600 text-xl
          ">
            ✓
          </div>

          <h2 className="font-semibold text-gray-900">
            Everything is resolved
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            No pending reviews require attention.
          </p>
        </div>
      )}



      {/* Pending Cards */}
      <div className="space-y-5">

        {pending?.map((item) => (

          <div
            key={item._id}
            className="
              bg-white rounded-2xl border border-gray-200
              shadow-sm hover:shadow-md transition
              overflow-hidden
            "
          >

            {/* Card Header */}
            <div className="
              p-5 flex justify-between gap-4
              bg-gradient-to-r from-gray-50 to-white
              border-b
            ">

              <div>
                <div className="flex items-center gap-2 mb-2">

                  <span className="
                    text-xs font-medium
                    bg-amber-100 text-amber-700
                    px-3 py-1 rounded-full
                  ">
                    Needs review
                  </span>

                  <span className="
                    text-xs text-gray-400
                  ">
                    {item.reqKey}
                  </span>

                </div>


                <h3 className="
                  font-semibold text-gray-900
                  leading-relaxed
                ">
                  {item.description}
                </h3>

                <p className="
                  text-xs text-gray-400 mt-2
                ">
                  Section: {item.section}
                </p>

              </div>


              <div className="
                text-right shrink-0
              ">
                <p className="text-xs text-gray-400">
                  Marks
                </p>

                <p className="
                  text-xl font-bold text-gray-900
                ">
                  {item.marks}
                </p>
              </div>

            </div>



            {/* Reason */}
            <div className="p-5">

              <div className="
                rounded-xl bg-gray-50
                border p-4
              ">
                <p className="
                  text-xs uppercase
                  tracking-wide text-gray-400 mb-2
                ">
                  AI Analysis
                </p>

                <p className="
                  text-sm text-gray-700 leading-relaxed
                ">
                  {item.aiReasoning}
                </p>
              </div>



              {/* Confidence */}
              <div className="mt-5">

                <div className="
                  flex justify-between
                  text-xs mb-2
                ">
                  <span className="text-gray-500">
                    Confidence score
                  </span>

                  <span className={
                    item.confidence < .7
                      ? "text-amber-600 font-medium"
                      : "text-green-600 font-medium"
                  }>
                    {Math.round(item.confidence * 100)}%
                  </span>
                </div>


                <div className="
                  h-2 bg-gray-100
                  rounded-full overflow-hidden
                ">
                  <div
                    className={`
                      h-full rounded-full transition-all
                      ${
                        item.confidence < .7
                        ? "bg-gradient-to-r from-amber-400 to-orange-400"
                        : "bg-gradient-to-r from-green-400 to-emerald-500"
                      }
                    `}
                    style={{
                      width:`${item.confidence * 100}%`
                    }}
                  />
                </div>

              </div>

            </div>



            {/* Actions */}
            
            <Actions item={item} queueItems={queueItems}/>

          </div>

        ))}



        {/* Resolved */}
        {resolved.length > 0 && (

          <div className="pt-6">

            <h3 className="
              text-xs font-semibold
              text-gray-400 uppercase
              tracking-wider mb-3
            ">
              Recently resolved
            </h3>


            <div className="space-y-3">

              {resolved?.map((item)=>(
                <div
                  key={item._id}
                  className="
                    bg-white border rounded-xl
                    px-5 py-4
                    flex items-center justify-between
                    shadow-sm
                    opacity-70
                  "
                >

                  <span className="
                    text-sm text-gray-700
                  ">
                    {item.description}
                  </span>


                  <span className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${
                      item.decision==="pass"
                      ?"bg-green-100 text-green-700"
                      :"bg-red-100 text-red-700"
                    }
                  `}>
                    {item.decision}
                  </span>

                </div>
              ))}

            </div>

          </div>

        )}

      </div>

    </div>
  </div>
);
}