import { checkGitHubRepo, parseGitHubUrl } from "./githubChecker";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  console.log("\n--- parseGitHubUrl tests ---");

  const valid = parseGitHubUrl("https://github.com/octocat/Hello-World");
  console.log("Valid URL:", valid);
  // { owner: 'octocat', repo: 'Hello-World' }

  const withGit = parseGitHubUrl("https://github.com/octocat/Hello-World.git");
  console.log("With .git:", withGit);
  // { owner: 'octocat', repo: 'Hello-World' }

  const invalid = parseGitHubUrl("https://notgithub.com/something");
  console.log("Invalid URL:", invalid);
  // null

  console.log("\n--- checkGitHubRepo test (public repo) ---");
  const result = await checkGitHubRepo(
    "https://github.com/octocat/Hello-World",
  );
  console.log(JSON.stringify(result, null, 2));

  console.log("\n--- checkGitHubRepo test (private/nonexistent repo) ---");
  const privateResult = await checkGitHubRepo(
    "https://github.com/devengers-aacs/nonexistent-private",
  );
  console.log(JSON.stringify(privateResult, null, 2));
}

test().catch(console.error);
