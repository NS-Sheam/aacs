import { Browser, BrowserContext } from "playwright";
import fs from "fs";
import path from "path";

const SESSIONS_DIR = path.join(process.cwd(), "outputs", "sessions");

export const sessionManager = {
  // Get path for a role's storage state JSON file
  getSessionPath(role: string): string {
    return path.join(SESSIONS_DIR, `${role}.json`);
  },

  // Check if session exists on disk
  hasSession(role: string): boolean {
    return fs.existsSync(this.getSessionPath(role));
  },

  // Save the state from an authenticated page context
  async saveSession(role: string, context: BrowserContext): Promise<void> {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    const sessionPath = this.getSessionPath(role);
    await context.storageState({ path: sessionPath });
    console.log(`[sessionManager] Session state saved for role: ${role}`);
  },

  // Create a new context with authenticated session state if it exists
  async getNewContext(browser: Browser, role: string): Promise<BrowserContext> {
    const sessionPath = this.getSessionPath(role);
    if (this.hasSession(role)) {
      console.log(
        `[sessionManager] Loading existing session state for role: ${role}`,
      );
      return browser.newContext({ storageState: sessionPath });
    }
    console.log(
      `[sessionManager] No session state found for role: ${role}, returning clean context`,
    );
    return browser.newContext();
  },
};
