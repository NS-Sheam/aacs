import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  Clock3,
  Archive,
  Plus,
} from "lucide-react";

import { getFilterOptions, getStatusTabs } from "../lib/utils";
import { getAssignments } from "../lib/api";
import FilterBar from "./filter";
import Stats from "./stats";


export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    batch?: string;
    assignment?: string;
    search?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;

const allAssignments = await getAssignments(params);


const assignments =
  params.status && params.status !== "all"
    ? allAssignments.filter(
        (a) => a.status === params.status
      )
    : allAssignments;


const {
  batches,
  assignments: assignmentNumbers,
} = getFilterOptions(allAssignments || []);


const status = getStatusTabs(allAssignments || []);


  return (
    <div className="min-h-screen bg-zinc-50 p-6 lg:p-10">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Assignments
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Manage assignments, batches and submissions.
          </p>
        </div>


        <Link href="/upload">
          <button
            className="
            flex items-center gap-2
            rounded-xl
            bg-bl
            px-5
            py-3
            text-sm
            font-medium
            transition
            hover:bg-blue-800
            bg-blue-600
            text-white
            cursor-pointer
            "
          >
            <Plus size={16}/>
            New Assignment
          </button>
        </Link>

      </div>



      {/* Status cards */}

      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

        {status.map((s)=>(
          <Stats key={s.value} stats={[{name:s.name,value:s.value=='all' ? allAssignments.length : allAssignments.filter((a)=>a.status===s.value).length}]}/>
        ))}

      </div>





      {/* Filters */}

      <div
        className="
        sticky
        top-4
        z-20
        mb-6
        rounded-2xl
        border
        bg-white
        p-4
        shadow-sm
        "
      >

        <FilterBar
          batches={batches}
          assignments={assignmentNumbers}
          search={params.search ?? ""}
          selectedBatch={params.batch ?? ""}
          selectedAssignment={params.assignment ?? ""}
        />

      </div>






      {/* Status Tabs */}

      <div className="mb-6 flex flex-wrap gap-3">

        {status?.map((tab)=>{

          const active =
            (params.status ?? "all") === tab.value;

          return (

            <Link
              key={tab.value}
              href={`?batch=${params?.batch ?? ""}&assignment=${params?.assignment ?? ""}&search=${params?.search ?? ""}&status=${tab.value}`}>

              <button
                className={`
                flex
                items-center
                gap-2
                rounded-full
                px-5
                py-2
                text-sm
                font-medium
                transition

                ${
                  active
                  ?
                  "bg-black text-white"
                  :
                  "border bg-white text-zinc-600 hover:bg-zinc-100"
                }
                `}
              >
                {tab.name}

              </button>


            </Link>

          );

        })}

      </div>







      {/* Assignment List */}

      <div
        className="
        overflow-hidden
        rounded-3xl
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
          px-6
          py-5
          "
        >

          <div>

            <h2 className="font-semibold text-zinc-900">
              Assignment List
            </h2>


            <p className="text-sm text-zinc-500">
              {assignments.length} assignments found
            </p>


          </div>


        </div>





        {
          assignments.length === 0 && (

            <div
              className="
              flex
              flex-col
              items-center
              justify-center
              py-24
              "
            >

              <FileText
                size={45}
                className="text-zinc-300"
              />


              <h3
                className="
                mt-5
                text-xl
                font-semibold
                "
              >
                No assignments found
              </h3>


              <p className="mt-2 text-sm text-zinc-500">
                Try changing filters or create a new assignment.
              </p>


              <Link href="/upload">

                <button
                  className="
                  mt-6
                  rounded-xl
                  bg-black
                  px-5
                  py-3
                  text-sm
                  text-white
                  "
                >
                  Create Assignment
                </button>

              </Link>

            </div>

          )
        }








        {
          assignments.map((a)=>(

            <div
              key={a._id}
              className="
              flex
              flex-col
              gap-4
              border-b
              p-6
              transition
              hover:bg-zinc-50
              last:border-none
              lg:flex-row
              lg:items-center
              lg:justify-between
              "
            >


              {/* Details */}

              <div>


                <h3
                  className="
                  font-semibold
                  text-zinc-900
                  "
                >

                  A{a.assignmentNo}
                  {" "}
                  —
                  {" "}
                  {a.title}

                </h3>


                <p className="mt-2 text-sm text-zinc-500">

                  Batch {a.batch}
                  {" • "}
                  Version {a.version}

                </p>


              </div>






              {/* Actions */}

              <div
                className="
                flex
                items-center
                gap-3
                "
              >


                <span
                  className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  font-semibold

                  ${
                    a.status==="active"
                    ?
                    "bg-green-100 text-green-700"

                    :
                    a.status==="draft"
                    ?
                    "bg-yellow-100 text-yellow-700"

                    :
                    "bg-zinc-100 text-zinc-600"
                  }

                  `}
                >

                  {a.status}

                </span>




                <Link
                  href={`/submissions/new?assignmentId=${a._id}`}
                >

                  <button
                    className="
                    rounded-xl
                    border
                    px-4
                    py-2
                    text-sm
                    transition
                    hover:bg-zinc-100
                    "
                  >
                    Submission
                  </button>


                </Link>





                <Link
                  href={`/assignments/${a._id}`}
                >

                  <button
                    className="
                    rounded-xl
                    bg-black
                    px-4
                    py-2
                    text-sm
                    text-white
                    transition
                    hover:bg-zinc-800
                    "
                  >
                    View
                  </button>


                </Link>


              </div>



            </div>


          ))
        }


      </div>


    </div>
  );
}