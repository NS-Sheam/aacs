import { SubmissionProgress } from "@/types";

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

export const getSubmissionProgress = async (
  submissionId: string
): Promise<SubmissionProgress> => {
  return apiFetch<SubmissionProgress>(
    `/api/submissions/${submissionId}/status`
  );
};