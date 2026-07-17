import { Worker, Job, ConnectionOptions } from "bullmq";
import { checkGitHubRepo } from "../checker/github/githubChecker";
import { CheckJobData } from "./checkQueue";
import { Submission } from "../modules/submission/submission.model";
import { Assignment } from "../modules/assignment/assignment.model";
import { Result } from "../modules/result/result.model";
import { ReviewQueue } from "../modules/reviewQueue/reviewQueue.model";
import { AuditLog } from "../modules/auditLog/auditLog.model";
import { connection } from "../config/redis";
import { runTier1Checks } from "../../checker/playwright/playwrightRunner";
import { runTier2Checks } from "../../checker/playwright/tier2Runner";
import { confidenceRouter } from "../../checker/router/confidenceRouter";
import { takeResponsiveScreenshots } from "../../checker/playwright/screenshotEngine";

// ── Fix 1: correct import paths ──────────────────────────────────────────────

const worker = new Worker<CheckJobData>(
  "check-queue",
  async (job: Job<CheckJobData>) => {
    const { submissionId, assignmentId, liveUrl, githubUrl } = job.data;
    console.log(`\nJob ${job.id} started — submission: ${submissionId}`);

    // Mark running
    await Submission.findByIdAndUpdate(submissionId, { status: "running" });

    try {
      // ── Step 1: GitHub check ──────────────────────────────────────────
      console.log(`[1/4] GitHub check → ${githubUrl}`);
      const githubResult = await checkGitHubRepo(githubUrl);

      // ── Fix 2: null guard ─────────────────────────────────────────────
      if (!githubResult) {
        throw new Error(`GitHub checker returned null for: ${githubUrl}`);
      }

      const githubStatus =
        githubResult.repoExists && !githubResult.error ? "pass" : "fail";

      let githubMessage = "";
      if (githubResult.error) {
        githubMessage = githubResult.error;
      } else {
        githubMessage = `${githubResult.totalCommits} commits · last commit: ${githubResult.lastCommitDate}`;
        if (githubResult.allCommitsSameDay) {
          githubMessage += " · ⚠ All commits on same day";
        }
        if (!githubResult.hasReadme) {
          githubMessage += " · ⚠ README missing";
        }
      }

      const githubResultDoc = await Result.create({
        submissionId,
        assignmentId,
        section: "GitHub",
        reqKey: "github-activity",
        description: "GitHub repository activity check",
        marks: 0,
        status: githubStatus,
        correct: githubStatus === "pass",
        message: githubMessage,
        automationTier: 1,
        confidence: 1.0,
        autoCommitted: true,
        evidence: { domSnapshot: JSON.stringify(githubResult) },
      });

      await AuditLog.create({
        submissionId,
        resultId: githubResultDoc._id,
        action: "auto-committed",
        decision: githubStatus,
        reasoning: "GitHub checker — deterministic, confidence 1.0",
        performedBy: "system",
        confidence: 1.0,
      });

      // ── Step 2: Load enriched requirements ───────────────────────────
      console.log(`[2/4] Loading enriched requirements…`);

      // ── Fix 3: include dbSeedConfig for Tier 2 ───────────────────────
      const assignment = await Assignment.findById(assignmentId).select(
        "enrichedRequirements originalRequirements confidenceThreshold dbSeedConfig",
      );

      if (!assignment) {
        throw new Error(`Assignment not found: ${assignmentId}`);
      }

      // Fallback to original if enrichment not done yet
      let reqs =
        assignment.enrichedRequirements || assignment.originalRequirements;
      if (reqs && reqs.requirements) {
        reqs = reqs.requirements;
      }

      const threshold = assignment.confidenceThreshold ?? 0.75;

      // Count total checks for progress tracking
      let totalChecks = 1; // GitHub = 1
      for (const section of Object.values(reqs)) {
        for (const [reqKey, req] of Object.entries(
          section as Record<string, any>,
        )) {
          if (!reqKey.startsWith("sub_req")) {
            const tier = (req as any).automationTier;
            if (tier === 1 || tier === 2) totalChecks++;
          }
        }
      }

      await Submission.findByIdAndUpdate(submissionId, {
        "progress.totalChecks": totalChecks,
        "progress.completedChecks": 1, // GitHub done
      });

      // ── Step 3: Playwright Tier 1 checks ─────────────────────────────
      console.log(`[3/4] Playwright Tier 1 → ${liveUrl}`);
      const tier1Results = await runTier1Checks(liveUrl, reqs);

      // ── Step 4: Playwright Tier 2 checks ─────────────────────────────
      // Fix 4: only run Tier 2 if assignment has dbSeedConfig roles
      let tier2Results: Awaited<ReturnType<typeof runTier2Checks>> = [];

      const roles = assignment.dbSeedConfig?.roles;
      if (roles && roles.length > 0) {
        console.log(`[4/4] Playwright Tier 2 → ${liveUrl}`);
        try {
          tier2Results = await runTier2Checks(liveUrl, reqs, roles);
        } catch (err: any) {
          // Tier 2 failure is non-blocking — log and continue
          console.warn(`Tier 2 checks failed (non-blocking): ${err.message}`);
        }
      } else {
        console.log(`[4/4] Tier 2 skipped — no dbSeedConfig roles defined`);
      }

      const allPlaywrightResults = [...tier1Results, ...tier2Results];

      // ── Step 5: Process all results ───────────────────────────────────
      let completedChecks = 1; // GitHub already counted
      let totalScore = 0;
      let maxScore = 0;
      let autoCommittedCount = 1; // GitHub
      let flaggedCount = 0;

      // Fix 5: batch DB progress updates — only every 5 checks
      const PROGRESS_BATCH_SIZE = 5;

      for (const check of allPlaywrightResults) {
        const routed = confidenceRouter(check.confidence, threshold);

        const resultDoc = await Result.create({
          submissionId,
          assignmentId,
          section: check.section,
          reqKey: check.reqKey,
          description: check.description,
          marks: check.marks,
          status: routed.autoCommit
            ? check.result.pass
              ? "pass"
              : "fail"
            : "needsReview",
          correct: routed.autoCommit ? check.result.pass : false,
          message: routed.autoCommit
            ? check.result.pass
              ? `Passed — ${check.result.selectorUsed || "element found"}`
              : check.result.error ||
                "Failed — element not found or condition not met"
            : "Flagged for instructor review — confidence below threshold",
          automationTier: check.automationTier,
          confidence: check.confidence,
          autoCommitted: routed.autoCommit,
          evidence: {
            selectorUsed: check.result.selectorUsed,
            domSnapshot: JSON.stringify(check.result),
          },
        });

        // Route to review queue if low confidence
        if (!routed.autoCommit) {
          await ReviewQueue.create({
            submissionId,
            resultId: resultDoc._id,
            section: check.section,
            reqKey: check.reqKey,
            description: check.description,
            marks: check.marks,
            automatedResult: check.result.pass ? "pass" : "fail",
            aiReasoning:
              `Confidence: ${check.confidence} — below threshold ${threshold}. ${
                check.result.error || ""
              }`.trim(),
            confidence: check.confidence,
            evidence: {
              selectorUsed: check.result.selectorUsed,
              domSnapshot: JSON.stringify(check.result),
            },
            status: "pending",
          });
          flaggedCount++;
        } else {
          autoCommittedCount++;
        }

        // Audit log every result
        await AuditLog.create({
          submissionId,
          resultId: resultDoc._id,
          action: routed.autoCommit ? "auto-committed" : "flagged",
          decision: check.result.pass ? "pass" : "fail",
          reasoning: routed.autoCommit
            ? `Confidence ${check.confidence} ≥ threshold ${threshold}`
            : `Confidence ${check.confidence} < threshold ${threshold}`,
          performedBy: "system",
          confidence: check.confidence,
        });

        // Score tracking
        maxScore += check.marks;
        if (routed.autoCommit && check.result.pass) {
          totalScore += check.marks;
        }

        completedChecks++;

        // Fix 5: batch progress update — only every N checks or on last
        const isLast = completedChecks === totalChecks;
        if (completedChecks % PROGRESS_BATCH_SIZE === 0 || isLast) {
          await Submission.findByIdAndUpdate(submissionId, {
            "progress.completedChecks": completedChecks,
          });
        }
      }

      // ── Step 6: Take responsive screenshots (non-blocking) ───────────
      console.log(`Taking responsive screenshots…`);
      try {
        await takeResponsiveScreenshots(liveUrl, submissionId);
      } catch (err: any) {
        console.warn(`Screenshots failed (non-blocking): ${err.message}`);
      }

      // ── Step 7: Mark completed + write final score ────────────────────
      await Submission.findByIdAndUpdate(submissionId, {
        status: "completed",
        totalScore,
        maxScore,
        autoCommitted: autoCommittedCount,
        flagged: flaggedCount,
        "progress.completedChecks": totalChecks,
        "progress.totalChecks": totalChecks,
      });

      console.log(
        `✓ Job ${job.id} completed — score: ${totalScore}/${maxScore} · auto: ${autoCommittedCount} · flagged: ${flaggedCount}`,
      );

      return { success: true, submissionId, totalScore, maxScore };
    } catch (err: any) {
      console.error(`✗ Job ${job.id} failed: ${err.message}`);

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

      throw err; // rethrow so BullMQ marks job as failed and retries
    }
  },
  { connection: connection as ConnectionOptions, concurrency: 5 },
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
