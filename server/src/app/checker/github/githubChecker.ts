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
}

// Parse GitHub URL → owner + repo
export function parseGitHubUrl(
  url: string,
): { owner: string; repo: string } | null {
  try {
    const cleaned = url.replace(/\.git$/, "").trim();
    const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  } catch {
    return null;
  }
}

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

  try {
    // 1. Fetch repo metadata
    const { data: repoData } = await octokit.repos.get({ owner, repo });

    // 2. Fetch commits (max 100)
    const { data: commits } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 100,
    });

    // 3. Check README
    let hasReadme = false;
    try {
      await octokit.repos.getReadme({ owner, repo });
      hasReadme = true;
    } catch {
      hasReadme = false;
    }

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

    return {
      repoExists: true,
      isPrivate: repoData.private,
      totalCommits: commits.length,
      lastCommitDate: lastCommit?.commit?.author?.date || null,
      lastCommitMessage: lastCommit?.commit?.message?.split("\n")[0] || null,
      hasReadme,
      commitSpreadFlag,
      allCommitsSameDay,
    };
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
