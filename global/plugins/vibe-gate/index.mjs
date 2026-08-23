/**
 * vibe-gate — Vibe workflow quality gate before git commit.
 *
 * Hooks `tool.execute.before` for bash commands that invoke `git commit`.
 * If the project is a vibe project (has .opencode/quality-gate.js), run the
 * gate; if it exits non-zero, block the commit.
 *
 * Additionally: if the repo has scripts/check-sync.mjs (multi-copy drift
 * detector, e.g. vibecoding-template itself), run it before commit — the
 * mechanism is generic and portable to any repo that adopts it.
 *
 * Escape hatch: SKIP_VIBE_GATE=1 / SKIP_CHECK_SYNC=1 env vars bypass
 * (mirrors quality-gate-template.js M07 and check-sync.mjs).
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

/** Locate scripts/check-sync.mjs by walking up (generic, repo-optional). */
function findCheckSync(startDir) {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    if (!dir) break;
    const script = resolve(dir, "scripts", "check-sync.mjs");
    if (existsSync(script)) return script;
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

// 10 分钟上限：quality-gate 内 coverage 脚本自身限 5 分钟，外层须兜底防无限挂起阻塞 commit
const GATE_TIMEOUT_MS = 10 * 60 * 1000;

function runScript(scriptPath) {
  // quality-gate M07 / check-sync both support their own SKIP_* env — honored via env
  // script lives at <root>/<subdir>/script -> project root = dirname(dirname(scriptPath))
  const out = execFileSync(process.execPath, [scriptPath], {
    cwd: dirname(dirname(scriptPath)),
    encoding: "utf8",
    stdio: "pipe",
    timeout: GATE_TIMEOUT_MS,
    env: { ...process.env },
  });
  return out;
}

/** 成功也要回显输出尾部（check-sync 的警告、quality-gate 的警告项否则不可见）。 */
function showTail(label, out) {
  const text = (out || "").toString().trim();
  if (!text) return;
  const tail = text.split("\n").slice(-12).join("\n");
  console.log(`[vibe-gate] ${label} 通过，输出尾部：\n${tail}`);
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

      // generic drift check: repos that adopt scripts/check-sync.mjs get it enforced
      const checkSyncPath = findCheckSync(cwd);
      if (checkSyncPath) {
        try {
          showTail("check-sync", runScript(checkSyncPath));
        } catch (e) {
          const detail = (e?.stdout || e?.stderr || e?.message || "").toString();
          throw new Error(
            `[vibe-gate] check-sync 漂移检测未通过，commit 已阻断。同步多副本/修正引用后重试（或显式设置 SKIP_CHECK_SYNC=1 跳过）。\n` +
              `script: ${checkSyncPath}\n` +
              `output:\n${detail.slice(0, 2000)}`
          );
        }
      }

      // project-aware: not a vibe project -> pass through
      const gatePath = findVibeGate(cwd);
      if (!gatePath) return;

      try {
        showTail("quality-gate", runScript(gatePath));
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
