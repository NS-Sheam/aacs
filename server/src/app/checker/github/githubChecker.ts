import { Octokit } from "@octokit/rest";
import config from "../../config";
const octokit = new Octokit({ auth: config.githubToken });

export interface GitHubCheckResult {
  repoExists: boolean;
  isPrivate: boolean;
  totalCommits: number;
  lastCommitDate: string | null;
  lastCommitMessage: string | null;
  hasReadme: boolean;
  commitSpreadFlag: boolean;
  allCommitsSameDay: boolean;
  error?: string;
  commitQuality?: string;
}

// Parse GitHub URL → owner + repo
// Handles: /tree/branch/..., /blob/..., trailing .git, etc.
export function parseGitHubUrl(
  url: string,
): { owner: string; repo: string } | null {
  try {
    const cleaned = url
      .replace(/\.git$/, "")          // strip .git suffix
      .replace(/\/tree\/.*$/, "")     // strip /tree/branch/path
      .replace(/\/blob\/.*$/, "")     // strip /blob/branch/path
      .replace(/\/commits?\/.*$/, "") // strip /commit/sha
      .trim();
    const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  } catch {
    return null;
  }
}

interface CacheEntry {
  timestamp: number;
  result: GitHubCheckResult;
}

const githubCache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function checkGitHubRepo(
  githubUrl: string,
): Promise<GitHubCheckResult> {
  const parsed = parseGitHubUrl(githubUrl);

  if (!parsed) {
    return {
      repoExists: false,
      isPrivate: false,
      totalCommits: 0,
      lastCommitDate: null,
      lastCommitMessage: null,
      hasReadme: false,
      commitSpreadFlag: false,
      allCommitsSameDay: false,
      error: "Invalid GitHub URL format",
    };
  }

  const { owner, repo } = parsed;
  const cacheKey = `${owner}/${repo}`.toLowerCase();
  
  const cached = githubCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[GITHUB CACHE HIT] Returning cached details for: ${cacheKey}`);
    return cached.result;
  }

  try {
    // Fetch repository data, commits, and readme in parallel
    const [repoResult, commitsResult, readmeResult] = await Promise.allSettled([
      octokit.repos.get({ owner, repo }),
      octokit.repos.listCommits({ owner, repo, per_page: 100 }),
      octokit.repos.getReadme({ owner, repo }),
    ]);

    if (repoResult.status === "rejected") {
      throw repoResult.reason;
    }
    const repoData = repoResult.value.data;

    if (commitsResult.status === "rejected") {
      throw commitsResult.reason;
    }
    const commits = commitsResult.value.data;

    const hasReadme = readmeResult.status === "fulfilled";

    // 4. Commit spread check
    // Flag if all commits happened on the same calendar day
    const commitDates = commits.map(
      (c) => c.commit.author?.date?.split("T")[0] || "",
    );
    const uniqueDays = new Set(commitDates.filter(Boolean));
    const allCommitsSameDay = uniqueDays.size === 1 && commits.length > 1;

    // Flag if fewer than 3 commits total
    const commitSpreadFlag = commits.length < 3 || allCommitsSameDay;

    const lastCommit = commits[0];
    const commitQuality = commitSpreadFlag
      ? allCommitsSameDay
        ? `⚠️ All ${commits.length} commits on the same day — possible bulk upload`
        : `⚠️ Only ${commits.length} commits — expected ≥3 across different days`
      : `✅ ${commits.length} commits across ${uniqueDays.size} day(s)`;

    const result: GitHubCheckResult = {
      repoExists: true,
      isPrivate: repoData.private,
      totalCommits: commits.length,
      lastCommitDate: lastCommit?.commit?.author?.date || null,
      lastCommitMessage: lastCommit?.commit?.message?.split("\n")[0] || null,
      hasReadme,
      commitSpreadFlag,
      allCommitsSameDay,
      commitQuality,
    };

    githubCache.set(cacheKey, { timestamp: Date.now(), result });
    return result;
  } catch (err: any) {
    // Handle private repo
    if (err.status === 404 || err.status === 403) {
      return {
        repoExists: false,
        isPrivate: true,
        totalCommits: 0,
        lastCommitDate: null,
        lastCommitMessage: null,
        hasReadme: false,
        commitSpreadFlag: false,
        allCommitsSameDay: false,
        error:
          err.status === 403
            ? "Private repo — access denied. Student must make repo public."
            : "Repo not found — check URL.",
      };
    }

    // Handle rate limit
    if (err.status === 429 || err.message?.includes("rate limit")) {
      return {
        repoExists: false,
        isPrivate: false,
        totalCommits: 0,
        lastCommitDate: null,
        lastCommitMessage: null,
        hasReadme: false,
        commitSpreadFlag: false,
        allCommitsSameDay: false,
        error: "GitHub API rate limit hit — retry after 1 hour.",
      };
    }

    return {
      repoExists: false,
      isPrivate: false,
      totalCommits: 0,
      lastCommitDate: null,
      lastCommitMessage: null,
      hasReadme: false,
      commitSpreadFlag: false,
      allCommitsSameDay: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}
