import { Assignment } from "@/types";
import { CheckCircle2, XCircle } from "lucide-react";



interface AssignmentTableProps {
  data: Assignment[];
}

const AssignmentTable = ({
  data,
}: AssignmentTableProps) => {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Requirement #
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Description
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Status
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Batch
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Assignment
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Message
              </th>
            </tr>
          </thead>

          <tbody>
            {data.length ? (
              data.map((item, index) => (
                <tr
                  key={item._id}
                  className={`border-b border-slate-200 transition-colors hover:bg-slate-50 ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {item.number}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {item.description}
                  </td>

                  <td className="px-6 py-4">
                    {item.correct ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                        <XCircle className="h-4 w-4" />
                        Failed
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {item?.batch ? `Batch ${item.batch}` : "N/A"}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    Assignment {item?.assignmentNo || "N/A"}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {item.message}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center"
                >
                  <p className="text-lg font-semibold text-slate-700">
                    No requirements found
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Try changing your filters or search keywords.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-sm text-slate-600">
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {data.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900">
              {data.length}
            </span>{" "}
            requirements
          </p>
        </div>
      )}
    </div>
  );
};

export default AssignmentTable;