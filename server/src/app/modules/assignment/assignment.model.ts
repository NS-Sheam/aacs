// server/src/models/Assignment.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IAssignment extends Document {
  assignmentNo: number;
  batch: number;
  title: string;
  figmaUrl?: string;
  originalRequirements: Record<string, any>;
  enrichedRequirements?: Record<string, any>;
  dbSeedConfig?: {
    roles: Array<{ role: string; email: string; password: string }>;
    sampleData?: Record<string, any>;
  };
  confidenceThreshold: number;
  status: "draft" | "active" | "archived";
  version: number;
  lastUpdatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    assignmentNo: { type: Number, required: true },
    batch: { type: Number, required: true },
    title: { type: String, required: true },
    figmaUrl: { type: String },
    originalRequirements: { type: Schema.Types.Mixed, required: true },
    enrichedRequirements: { type: Schema.Types.Mixed },
    dbSeedConfig: {
      roles: [
        {
          role: { type: String },
          email: { type: String },
          password: { type: String },
        },
      ],
      sampleData: { type: Schema.Types.Mixed },
    },
    confidenceThreshold: { type: Number, default: 0.75 },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
    },
    version: { type: Number, default: 1 },
    lastUpdatedBy: { type: String },
  },
  { timestamps: true },
);

// Compound unique index — one assignment per batch per assignmentNo
AssignmentSchema.index({ assignmentNo: 1, batch: 1 }, { unique: true });

export const Assignment = mongoose.model<IAssignment>(
  "Assignment",
  AssignmentSchema,
);
