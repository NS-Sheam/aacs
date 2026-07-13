"use client"
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import React from 'react';
interface StatusTab {
  name: string;
  value: string;
  count: number;
}

interface Props {
  tabs: StatusTab[];
  selectedStatus: string;
}

const Tabs = ({tabs, selectedStatus}: Props) => {
    const params=useSearchParams()
    const router=useRouter()
    const handleStatusChange = (status: string) => {
    const query = new URLSearchParams(params.toString());
    query.set('status', status)
    router.push(`/assignments?${query.toString()}`)
  }
    return (
        <div className="flex gap-2 mb-8 border-b border-slate-800">
            {tabs.map((tab) => (
  <button
    key={tab.value}
    onClick={() => handleStatusChange(tab.value)}
    className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
      selectedStatus === tab.value
        ? "text-blue-400 border-blue-500"
        : "text-slate-400 border-transparent hover:text-slate-300"
    }`}
  >
    {tab.name}
    <span className=" rounded  px-2 py-1 text-xs">
      {tab.count}
    </span>
  </button>
))}
          </div>
    );
};

export default Tabs;