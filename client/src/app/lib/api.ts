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
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      errorMessage = errBody?.message || errBody?.error || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}


export const createAssignment = async (
  assignment: AssignmentJSON
): Promise<{ assignmentId : string }> => {
  const result = await apiFetch<{
    success: boolean;
    data: { assignmentId: string };
  }>("/api/v1/assignments", {
    method: "POST",
    body: JSON.stringify(assignment),
  });
  return { assignmentId: result.data.assignmentId };
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
  const result = await apiFetch<{
    success: boolean;
    data: any[];
  }>("/api/v1/assignments");

  const allAssignments = result.data || [];

  // 1. Extract unique batches & assignment numbers
  const batchesSet = new Set<string>();
  const assignmentNosSet = new Set<string>();
  allAssignments.forEach((a) => {
    if (a.batch !== undefined && a.batch !== null) batchesSet.add(String(a.batch));
    if (a.assignmentNo !== undefined && a.assignmentNo !== null) assignmentNosSet.add(String(a.assignmentNo));
  });

  const batches = Array.from(batchesSet).sort((a, b) => Number(b) - Number(a));
  const assignmentNumbers = Array.from(assignmentNosSet).sort((a, b) => Number(a) - Number(b));

  // 2. Filter in memory
  let filtered = allAssignments;
  if (params.batch) filtered = filtered.filter((a) => String(a.batch) === String(params.batch));
  if (params.assignment) filtered = filtered.filter((a) => String(a.assignmentNo) === String(params.assignment));

  // 3. Flatten enrichedRequirements (preferred) or originalRequirements
  let flattenedRequirements: any[] = [];
  filtered.forEach((a) => {
    // Prefer enriched (has automationTier, checkType, etc)
    const source = (a.enrichedRequirements && Object.keys(a.enrichedRequirements).length > 0)
      ? a.enrichedRequirements
      : a.originalRequirements || {};

    Object.entries(source).forEach(([sectionName, sectionReqs]: [string, any]) => {
      if (!sectionReqs || typeof sectionReqs !== "object") return;
      Object.entries(sectionReqs).forEach(([reqKey, req]: [string, any]) => {
        if (reqKey.startsWith("sub_req")) return;
        flattenedRequirements.push({
          _id: `${a._id}-${sectionName}-${reqKey}`,
          assignmentId: a._id,
          section: sectionName,
          reqKey,
          description: req.description || "",
          number: Number(req.number || req.marks || 1),
          message: req.message || "",
          automationTier: req.automationTier ?? 1,
          checkType: req.checkType || "static-ui",
          batch: String(a.batch),
          assignmentNo: String(a.assignmentNo),
          title: a.title,
        });
      });
    });
  });

  // 4. Search filter
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    flattenedRequirements = flattenedRequirements.filter(
      (r) =>
        (r.description || "").toLowerCase().includes(searchLower) ||
        (r.reqKey || "").toLowerCase().includes(searchLower) ||
        (r.section || "").toLowerCase().includes(searchLower) ||
        (r.title || "").toLowerCase().includes(searchLower)
    );
  }

  return {
    assignments: flattenedRequirements as Assignment[],
    batches,
    assignmentNumbers,
  };
}

export const fetchAssignmentsList = async (): Promise<Assignment[]> => {
  const response = await apiFetch<{ success: boolean; data: any[] }>("/api/v1/assignments");
  return response.data || [];
};

export const updateAssignment = async (
  id: string,
  data: Partial<AssignmentJSON>
): Promise<any> => {
  return apiFetch<any>(`/api/v1/assignments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const deleteAssignment = async (id: string): Promise<any> => {
  return apiFetch<any>(`/api/v1/assignments/${id}`, {
    method: "DELETE",
  });
};
export interface CreateSubmissionDTO {
  assignmentId: string;
  studentName?: string;
  liveUrl: string;
  githubUrl: string;
  duplicateResolution?: 'overwrite' | 'keep_previous' | 'keep_both';
}

export const submitStudentSubmission = async (
  data: CreateSubmissionDTO
): Promise<{ submissionId: string; isDuplicate?: boolean; existingSubmission?: any }> => {
  const url = `${API_URL}/api/v1/submissions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.status === 409) {
    const errBody = await response.json();
    return {
      submissionId: errBody.existingSubmission?._id || "",
      isDuplicate: true,
      existingSubmission: errBody.existingSubmission,
    };
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      errorMessage = errBody?.message || errBody?.error || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  const result = await response.json();
  return { submissionId: result.data._id };
};

export const getSubmissionResults = async (
  submissionId: string
): Promise<any[]> => {
  const response = await apiFetch<{ success: boolean; data: any[] }>(
    `/api/v1/results/submission/${submissionId}`
  );
  return response.data || [];
};

export const fetchDashboardStats = async (): Promise<{
  total: number;
  autoChecked: number;
  needsReview: number;
  failed: number;
}> => {
  const response = await apiFetch<{ success: boolean; data: any }>("/api/v1/submissions/stats");
  return response.data;
};

export const fetchSubmissionsList = async (): Promise<any[]> => {
  const response = await apiFetch<{ success: boolean; data: any[] }>("/api/v1/submissions");
  return response.data || [];
};

export const fetchReviewQueue = async (): Promise<any[]> => {
  const response = await apiFetch<{ success: boolean; data: any[] }>("/api/v1/review-queue");
  return response.data || [];
};

export const resolveReviewItem = async (
  itemId: string,
  status: "approved" | "rejected",
  notes?: string
): Promise<void> => {
  await apiFetch(`/api/v1/review-queue/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ status, notes }),
  });
};

export const recheckSubmission = async (
  submissionId: string
): Promise<{ submissionId: string }> => {
  const result = await apiFetch<{
    success: boolean;
    data: { _id: string };
  }>(`/api/v1/submissions/${submissionId}/recheck`, {
    method: "POST",
  });
  return { submissionId: result.data._id };
};

export const bulkRecheckSubmissions = async (
  submissionIds: string[]
): Promise<{ count: number }> => {
  const promises = submissionIds.map(id => recheckSubmission(id));
  await Promise.all(promises);
  return { count: submissionIds.length };
};