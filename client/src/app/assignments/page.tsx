import { getAssignments } from '../lib/api'
import { getDashboardStats, getFilterOptions, getStatusTabs } from '../lib/utils'
import AssignmentCard1 from './assignmentCard'
import FilterBar from './filterBar'
import Stats from './stats'
import Tabs from './tabs'

export default async function AllAssignmentsPage({searchParams}:{searchParams: Promise<{batch?: string, assignment?: string, search?: string,status?: string  }>}) {
 const params=await searchParams
 const assignments= await getAssignments(params)
 const { batches, assignments:assignmentNumbers } = getFilterOptions(assignments || []);
const tabs = getStatusTabs(assignments || []);
const stats = getDashboardStats(assignments);

 

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold ">All Assignments</h1>
            <p className="text-slate-400 mt-2">Manage and review assignments across all batches</p>
          </div>

          <Stats stats={stats} />

          <Tabs tabs={tabs} selectedStatus={params.status ?? ""} />

          <FilterBar
          assignments={assignmentNumbers}
          batches={batches}
          selectedAssignment={params.assignment ?? ""}
          selectedBatch={params.batch ?? ""}
          search={params.search ?? ""}
          />

          <div>
            {assignments ? (
              <div className="mt-8 group
    rounded-[28px]
    border
    border-zinc-200
    bg-white
    p-8
    shadow-sm
    transition-all
    duration-300
    hover:-translate-y-1
    hover:border-zinc-300
    hover:shadow-2xl">
                {assignments?.map((assignment) => (
                  <AssignmentCard1
                    key={assignment._id}
                    _id={assignment._id}
                    batch={assignment.batch}
                    assignmentNo={assignment.assignmentNo}
                    title={assignment.title}
                    status={assignment.status}
                    figmaUrl={assignment.figmaUrl}
                    originalRequirements={assignment.originalRequirements}
                    updatedAt={assignment.updatedAt}
                    version={assignment.version}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-lg font-medium text-slate-400">No assignments found</p>
                <p className="text-sm text-slate-500 mt-2">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>

          {assignments?.length > 0 && (
            <div className="mt-8 text-center text-sm text-slate-400">
              Showing <span className="font-semibold text-slate-300">{assignments.length}</span> of{' '}
              <span className="font-semibold text-slate-300">{assignmentNumbers.length}</span> assignments
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
