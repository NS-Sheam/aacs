import mongoose, { Document, Schema } from "mongoose";

export interface IResult extends Document {
  submissionId: mongoose.Types.ObjectId;
  assignmentId: mongoose.Types.ObjectId;
  section: string;
  reqKey: string;
  description?: string;
  marks?: number;
  status: "pass" | "fail" | "error" | "needsReview";
  correct: boolean;
  message: string;
  automationTier?: number;
  confidence?: number;
  autoCommitted: boolean;
  evidence?: {
    screenshotPath?: string;
    domSnapshot?: string;
    selectorUsed?: string;
  };
  obtainedMarks?: number;
  instructorFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
    },
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    section: { type: String, required: true },
    reqKey: { type: String, required: true },
    description: { type: String },
    marks: { type: Number },
    status: {
      type: String,
      enum: ["pass", "fail", "error", "needsReview"],
      required: true,
    },
    correct: { type: Boolean, required: true },
    message: { type: String, required: true },
    automationTier: { type: Number },
    confidence: { type: Number, min: 0, max: 1 },
    autoCommitted: { type: Boolean, default: false },
    evidence: {
      screenshotPath: { type: String },
      domSnapshot: { type: String },
      selectorUsed: { type: String },
    },
    obtainedMarks: { type: Number },
    instructorFeedback: { type: String },
  },
  { timestamps: true },
);

export const Result = mongoose.model<IResult>("Result", ResultSchema);
