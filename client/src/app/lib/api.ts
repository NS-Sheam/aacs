import { Assignment, AssignmentJSON, SubmissionProgress } from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

export const apiFetch = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.json();
}


export const submitAssignment = async (
  assignment: AssignmentJSON
): Promise<{ assignmentId : string }> => {
  return apiFetch<{ assignmentId : string }>("/api/v1/submissions", {
    method: "POST",
    body: JSON.stringify(assignment),
  });
}

export const getSubmissionProgress = async (
  submissionId: string
): Promise<SubmissionProgress> => {
  return apiFetch<SubmissionProgress>(
    `/api/v1/submissions/${submissionId}/status`
  );
};

interface SearchParams {
  batch?: string;
  assignment?: string;
  search?: string;
}

export const getAssignments = async (params: SearchParams) => {
  const query = new URLSearchParams();

  if (params.batch) query.set("batch", params.batch);
  if (params.assignment) query.set("assignment", params.assignment);
  if (params.search) query.set("search", params.search);

  return apiFetch<{
    assignments: Assignment[];
    batches: string[];
    assignmentNumbers: string[];
  }>(`/api/v1/assignments?${query.toString()}`);
}