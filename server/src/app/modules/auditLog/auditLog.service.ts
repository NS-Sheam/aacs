import { AuditLog, IAuditLog } from "./auditLog.model";

export const auditLogService = {
  // Get full audit trail for a submission — ordered oldest first
  async getBySubmission(submissionId: string): Promise<IAuditLog[]> {
    return AuditLog.find({ submissionId }).sort({ createdAt: 1 });
  },

  // Log any action — called by the worker and review queue
  async log(data: {
    submissionId?: string;
    resultId?: string;
    action: "auto-committed" | "flagged" | "instructor-override" | "error";
    decision?: string;
    reasoning?: string;
    performedBy?: string;
    confidence?: number;
  }): Promise<IAuditLog> {
    return AuditLog.create({
      ...data,
      performedBy: data.performedBy || "system",
    });
  },
};
