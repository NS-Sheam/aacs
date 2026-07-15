import { ReviewQueue } from "./reviewQueue.model";
import { Result } from "../result/result.model";
import { AuditLog } from "../auditLog/auditLog.model";

export const reviewQueueService = {
  // Get pending review items — optionally filter by submissionId
  async getPending(submissionId?: string) {
    const query: Record<string, any> = { status: "pending" };
    if (submissionId) query.submissionId = submissionId;
    return ReviewQueue.find(query).sort({ createdAt: -1 });
  },

  // Instructor resolves a flagged item — updates result + writes audit log
  async resolve(
    itemId: string,
    decision: "pass" | "fail",
    resolvedBy: string,
  ) {
    const item = await ReviewQueue.findByIdAndUpdate(
      itemId,
      {
        status: "resolved",
        decision,
        resolvedBy,
        resolvedAt: new Date(),
      },
      { new: true },
    );

    if (!item) return null;

    // Sync the result document with instructor decision
    await Result.findByIdAndUpdate(item.resultId, {
      correct: decision === "pass",
      message: `Instructor decision: ${decision} — resolved by ${resolvedBy}`,
      status: decision === "pass" ? "pass" : "fail",
    });

    // Write audit log entry
    await AuditLog.create({
      submissionId: item.submissionId,
      resultId: item.resultId,
      action: "instructor-override",
      decision,
      reasoning: `Resolved by ${resolvedBy}`,
      performedBy: resolvedBy,
      confidence: item.confidence,
    });

    return item;
  },
};
