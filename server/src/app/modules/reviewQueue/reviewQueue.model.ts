import mongoose, { Document, Schema } from "mongoose";

export interface IReviewQueue extends Document {
  submissionId: mongoose.Types.ObjectId;
  resultId: mongoose.Types.ObjectId;
  section: string;
  reqKey: string;
  description?: string;
  marks?: number;
  automatedResult: string;
  aiReasoning?: string;
  confidence?: number;
  evidence?: Record<string, any>;
  status: "pending" | "resolved";
  decision?: "pass" | "fail";
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewQueueSchema = new Schema<IReviewQueue>(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
    },
    resultId: { type: Schema.Types.ObjectId, ref: "Result", required: true },
    section: { type: String },
    reqKey: { type: String },
    description: { type: String },
    marks: { type: Number },
    automatedResult: { type: String, required: true },
    aiReasoning: { type: String },
    confidence: { type: Number, min: 0, max: 1 },
    evidence: { type: Schema.Types.Mixed },
    status: { type: String, enum: ["pending", "resolved"], default: "pending" },
    decision: { type: String, enum: ["pass", "fail"] },
    resolvedBy: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

export const ReviewQueue = mongoose.model<IReviewQueue>(
  "ReviewQueue",
  ReviewQueueSchema,
);
