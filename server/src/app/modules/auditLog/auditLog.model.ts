import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
  submissionId?: mongoose.Types.ObjectId;
  resultId?: mongoose.Types.ObjectId;
  action: "auto-committed" | "flagged" | "instructor-override" | "error";
  decision?: string;
  reasoning?: string;
  performedBy: string;
  confidence?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: "Submission" },
    resultId: { type: Schema.Types.ObjectId, ref: "Result" },
    action: {
      type: String,
      enum: ["auto-committed", "flagged", "instructor-override", "error"],
      required: true,
    },
    decision: { type: String },
    reasoning: { type: String },
    performedBy: { type: String, default: "system" },
    confidence: { type: Number, min: 0, max: 1 },
  },
  { timestamps: true },
);

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
