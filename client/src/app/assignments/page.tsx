
import FilterBar from './filterBar'
import AssignmenTable from './assignmentTable'
import { getAssignments } from '../lib/api';


const AllAssignmentsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    batch?: string;
    assignment?: string;
    search?: string;
  }>;
}) => {
  const params = await searchParams;

   const {
    assignments,
    batches,
    assignmentNumbers,
  } = await getAssignments(params);
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="flex-1 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900">All Requirements</h1>
            <p className="text-slate-600 mt-2">Browse and filter assignment requirements across all batches</p>
          </div>

          <FilterBar
        batches={batches}
        assignments={assignmentNumbers}
        selectedBatch={params.batch ?? ""}
        selectedAssignment={params.assignment ?? ""}
        search={params.search ?? ""}
      />
      {
        assignments.length > 0 ? (
          <AssignmenTable data={assignments} />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"> 

            <p className="text-slate-600">No assignments found.</p>
          </div>
        )
      }
        </div>
      </main>
    </div>
  )
}
export default AllAssignmentsPage