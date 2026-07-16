"use client";

import { ChevronDown, Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

type Props = {
  batches: string[];
  assignments: string[];
  search: string;
  selectedBatch: string;
  selectedAssignment: string;
};

export default function FilterBar({
  batches,
  assignments,
  search,
  selectedBatch,
  selectedAssignment,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const [localSearch, setLocalSearch] = useState(search);

  const update = (key: string, value: string) => {
    const query = new URLSearchParams(params.toString());

    if (value) query.set(key, value);
    else query.delete(key);

    router.push(`/dashboard?${query.toString()}`);
  };

  const clearFilters = () => {
    setLocalSearch("");
    router.push("/dashboard");
  };

  const hasFilters =
    selectedBatch || selectedAssignment || search;

  return (
    <div className="flex items-center gap-3">
      
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {/* Batch */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Batch
                </label>
      
                <div className="relative">
                  <select
                    value={selectedBatch}
                    onChange={(e) => update("batch", e.target.value)}
                    className="h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">All Batches</option>
      
                    {batches?.map((batch) => (
                      <option key={batch} value={batch}>
                        {batch}
                      </option>
                    ))}
                  </select>
      
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-slate-400" />
                </div>
              </div>
      
              {/* Assignment */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Assignment
                </label>
      
                <div className="relative">
                  <select
                    value={selectedAssignment}
                    onChange={(e) =>
                      update("assignment", e.target.value)
                    }
                    className="h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">All Assignments</option>
      
                    {assignments?.map((assignment) => (
                      <option
                        key={assignment}
                        value={assignment}
                      >
                        Assignment {assignment}
                      </option>
                    ))}
                  </select>
      
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-slate-400" />
                </div>
              </div>
      
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search
                </label>
      
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
      
                  <input
                    type="text"
                    placeholder="Search requirements..."
                    value={localSearch}
                    onChange={(e) => {
                      setLocalSearch(e.target.value);
                      update("search", e.target.value);
                    }}
                    className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
      
            {hasFilters && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Clear Filters
                </button>
              </div>
            )}
    </div>
  );
}