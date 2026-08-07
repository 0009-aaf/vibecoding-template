/**
 * Vibecoding Quality Gate
 * 提交前质量检查：密钥扫描、Protected Region 检查、变更范围检查、文档同步检查
 *
 * 用法: node .opencode/quality-gate.js
 * 环境变量: SKIP_VIBE_GATE=1 可跳过
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

const results = [];

function pass(msg) {
  results.push({ status: "pass", msg });
  console.log(`  ${GREEN}✅ ${msg}${RESET}`);
}

function warn(msg) {
  results.push({ status: "warn", msg });
  console.log(`  ${YELLOW}⚠️  ${msg}${RESET}`);
}

function fail(msg) {
  results.push({ status: "fail", msg });
  console.log(`  ${RED}❌ ${msg}${RESET}`);
}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: "pipe" }).trim();
  } catch (e) {
    console.error(`  [quality-gate] 命令执行失败: ${cmd} — ${e.message}`);
    return "";
  }
}

console.log(`\n${BOLD}=== Vibecoding Quality Gate ===${RESET}\n`);

// 1. 密钥扫描
console.log(`${BOLD}[1/4] 密钥扫描${RESET}`);
const secretPatterns = [
  /sk-[a-zA-Z0-9_-]{20,}/,
  /api[_-]?key['":\s]+\w{16,}/i,
  /password['":\s]+\w{6,}/i,
  /secret['":\s]+\w{8,}/i,
  /private_key/,
  /-----BEGIN.*PRIVATE KEY-----/,
];
const diff = run("git diff --cached -- .");
if (diff) {
  const lines = diff.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
  let found = false;
  for (const pattern of secretPatterns) {
    for (const line of lines) {
      if (pattern.test(line)) {
        fail(`发现可能的密钥泄露: ${line.trim().slice(0, 80)}`);
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (!found) pass("未发现密钥泄露");
} else {
  pass("无变更需要扫描");
}

// 2. Protected Region 检查
console.log(`\n${BOLD}[2/4] Protected Region 检查${RESET}`);
const archPath = path.join(process.cwd(), "docs", "02-ARCHITECTURE.md");
if (fs.existsSync(archPath)) {
  const arch = fs.readFileSync(archPath, "utf8");
  // 匹配所有 Protected Region 块（支持多个代码块）
  const protectedBlocks = arch.match(/Protected Region[\s\S]*?(?=\n##|\n$)/g);
  if (protectedBlocks) {
    const protectedFiles = [];
    for (const block of protectedBlocks) {
      const lines = block.split("\n");
      for (const line of lines) {
        const m = line.match(/^\s*[-*]\s*`([^`]+)`/);
        if (m) protectedFiles.push(m[1]);
      }
    }
    if (protectedFiles.length > 0) {
      const changedFiles = run("git diff --cached --name-only").split("\n").filter(Boolean);
      let touched = false;
      for (const pf of protectedFiles) {
        const pattern = pf.replace(/\*/g, "\\w+").replace(/\./g, "\\.");
        const regex = new RegExp(pattern);
        if (changedFiles.some((f) => regex.test(f))) {
          fail(`Protected Region 文件被修改: ${pf}`);
          touched = true;
        }
      }
      if (!touched) pass("Protected Region 未被修改");
    } else {
      pass("未配置 Protected Region");
    }
  } else {
    pass("未配置 Protected Region");
  }
} else {
  pass("未找到架构文档，跳过 Protected Region 检查");
}

// 3. 变更范围检查
console.log(`\n${BOLD}[3/4] 变更范围检查${RESET}`);
const changedFiles = run("git diff --cached --name-only").split("\n").filter(Boolean);
if (changedFiles.length > 0) {
  // 检查是否只修改了预期文件（排除 .opencode/ .vibecoding/ .gitignore 等）
  const unexpected = changedFiles.filter(
    (f) =>
      !f.startsWith(".opencode/") &&
      !f.startsWith(".gitignore") &&
      !f.startsWith("docs/") &&
      !f.startsWith("slices/") &&
      !f.startsWith("src/") &&
      !f.startsWith("tests/") &&
      !f.startsWith("references/") &&
      !f.startsWith("AGENTS.md") &&
      !f.startsWith("README.md")
  );
  if (unexpected.length > 0) {
    warn(`变更多个文件: ${unexpected.join(", ")} — 请确认是否在预期范围内`);
  } else {
    pass("变更范围在预期内");
  }
} else {
  pass("无变更文件");
}

// 4. 文档同步检查
console.log(`\n${BOLD}[4/4] 文档同步检查${RESET}`);
const prdPath = path.join(process.cwd(), "docs", "01-PRD.md");
const statusPath = path.join(process.cwd(), "docs", "03-STATUS.md");
let docChanged = false;
if (changedFiles.length > 0) {
  const hasCodeChanges = changedFiles.some(
    (f) => f.startsWith("src/") || f.startsWith("slices/")
  );
  docChanged = changedFiles.some(
    (f) => f.startsWith("docs/01-PRD.md") || f.startsWith("docs/02-ARCHITECTURE.md")
  );
  if (hasCodeChanges) {
    if (!changedFiles.includes("docs/03-STATUS.md")) {
      warn("有代码变更但 STATUS.md 未更新 — 请更新项目状态");
    } else {
      pass("STATUS.md 已同步更新");
    }
  } else {
    pass("无代码变更，跳过文档同步检查");
  }
} else {
  pass("无变更");
}

// 5. 文档同步建议
console.log(`\n${BOLD}[5] 文档同步建议${RESET}`);
if (docChanged) {
  console.log(`  ${YELLOW}💡 docs/ 有变更，建议运行: /vault-sync --sync-docs${RESET}`);
} else {
  pass("docs/ 无变更，无需同步");
}

// 总结
console.log(`\n${BOLD}=== 审计总结 ===${RESET}`);
const fails = results.filter((r) => r.status === "fail");
const warns = results.filter((r) => r.status === "warn");
const passes = results.filter((r) => r.status === "pass");

console.log(`  ${GREEN}通过: ${passes.length}${RESET}`);
console.log(`  ${YELLOW}警告: ${warns.length}${RESET}`);
console.log(`  ${RED}阻断: ${fails.length}${RESET}`);

if (fails.length > 0) {
  console.log(`\n${RED}${BOLD}❌ 阻断项存在，请修复后重新提交${RESET}\n`);
  process.exit(1);
} else {
  console.log(`\n${GREEN}${BOLD}✅ 质量门禁通过，可以提交${RESET}\n`);
  process.exit(0);
}