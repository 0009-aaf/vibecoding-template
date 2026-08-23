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
 *
 * 退出码：0 = 通过（可含警告），1 = 存在漂移（阻断）。
 * 逃生阀：SKIP_CHECK_SYNC=1 跳过全部检查（须在 commit message 说明原因）。
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
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
  const deployedRoot = path.join(process.env.USERPROFILE || '', '.config', 'opencode');
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

// === S5: ARCH-template 与 architecture-designer 双源 sync-hash ===

function checkSyncHash() {
  const pairs = [
    ['global/templates/ARCH-template.md', 'global/skills/architecture-designer/SKILL.md'],
  ];
  const issues = [];
  for (const [a, b] of pairs) {
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

// === 主流程 ===

function main() {
  if (process.env.SKIP_CHECK_SYNC === '1') {
    console.log('⏭️  SKIP_CHECK_SYNC=1，跳过漂移检测');
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
