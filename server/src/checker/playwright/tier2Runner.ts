import { chromium } from "playwright";

import { checkElementExists, CheckResult } from "./ruleEvaluator";
import { RunnerResult } from "./playwrightRunner";
import { createAuthContext } from "../sessions/sessionManager";

interface RoleConfig {
  role: string;
  email: string;
  password: string;
}

export async function runTier2Checks(
  liveUrl: string,
  enrichedReqs: Record<string, any>,
  roles: RoleConfig[],
): Promise<RunnerResult[]> {
  const browser = await chromium.launch({ headless: true });
  const results: RunnerResult[] = [];

  try {
    for (const [section, reqs] of Object.entries(enrichedReqs)) {
      for (const [reqKey, req] of Object.entries(reqs as Record<string, any>)) {
        const r = req as any;
        if (reqKey.startsWith("sub_req")) continue;
        if (r.automationTier !== 2) continue;
        if (r.needsClarification) continue;

        console.log(`  Tier 2 check [${section}][${reqKey}]: ${r.description}`);

        let checkResult: CheckResult = { pass: false, error: "Not run" };

        if (r.checkType === "functional-auth") {
          const requiredRole = r.requiredState?.authRole || "student";
          const roleConfig = roles.find((ro) => ro.role === requiredRole);

          if (!roleConfig) {
            checkResult = {
              pass: false,
              error: `No seed config for role: ${requiredRole}`,
            };
          } else {
            // Create authenticated context
            const context = await createAuthContext(
              browser,
              liveUrl,
              roleConfig as any,
            );
            const page = await context.newPage();

            try {
              await page.goto(liveUrl, {
                waitUntil: "networkidle",
                timeout: 15000,
              });
              checkResult = await checkElementExists(page, r.selectors || []);
            } catch (err: any) {
              checkResult = { pass: false, error: err.message };
            } finally {
              await context.close();
            }
          }
        }

        results.push({
          section,
          reqKey,
          description: r.description,
          marks: parseInt(String(r.number)) || 0,
          checkType: r.checkType,
          automationTier: 2,
          confidence: r.confidence || 0.7,
          needsClarification: false,
          result: checkResult,
        });
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}
