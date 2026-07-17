import { checkQueue } from "../../worker/checkQueue";
import { ISubmission, Submission } from "./submission.model";
import { Result } from "../result/result.model";
import { ReviewQueue } from "../reviewQueue/reviewQueue.model";

export interface CreateSubmissionDTO {
  assignmentId: string;
  studentName?: string;
  studentEmail?: string;
  liveUrl: string;
  githubUrl: string;
}

// Create submission record and enqueue BullMQ job
const createSubmission = async (
  data: CreateSubmissionDTO,
): Promise<ISubmission> => {
  // Validate URLs
  if (!data.liveUrl.startsWith("http")) {
    throw new Error("liveUrl must be a valid URL starting with http");
  }
  if (!data.githubUrl.includes("github.com")) {
    throw new Error("githubUrl must be a valid GitHub URL");
  }

  const submission = await Submission.create({
    ...data,
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

// Bulk create — portal submits many students at once.
// Per-item try/catch is intentional: one bad row must not abort the batch.
const createBulkSubmissions = async (
  submissions: CreateSubmissionDTO[],
): Promise<{
  success: Array<{ studentName?: string; submissionId: string }>;
  failed: Array<{ studentName?: string; error: string }>;
}> => {
  if (!Array.isArray(submissions) || submissions.length === 0) {
    throw new Error("submissions must be a non-empty array");
  }
  if (submissions.length > 50) {
    throw new Error("Maximum 50 submissions per bulk request");
  }

  const success: Array<{ studentName?: string; submissionId: string }> = [];
  const failed: Array<{ studentName?: string; error: string }> = [];

  for (const sub of submissions) {
    try {
      const created = await createSubmission(sub);
      success.push({
        studentName: sub.studentName,
        submissionId: created._id.toString(),
      });
    } catch (err) {
      failed.push({
        studentName: sub.studentName,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return { success, failed };
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

// Get submissions for an assignment, paginated (newest first)
const getSubmissionByAssignmentPaginated = async (
  assignmentId: string,
  page = 1,
  limit = 20,
): Promise<{
  submissions: ISubmission[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const skip = (safePage - 1) * safeLimit;

  const [submissions, total] = await Promise.all([
    Submission.find({ assignmentId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .select("-__v"),
    Submission.countDocuments({ assignmentId }),
  ]);

  return {
    submissions,
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit),
  };
};

// Get single submission with full data
const getSubmissionById = async (id: string): Promise<ISubmission | null> => {
  return Submission.findById(id);
};

const updateSubmission = async (
  id: string,
  data: Partial<CreateSubmissionDTO>,
): Promise<ISubmission | null> => {
  const submission = await Submission.findById(id);
  if (!submission) return null;

  if (data.studentName !== undefined) submission.studentName = data.studentName;
  if (data.studentEmail !== undefined) submission.studentEmail = data.studentEmail;

  let urlChanged = false;
  if (data.liveUrl !== undefined && data.liveUrl !== submission.liveUrl) {
    if (!data.liveUrl.startsWith("http")) {
      throw new Error("liveUrl must be a valid URL starting with http");
    }
    submission.liveUrl = data.liveUrl;
    urlChanged = true;
  }

  if (data.githubUrl !== undefined && data.githubUrl !== submission.githubUrl) {
    if (!data.githubUrl.includes("github.com")) {
      throw new Error("githubUrl must be a valid GitHub URL");
    }
    submission.githubUrl = data.githubUrl;
    urlChanged = true;
  }

  if (urlChanged) {
    submission.status = "queued";
    submission.progress = { completedChecks: 0, totalChecks: 0 };
    submission.totalScore = undefined;
    submission.maxScore = undefined;
    submission.errorMessage = undefined;

    await Result.deleteMany({ submissionId: id });
    await ReviewQueue.deleteMany({ submissionId: id });

    await checkQueue.add("run-checks", {
      submissionId: id,
      assignmentId: submission.assignmentId.toString(),
      liveUrl: submission.liveUrl,
      githubUrl: submission.githubUrl,
    });
  }

  await submission.save();
  return submission;
};

const recheckSubmission = async (id: string): Promise<ISubmission | null> => {
  const submission = await Submission.findById(id);
  if (!submission) return null;

  submission.status = "queued";
  submission.progress = { completedChecks: 0, totalChecks: 0 };
  submission.totalScore = undefined;
  submission.maxScore = undefined;
  submission.errorMessage = undefined;

  await Result.deleteMany({ submissionId: id });
  await ReviewQueue.deleteMany({ submissionId: id });

  await checkQueue.add("run-checks", {
    submissionId: id,
    assignmentId: submission.assignmentId.toString(),
    liveUrl: submission.liveUrl,
    githubUrl: submission.githubUrl,
  });

  await submission.save();
  return submission;
};

const getAllSubmissions = async (): Promise<ISubmission[]> => {
  return Submission.find()
    .populate("assignmentId", "title assignmentNo batch")
    .sort({ createdAt: -1 });
};

export const SubmissionServices = {
  create: createSubmission,
  createBulk: createBulkSubmissions,
  getStatus: getSubmissionStatus,
  getByAssignment: getSubmissionByAssignment,
  getByAssignmentPaginated: getSubmissionByAssignmentPaginated,
  getById: getSubmissionById,
  update: updateSubmission,
  recheck: recheckSubmission,
  getAll: getAllSubmissions,
};
