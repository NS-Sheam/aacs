import { chromium, Page } from "playwright";
import { sessionManager } from "./sessionManager";
import { CheckResult } from "./ruleEvaluator";

export interface RunnerResult {
  section: string;
  reqKey: string;
  description: string;
  marks: number;
  checkType: string;
  automationTier: number;
  confidence: number;
  needsClarification: boolean;
  result: {
    pass: boolean;
    selectorUsed?: string;
    actualValue?: string | number;
    expectedValue?: string | number;
    error?: string;
  };
}

// Perform login flow using standard credentials
async function performLogin(
  page: Page,
  loginUrl: string,
  email: string,
  pass: string,
): Promise<boolean> {
  try {
    await page.goto(loginUrl, { waitUntil: "networkidle", timeout: 15000 });

    // Try multiple selector patterns for login form
    const emailSelector =
      (await page.$('input[type="email"]')) ||
      (await page.$('input[name="email"]'))
        ? 'input[type="email"], input[name="email"]'
        : null;
    const passwordSelector =
      (await page.$('input[type="password"]')) ||
      (await page.$('input[name="password"]'))
        ? 'input[type="password"], input[name="password"]'
        : null;

    if (!emailSelector || !passwordSelector) {
      console.log("[tier2Runner] Could not find login inputs");
      return false;
    }

    await page.fill(emailSelector, email);
    await page.fill(passwordSelector, pass);

    // Look for submit button
    const submitBtn = 'button[type="submit"], button:has-text("Login")';
    await page.click(submitBtn);
    await page.waitForTimeout(3000); // Wait for redirect or cookies to set
    return true;
  } catch (error) {
    console.error("[tier2Runner] Login error:", error);
    return false;
  }
}

// Evaluate dynamic counts and conditional visibility for Tier 2 requirements
export async function runTier2Checks(
  liveUrl: string,
  enrichedReqs: Record<string, any>,
): Promise<RunnerResult[]> {
  const browser = await chromium.launch({ headless: true });
  const results: RunnerResult[] = [];

  try {
    for (const [section, reqs] of Object.entries(enrichedReqs)) {
      for (const [reqKey, req] of Object.entries(reqs as Record<string, any>)) {
        const r = req as any;

        // Skip sub_reqs at top level
        if (reqKey.startsWith("sub_req")) continue;

        // Only Tier 2 in this runner
        if (r.automationTier !== 2) continue;

        const role = r.requiredState?.authRole || "guest";
        const email = r.requiredState?.email || "";
        const password = "Test@1234"; // Default seeded credential password

        console.log(
          `  Checking [${section}][${reqKey}] (${role}): ${r.description}`,
        );

        // Load or create authenticated browser context
        let context = await sessionManager.getNewContext(browser, role);
        let page = await context.newPage();
        await page.setViewportSize({ width: 1280, height: 800 });

        // If not logged in and session state missing, log in first
        if (role !== "guest" && !sessionManager.hasSession(role)) {
          const baseUrl = new URL(liveUrl).origin;
          const loginUrl = `${baseUrl}/login`;
          console.log(`[tier2Runner] Performing login at ${loginUrl}`);
          const loggedIn = await performLogin(
            page,
            loginUrl,
            email,
            password,
          );
          if (loggedIn) {
            await sessionManager.saveSession(role, context);
          }
        }

        // Navigate to checking target URL
        let pass = false;
        let error: string | undefined = undefined;
        let selectorUsed: string | undefined = undefined;

        try {
          await page.goto(liveUrl, {
            waitUntil: "networkidle",
            timeout: 15000,
          });

          // Evaluate Tier 2 rules (count or state-visible)
          const rules = r.rules || [];
          for (const rule of rules) {
            const selectorHint = rule.selectorHint || "";
            const kind = rule.kind || "";
            const expected = rule.expected;

            if (kind === "state-visible") {
              const el = await page.$(selectorHint);
              const visible = el ? await el.isVisible() : false;
              pass = visible === expected;
              selectorUsed = selectorHint;
              if (!pass) {
                error = `Expected visibility of "${selectorHint}" to be ${expected}, got ${visible}`;
              }
            } else if (kind === "count") {
              const els = await page.$$(selectorHint);
              const count = els.length;
              pass = count === parseInt(String(expected));
              selectorUsed = selectorHint;
              if (!pass) {
                error = `Expected element count of "${selectorHint}" to be ${expected}, got ${count}`;
              }
            }
          }
        } catch (err: any) {
          error = err.message;
        } finally {
          await page.close();
          await context.close();
        }

        results.push({
          section,
          reqKey,
          description: r.description,
          marks: parseInt(String(r.number)) || 0,
          checkType: r.checkType,
          automationTier: r.automationTier,
          confidence: r.confidence || 0.8,
          needsClarification: false,
          result: {
            pass,
            selectorUsed,
            error,
          },
        });
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}
