export type SubmissionStatus = 'queued' | 'running' | 'completed' | 'error'

export interface SubmissionProgress {
  status: SubmissionStatus;
  progress: {
    completedChecks: number;
    totalChecks: number;
  };
}

export interface Requirement {
  description: string;
  correct: boolean;
  number: number;
  message: string;
  checkType?: string;
  automationTier?: number;
  selectors?: string[];
  requiredState?: Record<string, any> | null;
  confidence?: number;
  rules?: Array<{
    kind: "exists" | "count" | "position" | "text" | "style";
    target?: string;
    selectorHint?: string;
    expected?: any;
    position?: "left" | "center" | "right" | "top" | "bottom";
  }>;
  confidenceThreshold?: number;
}

export interface AssignmentJSON {
  assignmentNo: number;
  batch: number;
  title: string;
  figmaUrl?: string;
  originalRequirements: Record<string, Record<string, Requirement>>;
}

export interface Assignment {
  _id: string;
  assignmentNo: number;
  batch: number;
  title: string;
  figmaUrl?: string;
  status: 'draft' | 'active' | 'archived';
  version: number;
  originalRequirements: Record<string, Record<string, Requirement>>;
  enrichedRequirements?: Record<string, Record<string, Requirement>>;
  createdAt?: string;
  updatedAt?: string;
  submissionCount?: number;
}