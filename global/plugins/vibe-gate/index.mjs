/**
 * vibe-gate — Vibe workflow quality gate before git commit.
 *
 * Hooks `tool.execute.before` for bash commands that invoke `git commit`.
 * If the project is a vibe project (has .opencode/quality-gate.js), run the
 * gate; if it exits non-zero, block the commit.
 *
 * Escape hatch: SKIP_VIBE_GATE=1 env var bypasses (mirrors quality-gate-template.js M07).
 *
 * Project-aware: projects without .opencode/quality-gate.js are NOT vibe
 * projects — pass through untouched.
 */
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";

/** Locate the project root containing .opencode/quality-gate.js. */
function findVibeGate(startDir) {
  let dir = startDir;
  // walk up to 6 levels to find the vibe project root
  for (let i = 0; i < 6; i++) {
    if (!dir) break;
    const gate = resolve(dir, ".opencode", "quality-gate.js");
    if (existsSync(gate)) return gate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** Does the bash command perform a git commit? */
function isGitCommit(command) {
  if (!command) return false;
  // match `git commit` (allow git -C <path> commit, git-commit alias, etc.)
  return /\bgit(?:\s+-C\s+\S+)?\s+commit\b/.test(command);
}

function runGate(gatePath) {
  // quality-gate-template.js M07 supports SKIP_VIBE_GATE=1 — honored via env
  const out = execFileSync(process.execPath, [gatePath], {
    cwd: dirname(dirname(gatePath)), // project root (parent of .opencode/)
    encoding: "utf8",
    stdio: "pipe",
    env: { ...process.env },
  });
  return out;
}

export const VibeGate = async ({ directory, worktree }) => {
  const cwd = worktree || directory;
  if (!cwd) return {};

  return {
    "tool.execute.before": async (input, output) => {
      // only intercept bash
      if (input.tool !== "bash") return;
      const command = output?.args?.command ?? "";
      if (!isGitCommit(command)) return;

      // project-aware: not a vibe project -> pass through
      const gatePath = findVibeGate(cwd);
      if (!gatePath) return;

      try {
        runGate(gatePath);
      } catch (e) {
        const detail = (e?.stdout || e?.stderr || e?.message || "").toString();
        throw new Error(
          `[vibe-gate] quality-gate 未通过，commit 已阻断。修复阻断项后重试（或显式设置 SKIP_VIBE_GATE=1 跳过）。\n` +
            `gate: ${gatePath}\n` +
            `output:\n${detail.slice(0, 2000)}`
        );
      }
    },
  };
};
