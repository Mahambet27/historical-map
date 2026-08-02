import { execFileSync } from "node:child_process";
import path from "node:path";
import { repoRoot } from "./package-config.mjs";

const SAFE_COMMIT = /^[0-9a-f]{7,40}$/i;

export const getGitCommit = ({ cwd = repoRoot, exec = execFileSync } = {}) => {
  try {
    const value = String(
      exec("git", ["rev-parse", "--short", "HEAD"], {
        cwd: path.resolve(cwd),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
    ).trim();
    return SAFE_COMMIT.test(value) ? value : "unknown";
  } catch {
    return "unknown";
  }
};

export const getBuildTimestamp = (now = new Date()) => now.toISOString();

export const isSafeCommitIdentifier = (value) =>
  value === "unknown" || SAFE_COMMIT.test(String(value));
