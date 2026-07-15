import { Page } from "playwright";

export interface CheckResult {
  pass: boolean;
  selectorUsed?: string;
  actualValue?: string | number;
  expectedValue?: string | number;
  error?: string;
  retries?: number;
}

// Retry wrapper — 3 attempts with 1s backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
  }
  throw lastError;
}

export async function checkElementExists(
  page: Page,
  selectors: string[],
): Promise<CheckResult> {
  return withRetry(async () => {
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const isVisible = await element.isVisible();
          if (isVisible) return { pass: true, selectorUsed: selector };
        }
      } catch {
        continue;
      }
    }
    return {
      pass: false,
      error: `No visible element found. Tried: ${selectors.join(", ")}`,
    };
  });
}

export async function checkElementCount(
  page: Page,
  selectors: string[],
  expected: number,
): Promise<CheckResult> {
  return withRetry(async () => {
    for (const selector of selectors) {
      try {
        const elements = await page.$$(selector);
        const visible = await Promise.all(elements.map((e) => e.isVisible()));
        const visibleCount = visible.filter(Boolean).length;
        if (visibleCount > 0 || elements.length > 0) {
          return {
            pass: visibleCount === expected,
            selectorUsed: selector,
            actualValue: visibleCount,
            expectedValue: expected,
          };
        }
      } catch {
        continue;
      }
    }
    return {
      pass: false,
      error: `No elements found. Tried: ${selectors.join(", ")}`,
    };
  });
}

export async function checkElementPosition(
  page: Page,
  selectors: string[],
  position: "left" | "center" | "right",
): Promise<CheckResult> {
  return withRetry(async () => {
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (!element) continue;
        const box = await element.boundingBox();
        if (!box) continue;

        const viewportWidth = page.viewportSize()?.width || 1280;
        const elementCenter = box.x + box.width / 2;
        const leftThird = viewportWidth / 3;
        const rightThird = (viewportWidth / 3) * 2;

        let detected: "left" | "center" | "right";
        if (elementCenter < leftThird) detected = "left";
        else if (elementCenter > rightThird) detected = "right";
        else detected = "center";

        return {
          pass: detected === position,
          selectorUsed: selector,
          actualValue: detected,
          expectedValue: position,
        };
      } catch {
        continue;
      }
    }
    return {
      pass: false,
      error: `Could not determine position. Tried: ${selectors.join(", ")}`,
    };
  });
}
