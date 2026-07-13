export type SubmissionStatus = 'queued' | 'running' | 'completed' | 'error'

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
  description: string
  correct: boolean
  number: number
  message: string
  batch?: string
  assignmentNo?: string
}