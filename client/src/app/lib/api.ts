/* eslint-disable @typescript-eslint/no-explicit-any */
import { Assignment, AssignmentJSON, AssignmentUpload, SubmissionAssignment, SubmissionProgress } from "@/types";

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
  payload: SubmissionAssignment
): Promise<{success: boolean; message?: string; data: { _id: string }}> => {
  return apiFetch("/api/v1/submissions", {
    method: "POST",
    body: JSON.stringify(payload),
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

  const res: { data: Assignment[] } = await apiFetch(`/api/v1/assignments?${query.toString()}`);
  return res.data as Assignment[];
}
export const createAssignment=async (assignment: AssignmentUpload): Promise<{ success: boolean; message?: string; data: { assignmentId: string ,assignment: Assignment} }> => {
  return apiFetch("/api/v1/assignments", {
    method: "POST",
    body: JSON.stringify(assignment),
  });
} 

export const getSubmissionStatus = async (submissionId: string): Promise<any> => {
  return apiFetch(`/api/v1/submissions/${submissionId}/status`);
}

export const exportAssignment=async (submissionId: string): Promise<any> => {
  return apiFetch(`/api/v1/results/export/${submissionId}`,{
    method: "POST",
    body: JSON.stringify({ submissionId }),
  });
}

export const getAssignmentById=async (assignmentId: string): Promise<any> => {
  return apiFetch(`/api/v1/assignments/${assignmentId}`);
}

export const getEnrichedAssignmentById=async (assignmentId: string): Promise<any> => {
  return apiFetch(`/api/v1/assignments/${assignmentId}/enriched`);
}

export const getReviewQueueItems=async (submissionId?: string): Promise<any> => {
  const url = submissionId
    ? `/api/v1/review-queue?submissionId=${submissionId}`
    : `/api/v1/review-queue`;
  return apiFetch(url);
}

export const resolveQueueItem=async (itemId: string, decision: "pass" | "fail", resolvedBy: string): Promise<any> => {
  return apiFetch(`/api/v1/review-queue/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ decision, resolvedBy }),
  });
}

export const getSubmissionById=async (submissionId: string): Promise<any> => {
  return apiFetch(`/api/v1/submissions/${submissionId}`);
}

export const summaryResults=async (submissionId: string): Promise<any> => {
  return apiFetch(`/api/v1/results/${submissionId}/summary`);
}

export const getResultBySubmissionId=async (submissionId: string): Promise<any> => {
  return apiFetch(`/api/v1/results/${submissionId}`);
}

export const getSubmissionsByAssignmentId=async (assignmentId: string,page: number,limit: number): Promise<any> => {
  return apiFetch(`/api/v1/submissions/assignment/${assignmentId}/paginated?page=${page}&limit=${limit}`);
}