import { AuditLog } from "../auditLog/auditLog.model";
import { Result } from "../result/result.model";
import { IReviewQueue, ReviewQueue } from "./reviewQueue.model";

// Get all pending flagged items, optionally scoped to a submission
const getPending = async (
  submissionId?: string,
): Promise<IReviewQueue[]> => {
  const query: Record<string, any> = { status: "pending" };
  if (submissionId) query.submissionId = submissionId;
  return ReviewQueue.find(query).sort({ createdAt: -1 });
};

// Instructor override — pass or fail a flagged item
const resolve = async (
  itemId: string,
  decision: "pass" | "fail",
  resolvedBy: string,
): Promise<IReviewQueue | null> => {
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

  // Update the corresponding result
  await Result.findByIdAndUpdate(item.resultId, {
    correct: decision === "pass",
    message: `Instructor decision: ${decision}`,
    status: decision,
  });

  // Write to audit log
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
};

export const ReviewQueueServices = {
  getPending,
  resolve,
};
