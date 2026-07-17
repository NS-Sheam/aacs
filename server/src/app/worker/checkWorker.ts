import { Worker, Job, ConnectionOptions } from "bullmq";
import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import { connection } from "../config/redis";
import { Assignment } from "../modules/assignment/assignment.model";
import { AuditLog } from "../modules/auditLog/auditLog.model";
import { Result } from "../modules/result/result.model";
import { ReviewQueue } from "../modules/reviewQueue/reviewQueue.model";
import { Submission } from "../modules/submission/submission.model";
import { checkGitHubRepo } from "../checker/github/githubChecker";
import { enrichAssignmentRequirements } from "../checker/ai/intentParser";
import { runTier1Check } from "../checker/playwright/tier1Checks";
import { createAuthContext, createGuestContext } from "../../checker/sessions/sessionManager";
import { CheckJobData } from "./checkQueue";
import { generateJSONContentWithImage, generateJSONContent } from "../helpers/gemini";
import { broadcastSseEvent } from "../helpers/sse";

let sharedBrowser: any = null;

async function getSharedBrowser() {
  if (!sharedBrowser || !sharedBrowser.isConnected()) {
    console.log("Launching shared Chromium browser instance...");
    sharedBrowser = await chromium.launch({ headless: true });
  }
  return sharedBrowser;
}

const worker = new Worker<CheckJobData>(
  "check-queue",
  async (job: Job<CheckJobData>) => {
    const { submissionId, assignmentId, liveUrl, githubUrl } = job.data;

    console.log(`\nProcessing job ${job.id} — submission: ${submissionId}`);

    // Update submission status to running
    await Submission.findByIdAndUpdate(submissionId, {
      status: "running",
    });

    // Ensure screenshots folder exists
    const screenshotsDir = path.resolve(process.cwd(), "logs/screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    try {
      // 1. Fetch submission and assignment
      const submission = await Submission.findById(submissionId);
      if (!submission) throw new Error("Submission not found");

      let assignment = await Assignment.findById(assignmentId);
      if (!assignment) throw new Error("Assignment not found");

      // 2. Auto-enrich requirements if they aren't enriched yet
      if (!assignment.enrichedRequirements || Object.keys(assignment.enrichedRequirements).length === 0) {
        console.log(`Assignment requirements not enriched yet. Running AI Intent Parser...`);
        const enriched = await enrichAssignmentRequirements(assignment.originalRequirements);
        assignment = await Assignment.findByIdAndUpdate(
          assignmentId,
          { enrichedRequirements: enriched, status: "active" },
          { new: true }
        );
        if (!assignment) throw new Error("Failed to save enriched requirements");
      }

      const threshold = assignment.confidenceThreshold ?? 0.75;
      const enrichedReqs = assignment.enrichedRequirements || {};

      // Clear any previous results/review queue for this submission
      await Result.deleteMany({ submissionId });
      await ReviewQueue.deleteMany({ submissionId });

      let completedChecks = 0;
      let totalChecks = 0;
      let totalScore = 0;
      let maxScore = 0;
      let autoCommittedCount = 0;
      let flaggedCount = 0;

      // Calculate total checks and maxScore first
      for (const [section, sectionReqs] of Object.entries(enrichedReqs)) {
        for (const [reqKey, req] of Object.entries(sectionReqs as Record<string, any>)) {
          totalChecks++;
          maxScore += Number(req.number) || 0;
        }
      }

      // Step 1 — GitHub check (always runs, deterministic)
      console.log(`Running GitHub check for: ${githubUrl}`);
      const githubResult = await checkGitHubRepo(githubUrl);
      const isGithubPassed = githubResult.repoExists && !githubResult.error;

      // Save GitHub result as a Tier 1 check
      const githubResultDoc = await Result.create({
        submissionId,
        assignmentId,
        section: "GitHub",
        reqKey: "github-activity",
        description: "GitHub repository activity check",
        marks: 0,
        status: isGithubPassed ? "pass" : "fail",
        correct: isGithubPassed,
        message: githubResult.error
          ? githubResult.error
          : `${(githubResult as any).commitQuality || `${githubResult.totalCommits} commits`} · Last commit: ${
              githubResult.lastCommitDate
                ? new Date(githubResult.lastCommitDate).toLocaleString()
                : "No commits found"
            }`,
        automationTier: 1,
        confidence: 1.0,
        autoCommitted: true,
        evidence: {
          domSnapshot: JSON.stringify(githubResult),
        },
      });

      await AuditLog.create({
        submissionId,
        action: "auto-committed",
        decision: isGithubPassed ? "pass" : "fail",
        reasoning: "GitHub checker — deterministic result",
        performedBy: "system",
        confidence: 1.0,
      });

      // Update progress after GitHub check
      completedChecks++;
      await Submission.findByIdAndUpdate(submissionId, {
        "progress.completedChecks": completedChecks,
        "progress.totalChecks": totalChecks + 1, // +1 for GitHub
      });

      // Step 2 — Playwright UI check (Tier 1)
      console.log(`Acquiring warm browser and isolated context...`);
      let browser = await getSharedBrowser();
      let context: any;
      try {
        context = await browser.newContext();
      } catch (contextErr: any) {
        console.warn(`[BROWSER RECOVERY] Failed to create newContext: ${contextErr.message}. Re-launching Chromium...`);
        try {
          if (sharedBrowser) {
            await sharedBrowser.close();
          }
        } catch {}
        sharedBrowser = await chromium.launch({ headless: true });
        browser = sharedBrowser;
        context = await browser.newContext();
      }
      try {
        const page = await context.newPage();

        // Set consistent desktop viewport for reliable layout checks
        await page.setViewportSize({ width: 1440, height: 900 });

        // Optimize page load speed by aborting requests for heavy/unnecessary resources (ads, analytics, fonts, media etc.)
        await page.route("**/*", (route: any) => {
          const resourceType = route.request().resourceType();
          const url = route.request().url();
          if (
            ["media", "font"].includes(resourceType) ||
            url.includes("google-analytics") ||
            url.includes("analytics") ||
            url.includes("doubleclick") ||
            url.includes("facebook") ||
            url.includes("hotjar")
          ) {
            return route.abort();
          }
          return route.continue();
        });

        try {
          await page.goto(liveUrl, { waitUntil: "load", timeout: 12000 });
          // Let CSS animations and lazy-loaders settle
          await page.waitForTimeout(1500);
        } catch (err: any) {
          console.warn(`Playwright page load warning/timeout: ${err.message}. Proceeding with checks anyway.`);
        }

        // Capture a single base screenshot to reuse for all requirement records
        let baseScreenshotPath = "";
        try {
          const filename = `${submissionId}_base.png`;
          const fullPath = path.join(screenshotsDir, filename);
          await page.screenshot({ path: fullPath, type: "png" });
          baseScreenshotPath = fullPath;
        } catch (e: any) {
          console.warn(`Failed to capture base screenshot: ${e.message}`);
        }

        // We will keep check outcomes in a helper structure to process them, batch vision, and commit them
        interface CheckOutcome {
          section: string;
          reqKey: string;
          req: any;
          checkResult: { correct: boolean; message: string; evidence: any };
          reqMarks: number;
        }

        const outcomes: CheckOutcome[] = [];
        const visionPending: { outcomeIndex: number; uniqueId: string; description: string; section: string }[] = [];

        // First pass: DOM check (sequential for absolute Playwright safety and reliability)
        for (const [section, sectionReqs] of Object.entries(enrichedReqs)) {
          for (const [reqKey, req] of Object.entries(sectionReqs as Record<string, any>)) {
            console.log(`Running initial check: ${section} -> ${reqKey} ("${req.description}")`);
            let checkResult = { correct: false, message: "Skipped or untestable", evidence: {} };
            const reqMarks = Number(req.number) || 0;

            if (req.automationTier === 1 && req.checkType !== "needsClarification") {
              try {
                checkResult = await runTier1Check(page, req);
              } catch (err: any) {
                checkResult = { correct: false, message: `Check execution error: ${err.message}`, evidence: {} };
              }
            } else if (req.automationTier === 2 && req.checkType !== "needsClarification") {
              const requiredRole = req.requiredState?.authRole || "student";
              
              if (requiredRole === "guest") {
                try {
                  const authContext = await createGuestContext(browser);
                  const authPage = await authContext.newPage();
                  try {
                    await authPage.goto(liveUrl, { waitUntil: "load", timeout: 12000 }).catch(() => {});
                    const t1Result = await runTier1Check(authPage, req);
                    checkResult = {
                      correct: t1Result.correct,
                      message: `[Tier 2 Guest Check] ${t1Result.message}`,
                      evidence: t1Result.evidence
                    };
                  } finally {
                    await authContext.close();
                  }
                } catch (err: any) {
                  checkResult = {
                    correct: false,
                    message: `Tier 2 Guest check failed: ${err.message}`,
                    evidence: {}
                  };
                }
              } else {
                const roles = assignment.dbSeedConfig?.roles || [];
                const roleConfig = roles.find((ro: any) => ro.role === requiredRole);

                if (!roleConfig) {
                  checkResult = {
                    correct: false,
                    message: `No seed config found for role: ${requiredRole}`,
                    evidence: {}
                  };
                } else {
                  try {
                    const authContext = await createAuthContext(browser, liveUrl, roleConfig as any);
                    const authPage = await authContext.newPage();
                    try {
                      await authPage.goto(liveUrl, { waitUntil: "load", timeout: 12000 }).catch(() => {});
                      const t1Result = await runTier1Check(authPage, req);
                      checkResult = {
                        correct: t1Result.correct,
                        message: `[Tier 2 Auth Check (${requiredRole})] ${t1Result.message}`,
                        evidence: t1Result.evidence
                      };
                    } finally {
                      await authContext.close();
                    }
                  } catch (err: any) {
                    checkResult = {
                      correct: false,
                      message: `Tier 2 Auth check failed: ${err.message}`,
                      evidence: {}
                    };
                  }
                }
              }
            }

            outcomes.push({
              section,
              reqKey,
              req,
              checkResult,
              reqMarks
            });
          }
        }

        // Parallel Selector Self-Healing (runs concurrently to save time)
        console.log(`[AI SELECTOR HEALING] Checking failed selectors in parallel...`);
        const healingPromises = outcomes.map(async (outcome) => {
          const { req, checkResult } = outcome;
          if (!checkResult.correct && req.automationTier === 1 && req.selectors && req.selectors.length > 0) {
            try {
              console.log(`[AI SELECTOR HEALING] FAILED locator for "${req.description}". Requesting healed selector...`);
              const domExcerpt = await page.evaluate(() => {
                return document.body.innerHTML.substring(0, 15000);
              });

              const healingPrompt = `
You are an expert Frontend QA automation self-healing engine.
The automated test failed to locate the element for requirement: "${req.description}"
Failed Selectors attempted: ${JSON.stringify(req.selectors)}

Here is the HTML DOM content:
\`\`\`html
${domExcerpt}
\`\`\`

Identify if the element exists in this DOM with a different class, tag, or hierarchy.
Propose a corrected list of CSS selectors that target this element.
Respond strictly in JSON format:
{
  "found": true or false,
  "healedSelectors": ["div.logo-container", "nav img", ...]
}
`;
              const healResult = await generateJSONContent(healingPrompt);
              if (healResult && healResult.found && healResult.healedSelectors?.length > 0) {
                console.log(`[AI SELECTOR HEALING] Proposed healed selectors:`, healResult.healedSelectors);
                const healedReq = { ...req, selectors: [...healResult.healedSelectors, ...req.selectors] };
                const retryResult = await runTier1Check(page, healedReq);
                if (retryResult.correct) {
                  outcome.checkResult = {
                    correct: true,
                    message: `[AI Self-Healed Selector] ${retryResult.message}`,
                    evidence: { selectorUsed: retryResult.evidence.selectorUsed, details: "AI Selector self-healing auto-corrected the locator" }
                  };
                  console.log(`[AI SELECTOR HEALING] Successfully healed check!`);
                }
              }
            } catch (healErr: any) {
              console.warn(`[AI SELECTOR HEALING ERROR] Failed to heal: ${healErr.message}`);
            }
          }
        });
        await Promise.all(healingPromises);

        const explanationPending: { outcomeIndex: number; uniqueId: string; description: string; section: string }[] = [];

        // Populate queues
        for (let i = 0; i < outcomes.length; i++) {
          const outcome = outcomes[i];
          if (outcome.req.automationTier === 3 || outcome.req.checkType === "needsClarification") {
            visionPending.push({
              outcomeIndex: i,
              uniqueId: `${outcome.section}__${outcome.reqKey}`,
              description: outcome.req.description,
              section: outcome.section
            });
          } else if (!outcome.checkResult.correct && outcome.req.automationTier === 1) {
            explanationPending.push({
              outcomeIndex: i,
              uniqueId: `${outcome.section}__${outcome.reqKey}`,
              description: outcome.req.description,
              section: outcome.section
            });
          }
        }

        // Second pass: Parallel focused Visual Fallbacks (for Tier 3 / needsClarification)
        if (visionPending.length > 0 && baseScreenshotPath) {
          try {
            console.log(`[AI VISION PARALLEL] Evaluating ${visionPending.length} checks visually in parallel...`);
            const base64Image = fs.readFileSync(baseScreenshotPath).toString("base64");
            
            const visionPromises = visionPending.map(async (pending) => {
              const outcome = outcomes[pending.outcomeIndex];
              try {
                const visionPrompt = `
You are an expert AI Grading Assistant for an Automated Assignment Checker.
Your job is to look at this screenshot of a student's live website and determine if they satisfy the following requirement:
Requirement: "${outcome.req.description}"
Assigned Section: "${outcome.section}"

Analyze the layout, styling, text presence, alignment, images, colors, and overall correctness based on the requirement description.
Provide your response strictly in the following JSON format:
{
  "correct": true or false,
  "reason": "Clear explanation of what you observed on the page and why it passed or failed"
}
`;
                const visionResult = await generateJSONContentWithImage(visionPrompt, base64Image);
                if (visionResult && typeof visionResult.correct === "boolean") {
                  outcome.checkResult = {
                    correct: visionResult.correct,
                    message: `[AI Vision Verdict] ${visionResult.reason}`,
                    evidence: { details: "Gemini Vision visual assessment" }
                  };
                  console.log(`[AI VISION VERDICT] ${pending.uniqueId} -> Result: ${visionResult.correct}`);
                }
              } catch (err: any) {
                console.warn(`[AI VISION ERROR] Failed to visually grade ${pending.uniqueId}: ${err.message}`);
              }
            });
            await Promise.all(visionPromises);
          } catch (visionErr: any) {
            console.warn(`[AI VISION BATCH ERROR] Failed to grade visually: ${visionErr.message}`);
          }
        }

        // Third pass: Parallel AI Explanation/Feedback generation for failed Tier 1 checks (AI Separation)
        if (explanationPending.length > 0 && baseScreenshotPath) {
          try {
            console.log(`[AI FEEDBACK] Generating explanations for ${explanationPending.length} failures in parallel...`);
            const base64Image = fs.readFileSync(baseScreenshotPath).toString("base64");

            const explanationPromises = explanationPending.map(async (pending) => {
              const outcome = outcomes[pending.outcomeIndex];
              try {
                const prompt = `
You are an expert AI Grading Assistant for an Automated Assignment Checker.
A student's submission failed the automated check for the following requirement:
Requirement: "${outcome.req.description}"
Assigned Section: "${outcome.section}"
Automated message: "${outcome.checkResult.message}"

Please look at this screenshot of the student's live website and explain what might be missing or wrong in a friendly and educational way.
Respond strictly in the following JSON format:
{
  "explanation": "Clear, friendly feedback explaining why the element might not be visible, missing, or misaligned, and how the student can fix it."
}
`;
                const aiResult = await generateJSONContentWithImage(prompt, base64Image);
                if (aiResult && aiResult.explanation) {
                  // Keep correct = false, but enrich the message with AI feedback
                  outcome.checkResult.message = `${outcome.checkResult.message} · [AI Help]: ${aiResult.explanation}`;
                }
              } catch (err: any) {
                console.warn(`[AI FEEDBACK ERROR] Failed to generate explanation for ${pending.uniqueId}: ${err.message}`);
              }
            });
            await Promise.all(explanationPromises);
          } catch (explainErr: any) {
            console.warn(`[AI FEEDBACK ERROR] Failed to run explanation pass: ${explainErr.message}`);
          }
        }

        // Third pass: DB commits and SSE updates
        for (const outcome of outcomes) {
          const { section, reqKey, req, checkResult, reqMarks } = outcome;
          const screenshotPath = baseScreenshotPath;

          // Confidence routing logic
          const hasLowConfidence = (req.confidence ?? 1.0) < threshold;
          const isNeedsClarification = req.checkType === "needsClarification";
          const isHigherTier = (req.automationTier ?? 1) > 1;
          const needsQueue = hasLowConfidence || isNeedsClarification || isHigherTier;

          let finalStatus: "pass" | "fail" | "needsReview" = checkResult.correct ? "pass" : "fail";
          if (needsQueue) {
            finalStatus = "needsReview";
          }

          const resultDoc = await Result.create({
            submissionId,
            assignmentId,
            section,
            reqKey,
            description: req.description,
            marks: reqMarks,
            status: finalStatus,
            correct: checkResult.correct,
            message: checkResult.message,
            automationTier: req.automationTier ?? 1,
            confidence: req.confidence ?? 1.0,
            autoCommitted: !needsQueue,
            evidence: {
              screenshotPath,
              selectorUsed: (checkResult.evidence as any)?.selectorUsed,
              domSnapshot: (checkResult.evidence as any)?.details,
            },
          });

          if (checkResult.correct) {
            totalScore += reqMarks;
          }

          if (needsQueue) {
            flaggedCount++;
            await ReviewQueue.create({
              submissionId,
              resultId: resultDoc._id,
              section,
              reqKey,
              description: req.description,
              marks: reqMarks,
              automatedResult: checkResult.correct ? "pass" : "fail",
              aiReasoning: isNeedsClarification
                ? "Flagged as needsClarification by Intent Parser"
                : isHigherTier
                ? `Tier ${req.automationTier} check routed to review`
                : `Low parser confidence: ${req.confidence} (threshold: ${threshold})`,
              confidence: req.confidence ?? 1.0,
              status: "pending",
            });
          } else {
            autoCommittedCount++;
          }

          completedChecks++;

          broadcastSseEvent({
            type: "progress",
            submissionId,
            progress: { completedChecks, totalChecks },
            status: "running",
            totalScore,
            maxScore
          });
        }
      } finally {
        await context.close();
      }

      // Update submission status to completed
      await Submission.findByIdAndUpdate(submissionId, {
        status: "completed",
        "progress.completedChecks": completedChecks,
        "progress.totalChecks": totalChecks,
        totalScore,
        maxScore,
        autoCommitted: autoCommittedCount,
        flagged: flaggedCount,
      });

      console.log(`Job ${job.id} completed. Score: ${totalScore}/${maxScore}. Flags: ${flaggedCount}`);
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
    concurrency: 1,
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed: ${err.message}`);
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});

export default worker;
