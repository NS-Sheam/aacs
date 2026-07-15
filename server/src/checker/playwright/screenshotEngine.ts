import { chromium } from "playwright";
import path from "path";
import fs from "fs";

export interface ScreenshotResult {
  mobile: string;
  tablet: string;
  desktop: string;
}

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
};

export async function takeResponsiveScreenshots(
  liveUrl: string,
  submissionId: string,
): Promise<ScreenshotResult> {
  const outputDir = path.join(
    process.cwd(),
    "outputs",
    "screenshots",
    submissionId,
  );
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const result: Partial<ScreenshotResult> = {};

  for (const [viewport, size] of Object.entries(VIEWPORTS)) {
    const page = await browser.newPage();
    await page.setViewportSize(size);

    try {
      await page.goto(liveUrl, { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(1000);

      const screenshotPath = path.join(outputDir, `${viewport}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result[viewport as keyof ScreenshotResult] = screenshotPath;
      console.log(`Screenshot saved: ${screenshotPath}`);
    } catch (err: any) {
      console.error(`Screenshot failed [${viewport}]: ${err.message}`);
      result[viewport as keyof ScreenshotResult] = "";
    } finally {
      await page.close();
    }
  }

  await browser.close();
  return result as ScreenshotResult;
}
