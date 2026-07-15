import { chromium } from "playwright";
import dotenv from "dotenv";
dotenv.config();

async function smoke() {
  console.log("Launching Chromium...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const testUrl = "https://example.com";
  console.log(`Navigating to ${testUrl}...`);

  await page.goto(testUrl, { waitUntil: "networkidle" });

  const title = await page.title();
  console.log(`Page title: ${title}`);

  const h1 = await page.$("h1");
  console.log(`H1 found: ${h1 ? "yes" : "no"}`);

  await browser.close();
  console.log("Smoke test passed — Playwright is working.");
}

smoke().catch(console.error);
