/* eslint-disable @typescript-eslint/no-explicit-any */
export type SubmissionStatus = 'queued' | 'active' | 'completed' | 'error'

export interface SubmissionProgress {
  status: SubmissionStatus;
  progress: {
    completedChecks: number;
    totalChecks: number;
  };
}

export interface AssignmentJSON {
  description: string
  correct: string
  number: string
  message: string
}

export interface Assignment {
  _id: string
  title: string
  batch: number
  assignmentNo: number
  status: string
  version: number
  figmaUrl: string
  originalRequirements: Record<string, any>
  updatedAt: string
  submissionCount?: number
  
}

export interface GitHubCheckResult {
  repoExists: boolean;
  isPrivate: boolean;
  totalCommits: number;
  lastCommitDate: string | null;
  lastCommitMessage: string | null;
  hasReadme: boolean;
  commitSpreadFlag: boolean;
  allCommitsSameDay: boolean;
  error?: string;
}

export interface AssignmentUpload{
  title: string,
  batch: number,
  assignmentNo: number,
  figmaUrl?: string,
  originalRequirements: Record<string, any>
}

export interface SubmissionAssignment {
  assignmentId: string;
  studentName: string;
  liveUrl: string;
  githubUrl: string;
        
}

export interface ReviewItem {
  _id: string;
  section: string;
  reqKey: string;
  description: string;
  marks: number;
  automatedResult: string;
  aiReasoning: string;
  confidence: number;
  status: string;
  decision?: string;
}