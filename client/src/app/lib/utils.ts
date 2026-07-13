import { Assignment } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
 export const getTotalRequirements = (originalRequirements: Record<string, any>): number => {
    return Object.values(originalRequirements)
      .reduce((sum: number, section: any) => {
        if (section && typeof section === 'object') {
          return sum + Object.keys(section).length
        }
        return sum
      }, 0)
  } 
 
  interface AssignmentProps {
  batch: number;
  assignmentNo: number;
}

export const getFilterOptions = (assignments: AssignmentProps[]) => {
  const batches = [...new Set(assignments.map((a) => a.batch))]
    .sort((a, b) => a - b)
    .map(String);

  const assignmentNumbers = [
    ...new Set(assignments.map((a) => a.assignmentNo)),
  ]
    .sort((a, b) => a - b)
    .map(String);

  return {
    batches,
    assignments: assignmentNumbers,
  };
}

interface AssignmentTabs {
  status: string;
}

export interface StatusTab {
  name: string;
  value: string;
  count: number;
}

export function getStatusTabs(
  assignments: AssignmentTabs[]
): StatusTab[] {
  const counts = assignments.reduce<Record<string, number>>((acc, assignment) => {
    acc[assignment.status] = (acc[assignment.status] || 0) + 1;
    return acc;
  }, {});

  return [
    {
      name: "All",
      value: "all",
      count: assignments.length,
    },
    ...Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: status,
        count,
      })),
  ];
}

export interface DashboardStat {
  name: string;
  value: number;
}

export function getDashboardStats(
  assignments: Assignment[]
): DashboardStat[] {
  const totalAssignments = assignments.length;

  const activeAssignments = assignments.filter(
    (a) => a.status === "active"
  ).length;

  const draftAssignments = assignments.filter(
    (a) => a.status === "draft"
  ).length;

  

  return [
    {
      name: "Total Assignments",
      value: totalAssignments,
    },
    {
      name: "Active",
      value: activeAssignments,
    },
    {
      name: "Draft",
      value: draftAssignments,
    },
  ];
}
