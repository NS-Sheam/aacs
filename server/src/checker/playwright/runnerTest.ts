import { runTier1Checks } from "./playwrightRunner";
import dotenv from "dotenv";
dotenv.config();

// Mock enriched requirements — replace with real enriched output from Gemini
const mockEnriched = {
  Navbar: {
    "req-1": {
      description: "logo/website name on the left",
      number: "2",
      correct: true,
      message: "not okay.",
      checkType: "ui-position",
      automationTier: 1,
      selectors: [
        "nav img",
        "nav svg",
        "nav .logo",
        "nav a:first-child",
        "header .logo",
      ],
      requiredState: { position: "left" },
      confidence: 0.92,
      needsClarification: false,
    },
    "req-2": {
      description: "Signup button on the right",
      number: "2",
      correct: true,
      message: "not okay.",
      checkType: "ui-position",
      automationTier: 1,
      selectors: [
        "nav button",
        "nav a.signup",
        "header button",
        "a[href*='signup']",
      ],
      requiredState: { position: "right" },
      confidence: 0.88,
      needsClarification: false,
    },
  },
};

async function test() {
  // Replace with a real student URL from test data
  const url = "https://example.com";
  console.log(`Running Tier 1 checks on: ${url}\n`);
  const results = await runTier1Checks(url, mockEnriched);
  console.log(JSON.stringify(results, null, 2));
}

test().catch(console.error);
