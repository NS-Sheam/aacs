import { Browser, Page, BrowserContext } from "playwright";

export interface SessionConfig {
  email: string;
  password: string;
  role: "student" | "moderator" | "admin";
}

// Guest session — no login, fresh browser context
export async function createGuestContext(
  browser: Browser,
): Promise<BrowserContext> {
  return browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
}

interface CachedSession {
  storageState: any;
  expiresAt: number;
}

const sessionCache = new Map<string, CachedSession>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Authenticated session — logs in and saves auth state
export async function createAuthContext(
  browser: Browser,
  liveUrl: string,
  config: SessionConfig,
): Promise<BrowserContext> {
  const cacheKey = `${liveUrl}_${config.role}`;
  const now = Date.now();
  const cached = sessionCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    console.log(`[SessionCache] Reusing cached session for ${config.role} on ${liveUrl}`);
    return browser.newContext({
      viewport: { width: 1280, height: 800 },
      storageState: cached.storageState,
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    // Navigate to login page — common patterns
    const loginPaths = ["/login", "/signin", "/auth/login", "/user/login"];

    let loginFound = false;
    for (const loginPath of loginPaths) {
      try {
        await page.goto(`${liveUrl}${loginPath}`, {
          waitUntil: "networkidle",
          timeout: 8000,
        });
        const emailInput = await page.$(
          "input[type='email'], input[name='email']",
        );
        if (emailInput) {
          loginFound = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!loginFound) {
      console.warn(
        `Login page not found for ${liveUrl} — returning guest context`,
      );
      await page.close();
      return context;
    }

    // Fill email
    await page.fill("input[type='email'], input[name='email']", config.email);

    // Fill password
    await page.fill(
      "input[type='password'], input[name='password']",
      config.password,
    );

    // Submit
    await page.click(
      "button[type='submit'], button:has-text('Login'), button:has-text('Sign in')",
    );

    // Wait for navigation
    await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
    console.log(`Logged in as ${config.role} (${config.email})`);

    // Cache the authenticated storage state
    const storageState = await context.storageState();
    sessionCache.set(cacheKey, {
      storageState,
      expiresAt: Date.now() + CACHE_TTL,
    });
    console.log(`[SessionCache] Cached fresh session for ${config.role} on ${liveUrl}`);
  } catch (err: any) {
    console.error(`Login failed for ${config.role}: ${err.message}`);
  } finally {
    await page.close();
  }

  return context;
}
