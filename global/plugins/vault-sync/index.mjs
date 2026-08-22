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

const VAULT_PATH = "D:/learning/计算机/Obsidian Vault";
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
    } catch {}
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
  } catch {}
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
