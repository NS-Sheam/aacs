import mongoose, { Document, Schema } from "mongoose";

export interface ISubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentName?: string;
  studentEmail?: string;
  liveUrl: string;
  githubUrl: string;
  status: "queued" | "running" | "completed" | "error";
  progress: { completedChecks: number; totalChecks: number };
  totalScore?: number;
  maxScore?: number;
  autoCommitted?: number;
  flagged?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    studentName: { type: String },
    studentEmail: { type: String },
    liveUrl: { type: String, required: true },
    githubUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "error"],
      default: "queued",
    },
    progress: {
      completedChecks: { type: Number, default: 0 },
      totalChecks: { type: Number, default: 0 },
    },
    totalScore: { type: Number },
    maxScore: { type: Number },
    autoCommitted: { type: Number },
    flagged: { type: Number },
    errorMessage: { type: String },
  },
  { timestamps: true },
);

export const Submission = mongoose.model<ISubmission>(
  "Submission",
  SubmissionSchema,
);
