// Vault Sync — opencode Plugin
// Session-end auto-write to Obsidian vault daily note.
//   - session.created: capture title + start time
//   - session.idle: append one summary line to {vault}/10_Daily/YYYY-MM-DD.md
//   - fire-and-forget: never blocks opencode
//   - dedup by sessionID: each session writes exactly once
//   - failure-tolerant: any error is swallowed after debug logging

import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// Vault 路径：优先读 opencode 配置 references.vault.path（与 /vault-sync 命令文档一致），
// 全部候选失败时回退到历史默认路径。文档见 global/commands/vault-sync.md。
function resolveVaultPath() {
  const candidates = [
    process.env.OPENCODE_CONFIG,
    join(homedir(), ".config", "opencode", "opencode.json"),
  ].filter(Boolean);
  for (const cfgPath of candidates) {
    try {
      const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
      const vp = cfg && cfg.references && cfg.references.vault && cfg.references.vault.path;
      if (typeof vp === "string" && vp.trim()) return vp.trim();
    } catch (err) {
      // 候选配置不可读/无 vault 字段 -> 尝试下一候选（错误路径显式处理，不静默吞）
      console.error(`[vault-sync] 读取 opencode 配置失败（尝试下一候选）: ${cfgPath}`, err && err.message);
    }
  }
  return "D:/learning/计算机/Obsidian Vault"; // 回退：历史默认路径（机器特定）
}
const VAULT_PATH = resolveVaultPath();
const DAILY_DIR = join(VAULT_PATH, "10_Daily");
const LOG_PATH = join(homedir(), ".opencode", "vault-sync.log");

const _debugBuffer = [];
let _debugFlushing = false;
function debugLog(msg) {
  _debugBuffer.push(`[${new Date().toISOString()}] ${msg}\n`);
  scheduleDebugFlush();
}
function scheduleDebugFlush() {
  if (_debugFlushing || _debugBuffer.length === 0) return;
  _debugFlushing = true;
  setImmediate(() => {
    const chunk = _debugBuffer.join("");
    _debugBuffer.length = 0;
    try {
      mkdirSync(join(homedir(), ".opencode"), { recursive: true });
      appendFileSync(LOG_PATH, chunk, "utf8");
    } catch (err) {
      // 日志落盘失败：用 stderr 显式报告，避免用 debugLog（会再次触发 flush 造成递归）
      console.error(`[vault-sync] 日志写入失败: ${LOG_PATH}`, err && err.message);
    }
    _debugFlushing = false;
    if (_debugBuffer.length > 0) scheduleDebugFlush();
  });
}

const _sessions = new Map(); // sessionID -> { title, startedAt }
const _written = new Set();  // sessionID already written

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nowStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function appendToDaily(sessionId, title, startedAt) {
  if (_written.has(sessionId)) return;
  const file = join(DAILY_DIR, `${todayStr()}.md`);
  try {
    mkdirSync(DAILY_DIR, { recursive: true });
    const line = `- ${nowStr()} [opencode] ${title || "(untitled session)"} (started ${startedAt || "?"})\n`;
    const existing = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
    if (existing.includes(`(started ${startedAt})`) || existing.includes(line.trim())) {
      debugLog(`DEDUP skip ${sessionId}`);
      _written.add(sessionId);
      return;
    }
    appendFileSync(file, line, "utf8");
    _written.add(sessionId);
    debugLog(`APPEND ${sessionId} → ${file}: ${line.trim()}`);
  } catch (err) {
    debugLog(`APPEND FAIL ${sessionId}: ${err && err.message}`);
  }
}

function handleCreated(event) {
  const props = (event && event.properties) || {};
  const sid = props.sessionID;
  if (!sid) return;
  const title = props.title || "";
  const startedAt = props.time ? new Date(props.time * 1000).toISOString() : "";
  if (!_sessions.has(sid)) {
    _sessions.set(sid, { title, startedAt });
    debugLog(`CREATED ${sid} title=${title || "(none)"}`);
  }
}

function handleIdle(event) {
  const props = (event && event.properties) || {};
  const sid = props.sessionID;
  if (!sid) return;
  const info = _sessions.get(sid) || {};
  const title = props.title || info.title || "";
  const startedAt = props.time ? new Date(props.time * 1000).toISOString() : info.startedAt || "";
  if (props.title && info.title !== props.title) {
    info.title = props.title;
    debugLog(`TITLE ${sid} → ${props.title}`);
  }
  appendToDaily(sid, title, startedAt);
}

export default async (ctx) => {
  try {
    mkdirSync(join(homedir(), ".opencode"), { recursive: true });
    debugLog(`INIT vault=${VAULT_PATH} daily=${DAILY_DIR}`);
  } catch (err) {
    console.error(`[vault-sync] 初始化失败: ${err && err.message}`);
  }
  return {
    event: async ({ event }) => {
      if (!event || typeof event.type !== "string") return;
      try {
        if (event.type === "session.created") {
          handleCreated(event);
        } else if (event.type === "session.idle") {
          handleIdle(event);
        }
      } catch (err) {
        debugLog(`ERROR ${event.type}: ${err && err.message}`);
      }
    },
  };
};
