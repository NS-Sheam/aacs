// Quick test — create server/src/checker/playwright/runnerTest.ts
import { runTier1Checks } from "./playwrightRunner";
import dotenv from "dotenv";
dotenv.config();

const mockEnrichedReqs = {
  Navbar: {
    "req-1": {
      description: "logo/website name on the left",
      number: "2",
      correct: true,
      message: "not okay.",
      checkType: "ui-element",
      automationTier: 1,
      selectors: ["nav img", "nav svg", "nav .logo", "header .logo"],
      requiredState: null,
    },
    "req-2": {
      description: "Signup button on the right",
      number: "2",
      correct: true,
      message: "not okay.",
      checkType: "ui-element",
      automationTier: 1,
      selectors: ["nav button", "nav a.signup", "header button"],
      requiredState: null,
    },
  },
};

async function test() {
  const results = await runTier1Checks(
    "https://example.com", // replace with real student URL
    mockEnrichedReqs,
  );
  console.log(JSON.stringify(results, null, 2));
}

test().catch(console.error);
