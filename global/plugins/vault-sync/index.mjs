// Vault Sync — opencode Plugin
// Session-end auto-write to Obsidian vault daily note + session trace.
//   - session.created: capture title + start time
//   - session.idle: append one summary line to {vault}/10_Daily/YYYY-MM-DD.md
//                  + one line to harness metrics/traces.jsonl (feeds reflect.py)
//   - chat.params: inject active-context.md (per-repo, found by walking up from cwd)
//                  as a system message once per session — gives "启动必读" real teeth
//   - fire-and-forget: never blocks opencode
//   - dedup by sessionID: each session writes exactly once
//   - failure-tolerant: any error is swallowed after debug logging

import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from "fs";
import { join, isAbsolute } from "path";
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
// traces 落点：优先环境变量（测试隔离），默认 harness metrics（供 reflect.py 消费）
const TRACES_PATH = process.env.VAULT_SYNC_TRACES_PATH
  || join(homedir(), ".claude", "harness", "metrics", "traces.jsonl");
const TRACES_ALWAYS = false; // true = 即使无 title 也写 trace（默认只写有实质内容的会话）

// —— 写路径信号分级（R-03, 2026-08）——
// 低信号会话（闲聊/无实质内容）无差别写入会稀释 traces 数据质量（Agentic Memory 综述：写前过滤是第一道闸）。
// 分级规则：
//   high   → title 命中 HIGH_SIGNAL_KEYWORDS（决策/修复/失败等实质工作）
//   medium → title 非空且长度 ≥ 8 字符（有描述但非关键词）
//   low    → 其余（空标题/极短标题）→ 不写 traces，仅写日笔记
// 注意：关键词需精选高信号词——"实现/开发/完成"等泛词会让 medium 层形同虚设（2026-08 矩阵回归实证）
const HIGH_SIGNAL_KEYWORDS = [
  "决策", "修复", "bug", "踩坑", "重构", "失败", "error", "验收",
  "架构", "ADR", "切换", "整改", "方案", "审查", "分析",
];
function signalLevel(title) {
  const t = String(title || "").trim();
  if (!t) return "low";
  if (HIGH_SIGNAL_KEYWORDS.some((k) => t.toLowerCase().includes(k.toLowerCase()))) return "high";
  if (t.length >= 8) return "medium";
  return "low";
}

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
    // 日笔记可能不存在（新的一天首条）：不存在则跳过 dedup 检查直接 append
    // （appendFileSync 会自动创建文件）——修复 2026-08 ENOENT 断写 7 天
    if (existsSync(file)) {
      const existing = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
      if (existing.includes(`(started ${startedAt})`) || existing.includes(line.trim())) {
        debugLog(`DEDUP skip ${sessionId}`);
        _written.add(sessionId);
        return;
      }
    }
    appendFileSync(file, line, "utf8");
    _written.add(sessionId);
    debugLog(`APPEND ${sessionId} → ${file}: ${line.trim()}`);
  } catch (err) {
    debugLog(`APPEND FAIL ${sessionId}: ${err && err.message}`);
  }
}

// 会话结束写一条 trace 到 harness/metrics/traces.jsonl（reflect.py 的日常数据源）
// 格式与 eval traces 对齐：span/status/timestamp/attrs/duration_ms
// 写前信号分级：low 信号会话跳过 traces（R-03）
function appendTrace(sessionId, title, startedAt) {
  try {
    const level = signalLevel(title);
    if (TRACES_ALWAYS || level !== "low") {
      mkdirSync(join(TRACES_PATH, ".."), { recursive: true });
      const trace = {
        span: "session",
        status: "success",
        timestamp: new Date().toISOString(),
        signal: level,
        attrs: {
          "task.id": sessionId,
          "task.category": "session",
          "title": title || "(untitled session)",
          "startedAt": startedAt || "",
        },
        duration_ms: 0,
      };
      appendFileSync(TRACES_PATH, `${JSON.stringify(trace)}\n`, "utf8");
      debugLog(`TRACE ${sessionId} signal=${level} → ${TRACES_PATH}`);
    } else {
      debugLog(`TRACE LOW-SIGNAL skip ${sessionId} (title="${title || ""}")`);
    }
  } catch (err) {
    debugLog(`TRACE FAIL ${sessionId}: ${err && err.message}`);
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
  appendTrace(sid, title, startedAt);
}

// —— Active Context 注入（P0-2 改动 C）——
// 会话首条消息前，从 cwd 向上找 active-context.md，命中则作为 system 消息注入，
// 给模型"项目工作状态"的真实感知。找不到（非项目目录/未创建）→ 静默跳过。
const _injectedCwd = new Set(); // 防止同一 cwd 多会话重复注入

function findActiveContext(startDir) {
  let cur = startDir;
  while (cur && cur !== cur.split(/[\\/]/).slice(0, -1).join("/")) {
    const candidate = join(cur, "active-context.md");
    if (existsSync(candidate)) return candidate;
    const parent = cur.split(/[\\/]/).slice(0, -1).join("/");
    if (!parent || parent === cur) break;
    cur = parent;
  }
  return null;
}

function buildInjectedMessage(cwd) {
  const acFile = findActiveContext(cwd);
  if (!acFile) return null;
  if (_injectedCwd.has(cwd)) return null; // 同一工作目录只注入一次（本进程生命周期）
  _injectedCwd.add(cwd);
  try {
    const content = readFileSync(acFile, "utf8").replace(/^\uFEFF/, "").trim();
    if (!content) return null;
    debugLog(`ACTIVE-CTX inject: ${acFile} (${content.length} chars)`);
    return {
      role: "system",
      content: `[Active Context 注入] 项目工作状态（来源 ${acFile}，仅首条消息注入一次）：\n${content}`,
    };
  } catch (err) {
    debugLog(`ACTIVE-CTX read fail ${acFile}: ${err && err.message}`);
    return null;
  }
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
    chat: {
      // 首条消息注入 active-context（cwd 向上查找，跨项目不污染）
      params: async (params) => {
        if (!params || !Array.isArray(params.messages)) return params;
        const cwd = process.cwd();
        const injected = buildInjectedMessage(cwd);
        if (!injected) return params;
        try {
          return { ...params, messages: [injected, ...params.messages] };
        } catch (err) {
          debugLog(`ACTIVE-CTX inject fail: ${err && err.message}`);
          return params;
        }
      },
    },
  };
};
