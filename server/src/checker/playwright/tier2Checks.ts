import { Page } from "playwright";
import { CheckResult } from "./ruleEvaluator";

// Check dynamically loaded count — e.g. "6 scholarships from DB"
export async function checkDynamicCount(
  page: Page,
  selectors: string[],
  expected: number,
): Promise<CheckResult> {
  // Wait for dynamic content to load
  await page.waitForTimeout(2000);

  for (const selector of selectors) {
    try {
      const els = await page.$$(selector);
      if (els.length > 0) {
        return {
          pass: els.length === expected,
          selectorUsed: selector,
          actualValue: els.length,
          expectedValue: expected,
        };
      }
    } catch {
      continue;
    }
  }

  return {
    pass: false,
    error: `Dynamic elements not found. Expected ${expected}. Tried: ${selectors.join(", ")}`,
  };
}

// Check conditional visibility — e.g. "Pay button only if pending + unpaid"
export async function checkConditionalVisibility(
  page: Page,
  selectors: string[],
  shouldBeVisible: boolean,
): Promise<CheckResult> {
  for (const selector of selectors) {
    try {
      const el = await page.$(selector);
      if (el) {
        const visible = await el.isVisible();
        return {
          pass: visible === shouldBeVisible,
          selectorUsed: selector,
          actualValue: visible ? "visible" : "hidden",
          expectedValue: shouldBeVisible ? "visible" : "hidden",
        };
      }
    } catch {
      continue;
    }
  }

  // Element not found — if shouldBeVisible is false, that is a pass
  return {
    pass: !shouldBeVisible,
    error: shouldBeVisible
      ? `Element not found. Tried: ${selectors.join(", ")}`
      : undefined,
  };
}
