import { chromium, Page } from "playwright";
import {
  checkElementExists,
  checkElementCount,
  checkElementPosition,
  CheckResult,
} from "./ruleEvaluator";

export interface RunnerResult {
  section: string;
  reqKey: string;
  description: string;
  marks: number;
  checkType: string;
  automationTier: number;
  confidence: number;
  needsClarification: boolean;
  result: CheckResult;
}

// SPA-safe page navigation
export async function navigateSafe(page: Page, url: string): Promise<boolean> {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForSelector("body", { timeout: 5000 });
    return true;
  } catch {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 });
      await page.waitForTimeout(2000);
      return true;
    } catch {
      return false;
    }
  }
}

// Evaluate a single requirement rule
async function evaluateRule(page: Page, req: any): Promise<CheckResult> {
  const selectors: string[] = req.selectors || [];
  const checkType: string = req.checkType;
  const requiredState = req.requiredState || {};

  switch (checkType) {
    case "ui-element":
      return checkElementExists(page, selectors);

    case "ui-count":
      const expected = parseInt(String(req.number)) || 1;
      return checkElementCount(page, selectors, expected);

    case "ui-position":
      const position = requiredState.position || "center";
      return checkElementPosition(page, selectors, position);

    default:
      return {
        pass: false,
        error: `checkType "${checkType}" is not handled by Tier 1 runner`,
      };
  }
}

// Full Tier 1 runner
export async function runTier1Checks(
  liveUrl: string,
  enrichedReqs: Record<string, any>,
): Promise<RunnerResult[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  const results: RunnerResult[] = [];

  try {
    const loaded = await navigateSafe(page, liveUrl);
    if (!loaded) {
      await browser.close();
      return [
        {
          section: "Navigation",
          reqKey: "nav-error",
          description: "Page load",
          marks: 0,
          checkType: "ui-element",
          automationTier: 1,
          confidence: 1,
          needsClarification: false,
          result: { pass: false, error: `Failed to load: ${liveUrl}` },
        },
      ];
    }

    for (const [section, reqs] of Object.entries(enrichedReqs)) {
      for (const [reqKey, req] of Object.entries(reqs as Record<string, any>)) {
        const r = req as any;

        // Skip sub_req at top level — handle separately
        if (reqKey.startsWith("sub_req")) continue;

        // Only Tier 1 in this runner
        if (r.automationTier !== 1) continue;

        // Skip needsClarification — goes to review queue
        if (r.needsClarification) {
          results.push({
            section,
            reqKey,
            description: r.description,
            marks: parseInt(String(r.number)) || 0,
            checkType: r.checkType,
            automationTier: r.automationTier,
            confidence: r.confidence || 0,
            needsClarification: true,
            result: {
              pass: false,
              error: "Needs instructor clarification",
            },
          });
          continue;
        }

        console.log(`  Checking [${section}][${reqKey}]: ${r.description}`);
        const result = await evaluateRule(page, r);

        results.push({
          section,
          reqKey,
          description: r.description,
          marks: parseInt(String(r.number)) || 0,
          checkType: r.checkType,
          automationTier: r.automationTier,
          confidence: r.confidence || 1,
          needsClarification: false,
          result,
        });
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}
