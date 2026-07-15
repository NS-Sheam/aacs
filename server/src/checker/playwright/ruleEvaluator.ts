import { Page } from "playwright";

export interface CheckResult {
  pass: boolean;
  selectorUsed?: string;
  actualValue?: string | number;
  expectedValue?: string | number;
  error?: string;
}

// Retry wrapper — 3 attempts, exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
): Promise<T> {
  let lastErr: Error | null = null;
  for (let i = 1; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (i < retries) await new Promise((r) => setTimeout(r, delayMs * i));
    }
  }
  throw lastErr;
}

// Check if element exists and is visible
export async function checkElementExists(
  page: Page,
  selectors: string[],
): Promise<CheckResult> {
  return withRetry(async () => {
    for (const selector of selectors) {
      try {
        const el = await page.$(selector);
        if (el && (await el.isVisible())) {
          return { pass: true, selectorUsed: selector };
        }
      } catch {
        continue;
      }
    }
    return {
      pass: false,
      error: `No visible element found. Selectors tried: ${selectors.join(", ")}`,
    };
  });
}

// Check element count
export async function checkElementCount(
  page: Page,
  selectors: string[],
  expected: number,
): Promise<CheckResult> {
  return withRetry(async () => {
    for (const selector of selectors) {
      try {
        const els = await page.$$(selector);
        const visible = (
          await Promise.all(els.map((e) => e.isVisible()))
        ).filter(Boolean).length;

        if (els.length > 0) {
          return {
            pass: visible === expected,
            selectorUsed: selector,
            actualValue: visible,
            expectedValue: expected,
          };
        }
      } catch {
        continue;
      }
    }
    return {
      pass: false,
      error: `No elements found. Selectors tried: ${selectors.join(", ")}`,
    };
  });
}

// Check element position — left / center / right
export async function checkElementPosition(
  page: Page,
  selectors: string[],
  position: "left" | "center" | "right",
): Promise<CheckResult> {
  return withRetry(async () => {
    for (const selector of selectors) {
      try {
        const el = await page.$(selector);
        if (!el) continue;
        const box = await el.boundingBox();
        if (!box) continue;

        const vw = page.viewportSize()?.width || 1280;
        const center = box.x + box.width / 2;
        const third = vw / 3;

        let detected: "left" | "center" | "right";
        if (center < third) detected = "left";
        else if (center > third * 2) detected = "right";
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
      error: `Could not determine position. Selectors tried: ${selectors.join(", ")}`,
    };
  });
}

// Check if element contains specific text
export async function checkTextContent(
  page: Page,
  selectors: string[],
  expectedText: string,
): Promise<CheckResult> {
  return withRetry(async () => {
    for (const selector of selectors) {
      try {
        const el = await page.$(selector);
        if (!el) continue;
        const text = await el.textContent();
        if (text && text.toLowerCase().includes(expectedText.toLowerCase())) {
          return {
            pass: true,
            selectorUsed: selector,
            actualValue: text.trim(),
            expectedValue: expectedText,
          };
        }
      } catch {
        continue;
      }
    }
    return {
      pass: false,
      error: `Text "${expectedText}" not found. Tried: ${selectors.join(", ")}`,
    };
  });
}
