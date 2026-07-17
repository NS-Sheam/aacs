import mongoose from "mongoose";
import { checkQueue } from "../../worker/checkQueue";
import { ISubmission, Submission } from "./submission.model";
import { ReviewQueue } from "../reviewQueue/reviewQueue.model";
import { Result } from "../result/result.model";

export interface CreateSubmissionDTO {
  assignmentId: string;
  studentName?: string;
  liveUrl: string;
  githubUrl: string;
}

export interface CreateSubmissionDTO {
  assignmentId: string;
  studentName?: string;
  liveUrl: string;
  githubUrl: string;
  duplicateResolution?: 'overwrite' | 'keep_previous' | 'keep_both';
}

// Create submission record and enqueue BullMQ job
const createSubmission = async (
  data: CreateSubmissionDTO,
): Promise<ISubmission & { isDuplicate?: boolean; existingSubmissionId?: string }> => {
  // Validate URLs
  if (!data.liveUrl.startsWith("http")) {
    throw new Error("liveUrl must be a valid URL starting with http");
  }
  if (!data.githubUrl.includes("github.com")) {
    throw new Error("githubUrl must be a valid GitHub URL");
  }

  // Check for duplicate submission (same studentName and assignmentId)
  if (data.studentName) {
    const existing = await Submission.findOne({
      assignmentId: data.assignmentId,
      studentName: data.studentName,
    }).sort({ createdAt: -1 });

    if (existing) {
      if (!data.duplicateResolution) {
        // Return duplicate status so controller can send 409
        const duplicateErrorObj = new Error("Duplicate submission detected") as any;
        duplicateErrorObj.statusCode = 409;
        duplicateErrorObj.existingSubmission = existing;
        throw duplicateErrorObj;
      }

      if (data.duplicateResolution === "keep_previous") {
        return existing;
      }

      if (data.duplicateResolution === "overwrite") {
        // Delete existing submission, results, and reviews
        await Submission.findByIdAndDelete(existing._id);
        await Result.deleteMany({ submissionId: existing._id });
        await ReviewQueue.deleteMany({ submissionId: existing._id });
      }
      // If 'keep_both', we just fall through and create a new one!
    }
  }

  const nameStr = data.studentName || "";
  const emailMatch = nameStr.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  const studentEmail = emailMatch ? emailMatch[1] : "";
  const studentNameClean = emailMatch ? nameStr.replace(emailMatch[0], "").replace(/[()]/g, "").trim() : nameStr;

  const submission = await Submission.create({
    assignmentId: data.assignmentId,
    studentName: studentNameClean || nameStr,
    studentEmail: studentEmail || undefined,
    liveUrl: data.liveUrl,
    githubUrl: data.githubUrl,
    status: "queued",
    progress: { completedChecks: 0, totalChecks: 0 },
  });

  // Enqueue job immediately — non-blocking
  await checkQueue.add("run-checks", {
    submissionId: submission._id.toString(),
    assignmentId: data.assignmentId,
    liveUrl: data.liveUrl,
    githubUrl: data.githubUrl,
  });

  return submission;
};

// Get submission status + progress
const getSubmissionStatus = async (
  id: string,
): Promise<{
  status: string;
  progress: { completedChecks: number; totalChecks: number };
  totalScore?: number;
  maxScore?: number;
} | null> => {
  const sub = await Submission.findById(id).select(
    "status progress totalScore maxScore errorMessage",
  );
  if (!sub) return null;
  return {
    status: sub.status,
    progress: sub.progress,
    totalScore: sub.totalScore,
    maxScore: sub.maxScore,
  };
};

// Get all submissions for an assignment
const getSubmissionByAssignment = async (
  assignmentId: string,
): Promise<ISubmission[]> => {
  return Submission.find({ assignmentId })
    .select("-__v")
    .sort({ createdAt: -1 });
};

// Get single submission with full data
const getSubmissionById = async (id: string): Promise<ISubmission | null> => {
  return Submission.findById(id);
};

// Get all submissions
const getAllSubmissions = async (): Promise<ISubmission[]> => {
  return Submission.find({})
    .populate("assignmentId", "title batch assignmentNo")
    .select("-__v")
    .sort({ createdAt: -1 });
};

// Get aggregated verification stats
const getStats = async () => {
  const total = await Submission.countDocuments();
  const autoChecked = await Submission.countDocuments({ status: "completed" });
  const failed = await Submission.countDocuments({ status: "error" });
  const needsReview = await ReviewQueue.countDocuments({ status: "pending" });

  return {
    total,
    autoChecked,
    needsReview,
    failed,
  };
};

// Re-queue existing submission for checking
const recheckSubmission = async (id: string): Promise<ISubmission> => {
  const submission = await Submission.findById(id);
  if (!submission) {
    throw new Error("Submission not found");
  }

  // 1. Reset submission status and progress
  submission.status = "queued";
  submission.progress = { completedChecks: 0, totalChecks: 0 };
  submission.totalScore = undefined;
  submission.errorMessage = undefined;
  await submission.save();

  // 2. Delete old Results and ReviewQueue items for this submission
  await Result.deleteMany({ submissionId: id });
  await ReviewQueue.deleteMany({ submissionId: id });

  // 3. Re-queue checks job in BullMQ
  await checkQueue.add("run-checks", {
    submissionId: submission._id.toString(),
    assignmentId: submission.assignmentId.toString(),
    liveUrl: submission.liveUrl,
    githubUrl: submission.githubUrl,
  });

  return submission;
};

export const SubmissionServices = {
  create: createSubmission,
  getStatus: getSubmissionStatus,
  getByAssignment: getSubmissionByAssignment,
  getById: getSubmissionById,
  getAll: getAllSubmissions,
  getStats,
  recheck: recheckSubmission,
};
