import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stats = ({ filteredData, passedCount, failedCount, passRate, batches, mockRequirements }: any) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-slate-600 text-sm font-medium">Total Requirements</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{filteredData.length}</p>
              <p className="text-xs text-slate-500 mt-1">
                Showing {filteredData.length} of {mockRequirements.length}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-emerald-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-emerald-700 text-sm font-medium">Passed</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{passedCount}</p>
              <p className="text-xs text-emerald-600 mt-1">{passRate}% pass rate</p>
            </div>

            <div className="bg-white rounded-lg border border-red-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-red-700 text-sm font-medium">Failed</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{failedCount}</p>
              <p className="text-xs text-red-600 mt-1">
                {filteredData.length > 0 ? Math.round(((failedCount / filteredData.length) * 100)) : 0}% fail rate
              </p>
            </div>

            <div className="bg-white rounded-lg border border-blue-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-blue-700 text-sm font-medium">Batches</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{batches.length}</p>
              <p className="text-xs text-blue-600 mt-1">Active batches</p>
            </div>
          </div>
    );
};

export default stats;