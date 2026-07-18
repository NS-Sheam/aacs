import { AuditLog } from "../auditLog/auditLog.model";
import { Result } from "../result/result.model";
import { Submission } from "../submission/submission.model";
import { IReviewQueue, ReviewQueue } from "./reviewQueue.model";

export interface ResolveResult {
  item: IReviewQueue;
  updatedScore: { totalScore: number; maxScore: number };
}

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
): Promise<ResolveResult | null> => {
  const item = await ReviewQueue.findByIdAndUpdate(
    itemId,
    {
      status: "resolved",
      decision,
      resolvedBy,
      resolvedAt: new Date(),
    },
    { returnDocument: "after" },
  );

  if (!item) return null;

  // Update the corresponding result. Mark autoCommitted so the instructor
  // decision is treated as final, same as auto-committed results.
  await Result.findByIdAndUpdate(item.resultId, {
    correct: decision === "pass",
    message: `Instructor decision: ${decision} — by ${resolvedBy}`,
    status: decision,
    autoCommitted: true,
  });

  // Recalculate the submission's total score from all of its results.
  // maxScore sums every result's marks (matching checkWorker's scoring), so
  // resolving a flagged item never shrinks the denominator — only totalScore
  // moves as correctness changes.
  const allResults = await Result.find({ submissionId: item.submissionId });

  let totalScore = 0;
  let maxScore = 0;
  for (const r of allResults) {
    maxScore += r.marks || 0;
    if (r.correct) totalScore += r.marks || 0;
  }

  await Submission.findByIdAndUpdate(item.submissionId, {
    totalScore,
    maxScore,
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

  return { item, updatedScore: { totalScore, maxScore } };
};

export const ReviewQueueServices = {
  getPending,
  resolve,
};
