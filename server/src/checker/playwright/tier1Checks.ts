import { Page } from "playwright";

export interface Tier1CheckResult {
  correct: boolean;
  message: string;
  evidence: {
    selectorUsed?: string;
    details?: string;
  };
}

/** Normalize whitespace and case for fuzzy text comparison */
const normalizeText = (s: string) =>
  s.toLowerCase().replace(/\s+/g, " ").trim();

/** Try to find an element using a list of selectors — visible first, then DOM presence */
async function findElement(
  page: Page,
  selectors: string[]
): Promise<{ found: boolean; selector: string; visibleOnly: boolean }> {
  // Pass 1 — prefer a visually visible element
  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      // Scroll into view before checking visibility
      await locator.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {});
      const isVisible = await locator.isVisible({ timeout: 1500 });
      if (isVisible) return { found: true, selector, visibleOnly: true };
    } catch {
      continue;
    }
  }

  // Pass 2 — fall back to DOM presence (below fold, opacity:0, etc.)
  for (const selector of selectors) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) return { found: true, selector, visibleOnly: false };
    } catch {
      continue;
    }
  }

  return { found: false, selector: "", visibleOnly: false };
}

/**
 * Executes a single Tier 1 requirement check against the active Playwright page.
 */
export async function runTier1Check(
  page: Page,
  requirement: any
): Promise<Tier1CheckResult> {
  const { selectors = [], checkType = "ui-element", rules = [] } = requirement;

  // Build the full selector list: primary selectors + rule selectorHints (prepended for higher priority)
  const allSelectors: string[] = [];
  for (const rule of rules) {
    if (rule.selectorHint) {
      const hints = rule.selectorHint.split(",").map((s: string) => s.trim()).filter(Boolean);
      for (const h of hints) {
        if (!allSelectors.includes(h)) allSelectors.push(h);
      }
    }
  }
  // Append primary selectors that weren't already added from selectorHints
  for (const s of selectors) {
    if (!allSelectors.includes(s)) allSelectors.push(s);
  }

  // Resolve effective checkType: treat static-ui and functional-ui as ui-element
  // but honour overrides from rules[] (position rule → ui-position, count rule → ui-count, text rule → text)
  let effectiveCheckType = checkType;
  if (effectiveCheckType === "static-ui" || effectiveCheckType === "functional-ui" || effectiveCheckType === "functional-crud") {
    const hasCountRule = rules.some((r: any) => r.kind === "count");
    const hasPosRule = rules.some((r: any) => r.kind === "position");
    const hasTextRule = rules.some((r: any) => r.kind === "text");
    if (hasCountRule) effectiveCheckType = "ui-count";
    else if (hasPosRule) effectiveCheckType = "ui-position";
    else if (hasTextRule) effectiveCheckType = "text-check";
    else effectiveCheckType = "ui-element";
  }

  // ─── ui-count ───────────────────────────────────────────────────────────────
  if (effectiveCheckType === "ui-count") {
    let expected = 1;
    const countRule = rules?.find((r: any) => r.kind === "count" || typeof r.expected === "number");
    if (countRule && typeof countRule.expected === "number") {
      expected = countRule.expected;
    }

    // Collect counts from all selectors and pick the best match
    type CountResult = { selector: string; count: number; delta: number };
    const countResults: CountResult[] = [];

    for (const selector of allSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          countResults.push({ selector, count, delta: Math.abs(count - expected) });
        }
      } catch {
        continue;
      }
    }

    if (countResults.length === 0) {
      return {
        correct: false,
        message: `No elements found for count check (expected ${expected})`,
        evidence: { details: `Tried: ${allSelectors.join(", ")}` },
      };
    }

    // Pick the selector whose count is closest to expected value
    countResults.sort((a, b) => a.delta - b.delta);
    const best = countResults[0];
    const match = best.count === expected;

    return {
      correct: match,
      message: match
        ? `Found exactly ${best.count} elements matching "${best.selector}" ✓`
        : `Expected ${expected} elements but found ${best.count} (closest selector: "${best.selector}")`,
      evidence: {
        selectorUsed: best.selector,
        details: `Count: ${best.count}, Expected: ${expected}, All counts: ${countResults.map(c => `${c.selector}=${c.count}`).join(", ")}`,
      },
    };
  }

  // ─── Find element for all other check types ──────────────────────────────────
  const { found, selector: activeSelector, visibleOnly } = await findElement(page, allSelectors);

  // ─── Explicit exists rule (kind=exists) ─────────────────────────────────────
  const existsRule = rules.find((r: any) => r.kind === "exists");
  if (existsRule) {
    if (!found) {
      return {
        correct: false,
        message: `Required element not found in DOM. Checked: ${allSelectors.slice(0, 5).join(", ")}`,
        evidence: { details: "All selectors tried — none found even in DOM." },
      };
    }
    // If element found and no other rules override, pass immediately
    const hasOtherRules = rules.some((r: any) => r.kind !== "exists");
    if (!hasOtherRules) {
      return {
        correct: true,
        message: `Element found and ${visibleOnly ? "visible" : "present in DOM"} — selector: "${activeSelector}"`,
        evidence: { selectorUsed: activeSelector },
      };
    }
  }

  if (!found) {
    return {
      correct: false,
      message: `Required element not found in DOM. Checked: ${allSelectors.slice(0, 4).join(", ")}`,
      evidence: { details: "All selectors tried — none found even in DOM." },
    };
  }

  const locator = page.locator(activeSelector).first();

  // ─── Text check — scans ALL matching elements, passes if ANY contains expected ─
  const textRule = rules.find((r: any) => r.kind === "text");
  if (textRule || effectiveCheckType === "text-check") {
    const rule = textRule || rules[0];
    const expectedNorm = normalizeText(String(rule.expected || ""));

    // Scan every selector, collect all element texts, and check each
    const checkedTexts: string[] = [];

    for (const sel of allSelectors) {
      try {
        const count = await page.locator(sel).count();
        for (let i = 0; i < Math.min(count, 8); i++) {
          try {
            const el = page.locator(sel).nth(i);
            await el.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {});
            const txt = (await el.innerText({ timeout: 1500 }).catch(
              async () => (await el.textContent()) || ""
            )) || "";
            if (txt.trim()) checkedTexts.push(txt.trim());
          } catch { continue; }
        }
      } catch { continue; }
    }

    // Deduplicate and fuzzy-match
    const unique = [...new Set(checkedTexts)];
    let matchedText = "";
    for (const txt of unique) {
      const norm = normalizeText(txt);
      const directMatch = norm.includes(expectedNorm);
      const wordsMatch = expectedNorm.split(" ").length > 1
        && expectedNorm.split(" ").every((w) => norm.includes(w));
      if (directMatch || wordsMatch) { matchedText = txt; break; }
    }

    const matches = matchedText.length > 0;
    return {
      correct: matches,
      message: matches
        ? `Text matches: "${matchedText.substring(0, 70)}"`
        : `Expected text containing "${rule.expected}" — searched ${unique.length} element(s), best: "${unique[0]?.substring(0, 60) || "none"}"`,
      evidence: {
        selectorUsed: activeSelector,
        details: `Searched ${unique.length} elements. Texts: ${unique.slice(0, 3).map(t => `"${t.substring(0,40)}"`).join(", ")}`,
      },
    };
  }

  // ─── Position check ─────────────────────────────────────────────────────────
  const posRule = rules.find((r: any) => r.kind === "position");
  if (effectiveCheckType === "ui-position" || posRule) {
    const box = await locator.boundingBox();
    if (!box) {
      return {
        correct: false,
        message: `Could not retrieve layout coordinates for "${activeSelector}"`,
        evidence: { selectorUsed: activeSelector },
      };
    }

    const viewportSize = page.viewportSize();
    const viewportWidth = viewportSize?.width ?? 1440;

    let targetPosition = "left";
    if (posRule?.position) {
      targetPosition = posRule.position;
    } else if (requirement.description.toLowerCase().includes("right")) {
      targetPosition = "right";
    } else if (requirement.description.toLowerCase().includes("center")) {
      targetPosition = "center";
    }

    const elementCenter = box.x + box.width / 2;

    if (targetPosition === "left") {
      const isLeft = elementCenter < viewportWidth * 0.45;
      return {
        correct: isLeft,
        message: isLeft
          ? `Element is on the left (center: ${Math.round(elementCenter)}px / ${viewportWidth}px)`
          : `Element is NOT on the left (center: ${Math.round(elementCenter)}px / ${viewportWidth}px)`,
        evidence: { selectorUsed: activeSelector, details: JSON.stringify(box) },
      };
    }

    if (targetPosition === "right") {
      const isRight = elementCenter > viewportWidth * 0.55;
      return {
        correct: isRight,
        message: isRight
          ? `Element is on the right (center: ${Math.round(elementCenter)}px / ${viewportWidth}px)`
          : `Element is NOT on the right (center: ${Math.round(elementCenter)}px / ${viewportWidth}px)`,
        evidence: { selectorUsed: activeSelector, details: JSON.stringify(box) },
      };
    }

    if (targetPosition === "center") {
      const distance = Math.abs(elementCenter - viewportWidth / 2);
      const isCenter = distance < viewportWidth * 0.15;
      return {
        correct: isCenter,
        message: isCenter
          ? `Element is centered (center: ${Math.round(elementCenter)}px, midpoint: ${viewportWidth / 2}px)`
          : `Element is NOT centered (center: ${Math.round(elementCenter)}px, midpoint: ${viewportWidth / 2}px)`,
        evidence: { selectorUsed: activeSelector, details: JSON.stringify(box) },
      };
    }
  }

  // ─── Image load check ────────────────────────────────────────────────────────
  const isImgSelector =
    activeSelector.startsWith("img") ||
    activeSelector.includes("img[") ||
    activeSelector.includes(" img");

  if (isImgSelector) {
    try {
      const imgLoaded = await page.evaluate((sel) => {
        const img = document.querySelector(sel) as HTMLImageElement | null;
        return img ? img.complete && img.naturalWidth > 0 : false;
      }, activeSelector);

      return {
        correct: imgLoaded,
        message: imgLoaded
          ? `Image is present and loaded (selector: "${activeSelector}")`
          : `Image element found but not loaded — may be a broken src or 404 (selector: "${activeSelector}")`,
        evidence: { selectorUsed: activeSelector },
      };
    } catch {
      // Fall through to default exists check
    }
  }

  // ─── Alt-text check ──────────────────────────────────────────────────────────
  const altRule = rules.find((r: any) => r.kind === "alt-text");
  if (altRule) {
    const alt = await locator.getAttribute("alt");
    const hasAlt = !!alt && alt.trim().length > 0;
    return {
      correct: hasAlt,
      message: hasAlt
        ? `Image has alt text: "${alt}"`
        : `Image is missing alt text — accessibility issue`,
      evidence: { selectorUsed: activeSelector },
    };
  }

  // ─── Href check ─────────────────────────────────────────────────────────────
  const hrefRule = rules.find((r: any) => r.kind === "href");
  if (hrefRule) {
    const href = await locator.getAttribute("href");
    const isValid = !!href && href !== "#" && href.trim().length > 0;
    return {
      correct: isValid,
      message: isValid
        ? `Link has valid href: "${href}"`
        : `Link has no valid href (found: "${href}")`,
      evidence: { selectorUsed: activeSelector },
    };
  }

  // ─── CSS property check ──────────────────────────────────────────────────────
  const cssRule = rules.find((r: any) => r.kind === "css-property");
  if (cssRule || checkType === "css-property") {
    const rule = cssRule || rules[0];
    const propValue = await page.evaluate(
      ([sel, prop]: string[]) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).getPropertyValue(prop) : null;
      },
      [activeSelector, rule.property || "display"]
    );

    const isValid =
      !!propValue && propValue !== "none" && propValue !== "0px";
    return {
      correct: isValid,
      message: isValid
        ? `CSS property "${rule.property}" is "${propValue}"`
        : `CSS property "${rule.property}" has unexpected value: "${propValue}"`,
      evidence: {
        selectorUsed: activeSelector,
        details: `${rule.property}: ${propValue}`,
      },
    };
  }

  // ─── Accessibility check ─────────────────────────────────────────────────────
  if (checkType === "accessibility") {
    // 1. Missing alt tags
    const missingAltCount = await page.evaluate(() => {
      const images = document.querySelectorAll("img");
      return Array.from(images).filter(img => !img.hasAttribute("alt") || img.getAttribute("alt")?.trim() === "").length;
    });

    // 2. Empty buttons
    const emptyButtonsCount = await page.evaluate(() => {
      const buttons = document.querySelectorAll("button, a.btn, .button");
      return Array.from(buttons).filter(btn => (btn.textContent || "").trim() === "" && !btn.hasAttribute("aria-label")).length;
    });

    // 3. Heading hierarchy jump issues (e.g. h3 without h2, or similar)
    const headingErrors = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
        .map(h => parseInt(h.tagName.substring(1)));
      let errors = 0;
      let prevLevel = 0;
      for (const level of headings) {
        if (level > prevLevel + 1 && prevLevel > 0) {
          errors++; // Level skipped, e.g. h1 directly to h3
        }
        prevLevel = level;
      }
      return errors;
    });

    const isPassed = missingAltCount === 0 && emptyButtonsCount === 0 && headingErrors === 0;

    return {
      correct: isPassed,
      message: isPassed
        ? `Accessibility audit passed! (0 images missing alt text, 0 empty buttons, correct heading structure)`
        : `Accessibility warnings found: ${missingAltCount} images missing alt text, ${emptyButtonsCount} empty buttons, ${headingErrors} heading level jumps.`,
      evidence: {
        details: `Missing Alt Count: ${missingAltCount}, Empty Buttons: ${emptyButtonsCount}, Heading Level Jumps: ${headingErrors}`
      }
    };
  }

  // ─── Default: element exists ─────────────────────────────────────────────────
  const visibilityNote = visibleOnly
    ? "visible in viewport"
    : "present in DOM (may be below fold or hidden)";

  return {
    correct: true,
    message: `Element found and ${visibilityNote} — selector: "${activeSelector}"`,
    evidence: { selectorUsed: activeSelector },
  };
}
