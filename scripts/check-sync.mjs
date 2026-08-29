#!/usr/bin/env node
/**
 * check-sync.mjs - 多副本/引用漂移检测器
 *
 * 根治"同步更新的文档不会自动更新"：模板源与副本、文档引用、双源镜像之间的
 * 一致性由机器校验，不依赖 LLM 自觉。挂载点：
 *   - global/plugins/vibe-gate（git commit 前自动运行，若本脚本存在）
 *   - /vibe-audit 漂移检测检查项
 *   - 手动：node scripts/check-sync.mjs
 *
 * 检查项：
 *   S1 quality-gate 三份文件检查项 ID 集合一致（模板 + 根副本 + starter 副本）
 *   S2 旧编号/过期引用归零（STALE_REFERENCES 清单，含 "06-CODING-STANDARDS" 等）
 *   S3 命令引用真实存在（/xxx 必须有 global/commands/xxx.md 或在 EXTERNAL_COMMANDS 白名单）
 *   S4 global/ 与 ~/.config/opencode 副本哈希对比（警告级：部署是手动动作，不阻断）
 *   S5 ARCH-template 与 architecture-designer 双源 sync-hash 标记相等
 *   S6 文档结构校验（docs/00-DOC-STANDARD：编号白名单/H1/引言/变更记录）
 *   S7 skill 路由完整性 + skill 名引用存在性（S7a 总纲路由双向比对；S7b `X` skill / skill("X") 必须有目录）
 *   S8 文档声明机制存在性：AGENTS.md/README/docs/starter 中声明的关键路径（scripts/、harness 脚本）
 *      必须真实存在；运行时生成文件（active-context.md）校验其写入脚本存在。防"文档承诺了不存在的机制"。
 *   S9 active-context 新鲜度（警告级）：active-context.md 存在时，其"更新于"日期落后 HEAD 最新提交
 *      >3 天即警告提示刷新/归档——防跨会话注入过时上下文（运行时文件，缺失跳过）。
 *
 * 退出码：0 = 通过（可含警告），1 = 存在漂移（阻断）。
 * 逃生阀：SKIP_CHECK_SYNC=1 跳过全部检查（须在 commit message 说明原因）。
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// === 配置 ===

// S2: 已重命名/废弃的引用，全仓文本文件中出现即报漂移
const STALE_REFERENCES = ['06-CODING-STANDARDS'];

// S3: 外部 agent-team 命令（部署在 ~/.claude/harness，不在本仓库，与 vibe-README 决策表注释保持一致）
const EXTERNAL_COMMANDS = new Set([
  'project-design', 'goal', 'fix-bug', 'code-review', 'adversarial-review',
  'tech-research', 'full-dev', 'search-vault', 'blackboard-health', 'stats', 'eval',
]);

// S3: 命令命名空间——首段命中才按"命令引用"校验（区分 /vibe-plan 与路径/示例 /app-slice-002）
const COMMAND_NAMESPACE = new Set([
  'vibe', 'focus', 'vault', 'execution', 'plan', // 内部命令族
  'project', 'goal', 'fix', 'code', 'adversarial', 'tech',
  'search', 'stats', 'eval', // 外部 agent-team 族
]);

// S3: 形如命令但实为目录/外部路径的名称（plugins/ 下插件、harness 任务目录）
const NON_COMMAND_NAMES = new Set(['vibe-command-structure']);

// 扫描时跳过的目录
const SKIP_DIRS = new Set(['.git', 'node_modules', '.ruff_cache', 'references', '.vibecoding']);

// === 工具函数 ===

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readText(p) {
  if (!fs.existsSync(p)) return null; // 入口判空：调用方处理不存在
  return fs.readFileSync(p, 'utf8');
}

function walkFiles(dir, exts, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, exts, acc);
    else if (exts.length === 0 || exts.includes(path.extname(entry.name))) acc.push(full);
  }
  return acc;
}

function rel(p) {
  return path.relative(repoRoot, p).replaceAll('\\', '/');
}

function hashFile(p) {
  return createHash('md5').update(fs.readFileSync(p)).digest('hex');
}

// === S1: quality-gate 三份一致（双指标：强制注册 ID 集合 + 配置区剥离后全文哈希） ===

// 提取实际注册进 blockers/warnings 的检查项 ID（code: 'XX' 模式）——注释里提到不算数
function extractEnforcedIds(text) {
  const ids = new Set();
  for (const m of text.matchAll(/\bcode:\s*['"]([MG]\d{2}(?:\.\d+)?)['"]/g)) ids.add(m[1]);
  return ids;
}

// 剥离 "// === 配置" 到 "const cwd" 之间的项目配置区（模板占位 vs 副本实填），其余内容必须逐字节一致
function normalizeGateScript(text) {
  const start = text.indexOf('// === 配置');
  const end = text.indexOf('const cwd');
  if (start === -1 || end === -1 || end < start) return null; // 结构标记缺失，视为漂移
  return text.slice(0, start) + text.slice(end);
}

function checkQualityGateIds() {
  const files = [
    'global/templates/quality-gate-template.js',
    '.opencode/quality-gate.js',
    'starter-template/.opencode/quality-gate.js',
  ];
  const missing = files.filter((f) => !fs.existsSync(path.join(repoRoot, f)));
  if (missing.length > 0) {
    return { issues: [`quality-gate 文件缺失: ${missing.join(', ')}`] };
  }
  const parsed = files.map((f) => {
    const text = readText(path.join(repoRoot, f)) || '';
    return { file: f, enforced: extractEnforcedIds(text), bodyHash: createHash('md5').update(normalizeGateScript(text) ?? 'NORMALIZE_FAILED').digest('hex'), normalized: normalizeGateScript(text) !== null };
  });
  const baseline = parsed[0];
  const issues = [];
  for (const s of parsed.slice(1)) {
    const missingIds = [...baseline.enforced].filter((id) => !s.enforced.has(id));
    const extraIds = [...s.enforced].filter((id) => !baseline.enforced.has(id));
    if (missingIds.length > 0) issues.push(`${rel(s.file)} 缺强制检查项: ${missingIds.join(', ')}（模板有注册而副本没有）`);
    if (extraIds.length > 0) issues.push(`${rel(s.file)} 多出强制检查项: ${extraIds.join(', ')}（模板没有而副本有）`);
    if (!s.normalized || !baseline.normalized) {
      issues.push(`${rel(s.file) || s.file} 配置区标记缺失（// === 配置 或 const cwd），无法归一化比对`);
    } else if (baseline.bodyHash !== s.bodyHash) {
      issues.push(`${rel(s.file)} 检查逻辑与模板不一致（剥离配置区后哈希不同）——同步模板改动到副本`);
    }
  }
  return { issues, ids: [...baseline.enforced].sort().join(' ') };
}

// === S2: 旧编号/过期引用归零 ===

function checkStaleReferences() {
  const issues = [];
  const self = fileURLToPath(import.meta.url); // 跳过自身：配置区合法包含过期字符串
  const files = [
    ...walkFiles(path.join(repoRoot, 'global'), ['.md', '.js', '.mjs', '.ps1']),
    ...walkFiles(path.join(repoRoot, 'docs'), ['.md']),
    ...walkFiles(path.join(repoRoot, 'scripts'), ['.md', '.js', '.mjs', '.ps1']),
    ...walkFiles(path.join(repoRoot, 'starter-template'), ['.md', '.js']),
    path.join(repoRoot, 'README.md'),
    path.join(repoRoot, 'AGENTS.md'),
  ].filter((f) => fs.existsSync(f) && path.resolve(f) !== path.resolve(self));
  for (const file of files) {
    const text = readText(file);
    if (!text) continue;
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const stale of STALE_REFERENCES) {
        if (line.includes(stale)) {
          issues.push(`${rel(file)}:${i + 1} 含过期引用 "${stale}"`);
        }
      }
    });
  }
  return { issues, scanned: files.length };
}

// === S3: 命令引用真实存在 ===

function checkCommandReferences() {
  const issues = [];
  const commandsDir = path.join(repoRoot, 'global', 'commands');
  const existing = new Set(
    fs.existsSync(commandsDir)
      ? fs.readdirSync(commandsDir).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''))
      : []
  );
  const scanFiles = [
    ...walkFiles(commandsDir, ['.md']),
    path.join(repoRoot, 'README.md'),
    path.join(repoRoot, 'starter-template', 'AGENTS.md'),
    ...walkFiles(path.join(repoRoot, 'docs'), ['.md']),
  ].filter((f) => fs.existsSync(f));
  const refPattern = /\/([a-z][a-z0-9-]{2,})/g;
  const pluginsDir = path.join(repoRoot, 'global', 'plugins');
  for (const file of scanFiles) {
    const lines = (readText(file) || '').split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const m of line.matchAll(refPattern)) {
        const name = m[1].replace(/-+$/, ''); // 去尾部连字符（vibe-* 通配写法）
        if (!name) continue;
        if (existing.has(name) || EXTERNAL_COMMANDS.has(name)) continue;
        if (NON_COMMAND_NAMES.has(name)) continue; // 已知目录名（插件/harness 任务）
        if (fs.existsSync(path.join(pluginsDir, name))) continue; // plugins/ 下的目录引用
        // 只校验命令命名空间内的引用；其余视为路径/示例（如 /app-slice-002、fast/full/loop）
        const firstSegment = name.split('-')[0];
        if (!COMMAND_NAMESPACE.has(firstSegment) || COMMAND_NAMESPACE.has(name)) continue;
        issues.push(`${rel(file)}:${i + 1} 引用命令 /${name} 但 global/commands/ 中不存在（也不在 EXTERNAL_COMMANDS 白名单）`);
      }
    });
  }
  return { issues, existingCount: existing.size };
}

// === S4: global/ 与 ~/.config/opencode 哈希对比（警告级） ===

function checkDeployedSync() {
  // os.homedir() 跨平台（Windows USERPROFILE / POSIX HOME）；环境变量缺失时退化为相对路径会误判
  const deployedRoot = path.join(os.homedir(), '.config', 'opencode');
  const warnings = [];
  if (!fs.existsSync(deployedRoot)) {
    return { warnings, note: `未部署（${rel(deployedRoot)} 不存在），跳过` };
  }
  for (const sub of ['commands', 'skills', 'templates', 'plugins']) {
    const src = path.join(repoRoot, 'global', sub);
    if (!fs.existsSync(src)) continue;
    for (const file of walkFiles(src, [])) {
      const dst = path.join(deployedRoot, sub, path.relative(src, file));
      if (!fs.existsSync(dst)) {
        warnings.push(`${rel(file)} 未部署到全局（运行 sync-global.ps1）`);
        continue;
      }
      if (hashFile(file) !== hashFile(dst)) {
        warnings.push(`${rel(file)} 与全局部署副本不一致（仓库改动后未 sync）`);
      }
    }
  }
  return { warnings };
}

// S5: ARCH-template 与 architecture-designer 双源 sync-hash
// （双源对清单——新增双源镜像时在此追加）
const SYNC_HASH_PAIRS = [
  ['global/templates/ARCH-template.md', 'global/skills/architecture-designer/SKILL.md'],
];

// === S6: 文档结构校验（docs/00-DOC-STANDARD） ===

// 编号白名单（见 00-DOC-STANDARD §1）：docs/ 下出现白名单外的 NN- 前缀文件即漂移
const DOC_NUMBER_WHITELIST = new Set([
  '00-DOC-STANDARD', '01-PRD', '02-ARCHITECTURE', '03-STATUS', '04-CONTRACTS',
  '05-DECISIONS', '06-RUNBOOK', '07-SECURITY', '08-CODING-STANDARDS', '09-DESIGN',
]);

// 变更记录例外（00-DOC-STANDARD S4）：变更由文档自身机制承载
const CHANGELOG_EXEMPT = new Set(['03-STATUS', '04-CONTRACTS', '05-DECISIONS']);

// 模板侧变更记录/sync-hash 例外（DoD：定稿不重谈走 ADR；CONTRACTS：变更由 @slice 标记承载）
const TEMPLATE_EXEMPT = new Set(['DoD-template.md', 'CONTRACTS-template.md']);

// 围栏感知扫描：跳过 ``` 代码块内的行（防把 bash 注释/h1 样例误判为正文结构）
function scanMarkdownStructure(text) {
  const lines = text.split(/\r?\n/);
  let inFence = false;
  const structural = [];
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) structural.push(line);
  }
  return structural;
}

function checkDocStructure() {
  const issues = [];
  const docsDir = path.join(repoRoot, 'docs');
  if (!fs.existsSync(docsDir)) return { issues, docs: 0 };
  const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md'));
  for (const name of files) {
    const base = name.replace(/\.md$/, '');
    // S6a: 编号白名单（防野编号）
    if (/^\d\d-/.test(name) && !DOC_NUMBER_WHITELIST.has(base)) {
      issues.push(`docs/${name}: 编号不在白名单（见 docs/00-DOC-STANDARD.md §1，新文档续用空闲编号）`);
    }
    if (!/^\d\d-/.test(name)) continue; // 无编号文件（DoD/TECH-DEBT 等）不查四件
    const lines = scanMarkdownStructure(readText(path.join(docsDir, name)) || '');
    // S6b: H1 恰好一个
    const h1Lines = lines.filter((l) => /^# [^\s]/.test(l));
    const h1Idx = lines.findIndex((l) => /^# [^\s]/.test(l));
    if (h1Lines.length !== 1) {
      issues.push(`docs/${name}: H1 标题数量=${h1Lines.length}（须恰好 1 个）`);
      continue;
    }
    // S6c: H1 后 3 行内引言 blockquote
    const introWindow = lines.slice(h1Idx + 1, h1Idx + 4);
    if (!introWindow.some((l) => l.startsWith('>'))) {
      issues.push(`docs/${name}: 缺引言 blockquote（H1 后 3 行内，见 00-DOC-STANDARD S2）`);
    }
    // S6d: 变更记录（例外清单）
    if (!CHANGELOG_EXEMPT.has(base) && !lines.some((l) => /^##\s*(\d+[.、]\s*)?变更记录/.test(l))) {
      issues.push(`docs/${name}: 缺"## 变更记录"章节（见 00-DOC-STANDARD S4）`);
    }
  }
  // S6e: 模板侧变更记录占位或 sync-hash 标记
  const templatesDir = path.join(repoRoot, 'global', 'templates');
  if (fs.existsSync(templatesDir)) {
    for (const name of fs.readdirSync(templatesDir)) {
      if (!name.endsWith('.md') || TEMPLATE_EXEMPT.has(name)) continue;
      const lines = scanMarkdownStructure(readText(path.join(templatesDir, name)) || '');
      const hasChangelog = lines.some((l) => /^##\s*(\d+[.、]\s*)?变更记录/.test(l));
      const raw = readText(path.join(templatesDir, name)) || '';
      if (!hasChangelog && !/<!--\s*sync-hash:/.test(raw)) {
        issues.push(`global/templates/${name}: 缺变更记录占位或 sync-hash 标记（模板侧规范）`);
      }
    }
  }
  return { issues, docs: files.length };
}

function checkSyncHash() {
  const issues = [];
  for (const [a, b] of SYNC_HASH_PAIRS) {
    const textA = readText(path.join(repoRoot, a));
    const textB = readText(path.join(repoRoot, b));
    const hashA = textA ? textA.match(/<!--\s*sync-hash:\s*(\d+)\s*-->/) : null;
    const hashB = textB ? textB.match(/<!--\s*sync-hash:\s*(\d+)\s*-->/) : null;
    if (!hashA || !hashB) {
      issues.push(`${!hashA ? a : b} 缺少 <!-- sync-hash: N --> 标记（双源镜像必须双侧标记）`);
      continue;
    }
    if (hashA[1] !== hashB[1]) {
      issues.push(`双源 sync-hash 不一致：${a}=${hashA[1]} vs ${b}=${hashB[1]}（一侧改动后须双向同步并同步 bump）`);
    }
  }
  return { issues };
}

// === S7: skill 路由完整性 + skill 名引用存在性 ===

// 部署在本仓库外的 skill（与 EXTERNAL_COMMANDS 同理；当前为空，出现第一个外部 skill 时扩表）
const EXTERNAL_SKILLS = new Set([]);

// S7a: coding-standards 总纲的路由声明（§六表格反引号名 + description 花括号枚举）
//      与 global/skills/ 实际目录双向比对——声明无目录=悬空；目录未声明=孤儿（不会被自动加载）
// S7b: 全仓 markdown 中被引用的 skill 名（`X` skill 紧邻模式 / skill("X") 调用）必须真实存在。
//      与 S3（命令引用）同构：引用存在性不靠自觉。
function checkSkillReferences() {
  const issues = [];
  const skillsDir = path.join(repoRoot, 'global', 'skills');
  const existing = new Set(
    fs.existsSync(skillsDir)
      ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
      : []
  );

  // --- S7a: 路由完整性（双向） ---
  const overviewPath = path.join(skillsDir, 'coding-standards', 'SKILL.md');
  const overview = readText(overviewPath) || '';
  const declared = new Set();
  for (const m of overview.matchAll(/`(coding-standards-[a-z0-9-]+)`/g)) declared.add(m[1]);
  for (const m of overview.matchAll(/coding-standards-\{([a-z0-9,-]+)\}/g)) {
    for (const item of m[1].split(',')) declared.add(`coding-standards-${item.trim()}`);
  }
  const actual = new Set([...existing].filter((d) => d.startsWith('coding-standards-')));
  for (const d of declared) {
    if (!actual.has(d)) issues.push(`S7a 路由悬空：总纲声明 \`${d}\` 但 global/skills/ 无此目录`);
  }
  for (const a of actual) {
    if (!declared.has(a)) issues.push(`S7a 路由孤儿：\`global/skills/${a}/\` 存在但总纲 §六路由表未登记（不会被自动加载）`);
  }

  // --- S7b: 引用存在性 ---
  const scanFiles = [
    ...walkFiles(path.join(repoRoot, 'global'), ['.md']),
    ...walkFiles(path.join(repoRoot, 'docs'), ['.md']),
    ...walkFiles(path.join(repoRoot, 'starter-template'), ['.md']),
    path.join(repoRoot, 'README.md'),
    path.join(repoRoot, 'AGENTS.md'),
    path.join(repoRoot, 'constitution.md'),
  ].filter((f) => fs.existsSync(f));
  // 两种强信号（防误报：参数化写法 coding-standards-<lang> 天然不匹配 [a-z0-9-]+"'" 的边界）
  const refPatterns = [
    /`([a-z][a-z0-9-]{2,})`(?=[^`\n]{0,12}\bskill\b)/gi, // `X` ... skill（反引号名后 12 字符内出现 skill）
    /\bskill\(\s*["']([a-z0-9-]{3,})["']/gi, // skill("X") 调用
  ];
  for (const file of scanFiles) {
    const lines = (readText(file) || '').split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const p of refPatterns) {
        p.lastIndex = 0;
        for (const m of line.matchAll(p)) {
          const name = m[1];
          if (existing.has(name) || EXTERNAL_SKILLS.has(name)) continue;
          issues.push(`${rel(file)}:${i + 1} 引用 skill \`${name}\` 但 global/skills/ 无此目录（也不在 EXTERNAL_SKILLS 白名单）`);
        }
      }
    });
  }
  return { issues, skills: existing.size, scanned: scanFiles.length };
}

// === S8: 文档声明机制存在性校验 ===

// 防"文档承诺了不存在的机制"（2026-08 教训：AGENTS.md 声称 active-context 启动必读，
// 但项目根无该文件、写入脚本也不存在——机制纯纸面）。规则：
//   - 扫描 AGENTS.md/README/docs/starter 中声明的关键路径（scripts/、harness 脚本、active-context.md）
//   - 声明的仓库路径必须存在；harness 脚本必须存在（harness 目录可配置）
//   - 运行时生成文件（active-context.md）允许缺失，但必须有其写入脚本（active-context.py）
const HARNESS_DIR = process.env.HARNESS_DIR || path.join(os.homedir(), '.claude', 'harness');

// S8 声明的关键机制清单：[声明引用子串, 仓库相对路径 | null, harness 脚本名 | null, vault 相对路径 | null]
// 新增机制时在此登记 + 同步 AGENTS.md 声明，双向防漂移
const DECLARED_MECHANISMS = [
  ['active-context.md', null, 'active-context.py', null],        // 运行时文件：校验写入脚本存在
  ['recall.py', null, 'recall.py', null],                        // 记忆召回
  ['reflect.py', null, 'reflect.py', null],                      // 反思循环
  ['golden-cases', null, null, '40_Knowledge/golden-cases'],     // 失败→回归用例目录（reflect.py 产出，R-02）
  ['blackboard.py', null, 'blackboard.py', null],                // Agent Team 黑板
  ['sync-routing-table.mjs', null, 'sync-routing-table.mjs', null], // skill 路由表同步
  ['sync-global.ps1', 'scripts/sync-global.ps1', null, null],    // 全局同步
  ['check-sync.mjs', 'scripts/check-sync.mjs', null, null],      // 漂移检测自身
  ['secret-matrix.mjs', 'scripts/secret-matrix.mjs', null, null],// 密钥矩阵回归
  ['quality-gate.js', '.opencode/quality-gate.js', null, null],  // 质量闸门
];

// 解析 vault 根路径（与 vault-sync 插件同源：opencode.json references.vault.path）
function resolveVaultPath() {
  const candidates = [
    process.env.OPENCODE_CONFIG,
    path.join(os.homedir(), '.config', 'opencode', 'opencode.json'),
  ].filter(Boolean);
  for (const cfgPath of candidates) {
    try {
      const cfg = JSON.parse(readText(cfgPath));
      const vp = cfg && cfg.references && cfg.references.vault && cfg.references.vault.path;
      if (typeof vp === 'string' && vp.trim()) return vp.trim();
    } catch { continue; /* 尝试下一候选 */ }
  }
  return null; // 无 vault 配置 → vault 类校验跳过（警告级提示）
}

function checkDeclaredMechanisms() {
  const issues = [];
  const vaultRoot = resolveVaultPath();
  // 清单即权威声明源（声明可能位于仓库外全局 AGENTS.md，无法扫描 → 无条件校验清单内所有项）
  for (const [ref, repoRel, harnessName, vaultRel] of DECLARED_MECHANISMS) {
    if (repoRel) {
      if (!fs.existsSync(path.join(repoRoot, repoRel))) {
        issues.push(`机制 \`${ref}\`：仓库内 ${repoRel} 不存在`);
      }
    }
    if (harnessName) {
      if (!fs.existsSync(path.join(HARNESS_DIR, harnessName))) {
        issues.push(`机制 \`${ref}\`：harness/${harnessName} 不存在（HARNESS_DIR=${HARNESS_DIR}）`);
      }
    }
    if (vaultRel) {
      if (!vaultRoot) {
        issues.push(`机制 \`${ref}\`：无法解析 vault 路径（opencode.json 无 references.vault.path），跳过校验`);
      } else if (!fs.existsSync(path.join(vaultRoot, vaultRel))) {
        issues.push(`机制 \`${ref}\`：vault 内 ${vaultRel} 目录不存在（由 reflect.py error_pattern 分类产出）`);
      }
    }
  }
  return { issues, scanned: DECLARED_MECHANISMS.length };
}

// === S9: active-context 新鲜度（警告级） ===
// 运行时文件 active-context.md 若存在，其"更新于"日期不应落后 HEAD 最新提交太久——
// 防止跨会话注入过时上下文（2026-08-29：四批优化完成但 active-context 停留在 8/25，注入的是旧上下文）。
// 阈值 AC_STALE_DAYS 天内算新鲜；文件缺失/非 git/无提交均跳过（入口判空）。
const AC_STALE_DAYS = 3;

function checkActiveContextFreshness() {
  const acPath = path.join(repoRoot, 'active-context.md');
  if (!fs.existsSync(acPath)) return { issues: [], skipped: true }; // 缺失即跳过（S8 已校验写入脚本存在）
  const text = fs.readFileSync(acPath, 'utf8');
  const m = text.match(/更新于\s*(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return { issues: ['active-context.md 存在但未解析到 `> 更新于 YYYY-MM-DD` 时间戳'], skipped: false };
  const updated = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
  let headDate = null;
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI'], { cwd: repoRoot, encoding: 'utf8' }).trim();
    headDate = new Date(out);
  } catch {
    return { issues: [], skipped: true }; // 非 git 仓库或无提交 → 无比较基准，跳过
  }
  if (Number.isNaN(updated.getTime()) || Number.isNaN(headDate.getTime())) {
    return { issues: [], skipped: true };
  }
  const days = Math.floor((headDate - updated) / 86400000);
  if (days > AC_STALE_DAYS) {
    return {
      issues: [`active-context.md 更新于 ${m[0].replace('更新于', '').trim()}，落后 HEAD 最新提交 ${days} 天（>${AC_STALE_DAYS} 天）——请刷新或将已完成任务归档`],
      skipped: false,
    };
  }
  return { issues: [], skipped: false };
}

// === 主流程 ===

function main() {
  if (process.env.SKIP_CHECK_SYNC === '1') {
    console.log('⏭️  SKIP_CHECK_SYNC=1，跳过漂移检测');
    console.log('⚠️  逃生阀已用——commit message 必须写明原因留痕（防逃逸滥用；约定见 docs/06-RUNBOOK.md）');
    process.exit(0);
  }

  const blockers = [];
  const warnings = [];

  const s1 = checkQualityGateIds();
  if (s1.issues.length > 0) blockers.push({ code: 'S1', name: 'quality-gate 三份检查项漂移', issues: s1.issues });
  const s2 = checkStaleReferences();
  if (s2.issues.length > 0) blockers.push({ code: 'S2', name: '过期引用未清理', issues: s2.issues });
  const s3 = checkCommandReferences();
  if (s3.issues.length > 0) blockers.push({ code: 'S3', name: '悬空命令引用', issues: s3.issues });
  const s5 = checkSyncHash();
  if (s5.issues.length > 0) blockers.push({ code: 'S5', name: '双源 sync-hash 漂移', issues: s5.issues });
  const s6 = checkDocStructure();
  if (s6.issues.length > 0) blockers.push({ code: 'S6', name: '文档结构不符合 00-DOC-STANDARD', issues: s6.issues });
  const s7 = checkSkillReferences();
  if (s7.issues.length > 0) blockers.push({ code: 'S7', name: 'skill 路由/引用漂移', issues: s7.issues });
  const s8 = checkDeclaredMechanisms();
  if (s8.issues.length > 0) blockers.push({ code: 'S8', name: '文档声明机制缺失', issues: s8.issues });
  const s9 = checkActiveContextFreshness();
  if (s9.issues.length > 0) warnings.push({ code: 'S9', name: 'active-context 过期', issues: s9.issues });
  const s4 = checkDeployedSync();
  if (s4.warnings.length > 0) warnings.push({ code: 'S4', name: '全局部署滞后（运行 sync-global.ps1）', issues: s4.warnings });

  console.log('═══════════════════════════════════════');
  console.log('  漂移检测报告 (check-sync)');
  console.log('═══════════════════════════════════════\n');

  console.log(`[S1] quality-gate 检查项一致性: ${s1.issues?.length ? '❌' : '✅'}（基线 ID: ${s1.ids || 'N/A'}）`);
  console.log(`[S2] 过期引用归零: ${s2.issues.length ? '❌' : '✅'}（扫描 ${s2.scanned} 文件）`);
  console.log(`[S3] 命令引用存在性: ${s3.issues.length ? '❌' : '✅'}（现有命令 ${s3.existingCount} 个 + 外部白名单 ${EXTERNAL_COMMANDS.size} 个）`);
  console.log(`[S4] 全局部署同步: ${s4.warnings.length ? '⚠️  ' + s4.warnings.length + ' 项滞后' : '✅'}${s4.note ? '（' + s4.note + '）' : ''}`);
  console.log(`[S5] 双源 sync-hash: ${s5.issues.length ? '❌' : '✅'}`);
  console.log(`[S6] 文档结构规范: ${s6.issues.length ? '❌' : '✅'}（docs ${s6.docs} 份 + 模板侧）`);
  console.log(`[S7] skill 路由/引用: ${s7.issues.length ? '❌' : '✅'}（${s7.skills} 个 skill，引用扫描 ${s7.scanned} 文件）`);
  console.log(`[S8] 文档声明机制: ${s8.issues.length ? '❌' : '✅'}（扫描 ${s8.scanned} 文件，清单 ${DECLARED_MECHANISMS.length} 项）`);
  console.log(`[S9] active-context 新鲜度: ${s9.issues.length ? '⚠️  ' + s9.issues.length + ' 项' : '✅'}${s9.skipped ? '（缺失跳过）' : ''}`);

  if (blockers.length > 0) {
    console.log('\n❌ 阻断项：');
    for (const b of blockers) {
      console.log(`  [${b.code}] ${b.name}`);
      for (const issue of b.issues) console.log(`    - ${issue}`);
    }
  }
  if (warnings.length > 0) {
    console.log('\n⚠️  警告项：');
    for (const w of warnings) {
      console.log(`  [${w.code}] ${w.name}`);
      for (const issue of w.issues) console.log(`    - ${issue}`);
    }
  }

  console.log(`\n阻断: ${blockers.length}  警告: ${warnings.length}`);
  if (blockers.length > 0) {
    console.log('❌ 漂移检测未通过：先同步多副本/修正引用再提交');
    process.exit(1);
  }
  console.log('✅ 漂移检测通过');
  process.exit(0);
}

try {
  main();
} catch (err) {
  console.error('❌ check-sync 执行异常：', err && err.message ? err.message : err);
  process.exit(1);
}
