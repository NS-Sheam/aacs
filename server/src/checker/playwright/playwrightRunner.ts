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
  result: CheckResult;
}

// SPA-safe navigation
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
  const { checkType, selectors = [], requiredState } = req;

  switch (checkType) {
    case "ui-element":
      return checkElementExists(page, selectors);

    case "ui-count":
      const expected = parseInt(req.number) || 1;
      return checkElementCount(page, selectors, expected);

    case "ui-position":
      const position = requiredState?.position || "center";
      return checkElementPosition(page, selectors, position);

    default:
      return {
        pass: false,
        error: `checkType "${checkType}" not handled by Tier 1 runner`,
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
    const navigated = await navigateSafe(page, liveUrl);
    if (!navigated) {
      await browser.close();
      return [
        {
          section: "Navigation",
          reqKey: "nav-error",
          description: "Page navigation",
          marks: 0,
          checkType: "ui-element",
          result: { pass: false, error: `Could not load: ${liveUrl}` },
        },
      ];
    }

    for (const [section, reqs] of Object.entries(enrichedReqs)) {
      for (const [reqKey, req] of Object.entries(reqs as Record<string, any>)) {
        // Only Tier 1 in this runner
        if (req.automationTier !== 1) continue;
        // Skip sub_req for now — handle separately
        if (reqKey.startsWith("sub_req")) continue;

        const result = await evaluateRule(page, req);
        results.push({
          section,
          reqKey,
          description: req.description,
          marks: parseInt(req.number) || 0,
          checkType: req.checkType,
          result,
        });
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}
