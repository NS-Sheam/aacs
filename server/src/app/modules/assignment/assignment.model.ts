import mongoose, { Document, Schema } from "mongoose";

export interface IAssignment extends Document {
  title: string;
  batch: number;
  figmaUrl?: string;
  originalRequirements: Record<string, any>;
  enrichedRequirements?: Record<string, any>;
  dbSeedConfig?: {
    roles: Array<{ role: string; email: string; password: string }>;
    sampleData?: Record<string, any>;
  };
  confidenceThreshold: number;
  status: "draft" | "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    batch: { type: Number, required: true },
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
  },
  { timestamps: true },
);

export const Assignment = mongoose.model<IAssignment>(
  "Assignment",
  AssignmentSchema,
);
