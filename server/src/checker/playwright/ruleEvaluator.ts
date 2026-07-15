import { Page } from "playwright";

export interface CheckResult {
  pass: boolean;
  selectorUsed?: string;
  actualValue?: string | number;
  expectedValue?: string | number;
  error?: string;
}

// Checks if an element matching any selector in the array exists in DOM
export async function checkElementExists(
  page: Page,
  selectors: string[],
): Promise<CheckResult> {
  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        return { pass: true, selectorUsed: selector };
      }
    } catch (err) {
      continue;
    }
  }
  return {
    pass: false,
    error: `No element found for selectors: ${selectors.join(", ")}`,
  };
}

// Checks if the count of elements matching a selector equals expected
export async function checkElementCount(
  page: Page,
  selectors: string[],
  expected: number,
): Promise<CheckResult> {
  for (const selector of selectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        return {
          pass: elements.length === expected,
          selectorUsed: selector,
          actualValue: elements.length,
          expectedValue: expected,
        };
      }
    } catch (err) {
      continue;
    }
  }
  return {
    pass: false,
    error: `No elements found for selectors: ${selectors.join(", ")}`,
  };
}

// Checks if an element is positioned at left / center / right
export async function checkElementPosition(
  page: Page,
  selectors: string[],
  position: "left" | "center" | "right",
): Promise<CheckResult> {
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

      let detectedPosition: "left" | "center" | "right";
      if (elementCenter < leftThird) detectedPosition = "left";
      else if (elementCenter > rightThird) detectedPosition = "right";
      else detectedPosition = "center";

      return {
        pass: detectedPosition === position,
        selectorUsed: selector,
        actualValue: detectedPosition,
        expectedValue: position,
      };
    } catch (err) {
      continue;
    }
  }
  return {
    pass: false,
    error: `Could not determine position for selectors: ${selectors.join(", ")}`,
  };
}
