import { Worker, Job, ConnectionOptions } from "bullmq";
import { checkGitHubRepo } from "../checker/github/githubChecker";
import { CheckJobData } from "./checkQueue";
import { Submission } from "../modules/submission/submission.model";
import { Result } from "../modules/result/result.model";
import { AuditLog } from "../modules/auditLog/auditLog.model";
import { connection } from "../config/redis";

const worker = new Worker<CheckJobData>(
  "check-queue",
  async (job: Job<CheckJobData>) => {
    const { submissionId, assignmentId, liveUrl, githubUrl } = job.data;

    console.log(`\nProcessing job ${job.id} — submission: ${submissionId}`);

    // Update submission status to running
    await Submission.findByIdAndUpdate(submissionId, {
      status: "running",
    });

    try {
      // Step 1 — GitHub check (always runs first, deterministic)
      console.log(`Running GitHub check for: ${githubUrl}`);
      const githubResult = await checkGitHubRepo(githubUrl);

      // Save GitHub result to results collection
      await Result.create({
        submissionId,
        assignmentId,
        section: "GitHub",
        reqKey: "github-activity",
        description: "GitHub repository activity check",
        status:
          githubResult.repoExists && !githubResult.error ? "pass" : "fail",
        correct: githubResult.repoExists && !githubResult.error,
        message:
          githubResult.error ||
          `${githubResult.totalCommits} commits · last commit: ${githubResult.lastCommitDate}`,
        automationTier: 1,
        confidence: 1.0,
        autoCommitted: true,
        evidence: {
          domSnapshot: JSON.stringify(githubResult),
        },
      });

      // Write to audit log
      await AuditLog.create({
        submissionId,
        action: "auto-committed",
        decision: githubResult.repoExists ? "pass" : "fail",
        reasoning: "GitHub checker — deterministic result",
        performedBy: "system",
        confidence: 1.0,
      });

      // Step 2 — Playwright Tier 1 checks (plugged in Day 3)
      console.log(`Playwright Tier 1 — placeholder, Day 3`);

      // Step 3 — Update submission to completed
      await Submission.findByIdAndUpdate(submissionId, {
        status: "completed",
        "progress.completedChecks": 1,
        "progress.totalChecks": 1,
      });

      console.log(`Job ${job.id} completed`);
      return { success: true, submissionId };
    } catch (err: any) {
      console.error(`Job ${job.id} failed:`, err.message);

      await Submission.findByIdAndUpdate(submissionId, {
        status: "error",
        errorMessage: err.message,
      });

      await AuditLog.create({
        submissionId,
        action: "error",
        reasoning: err.message,
        performedBy: "system",
      });

      throw err;
    }
  },
  {
    connection: connection as ConnectionOptions,
    concurrency: 5,
  },
);

worker.on("completed", (job: Job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job: Job | undefined, err: Error) => {
  console.error(`Job ${job?.id} failed: ${err.message}`);
});

worker.on("error", (err: Error) => {
  console.error("Worker error:", err);
});

export default worker;
