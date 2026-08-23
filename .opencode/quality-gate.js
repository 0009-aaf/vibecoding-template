/**
 * quality-gate.js - 项目质量闸门
 *
 * 由 /vibe-plan 从 ~/.config/opencode/templates/quality-gate-template.js 复制生成。
 * 根据项目技术栈和库清单调整检测规则。
 *
 * 检查项：
 *   M01 密钥扫描（阻断）
 *   M02 Protected Region 修改（阻断）
 *   M03 跨 feature import（阻断）
 *   M06 空仓库（通过）
 *   M07 SKIP_VIBE_GATE 跳过（通过）
 *   M08 无 git 仓库降级（通过）
 *   M10 跨 feature import（阻断，同 M03）
 *   M16 库清单外库检测 / 自造轮子（阻断）
 *   M17 测试覆盖率（项目配置了 coverage 脚本时执行，非零退出阻断；未配置则跳过）
 *   M18 有 UI 切片缺 E2E（阻断）
 *   M19 spec 测试用例未实现（阻断）
 *   M20 测试文件不在规定目录（警告）
 *   G05 架构完备性（vibe 项目：NFR+十维度选型+ADR，阻断）
 *
 * 注：M04/M05/M09/M14/M15 历史声明未实现，已从检查项中移除，避免假安全感。
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// === 配置（由 /vibe-plan 根据架构文档填充）===

// 库清单（来自 docs/02-ARCHITECTURE.md §6）
// vibe-plan 生成时替换下方整行为实际库清单 JS 数组
// 每个库的 forbiddenPatterns 是该库功能的自造轮子信号词（英文，不受 CJK 分词影响）
// __APPROVED_LIBS_REPLACE_START__
const APPROVED_LIBS = [];
// __APPROVED_LIBS_REPLACE_END__

// 测试覆盖率目标（来自 docs/02-ARCHITECTURE.md §8）
const COVERAGE_TARGETS = {
  unit: 80,
  integration: 100, // 核心 API
  e2e: 100, // 验收标准
};

// 测试目录
const TEST_DIRS = {
  unit: 'tests/unit/',
  integration: 'tests/integration/',
  e2e: 'e2e/',
  fixtures: 'tests/fixtures/',
};

// Protected Region 文件列表（来自 docs/02-ARCHITECTURE.md §5）
// vibe-plan 生成时替换为实际文件列表
// 默认保护：质量闸门自身 + 行为规范模板。
// starter-template/AGENTS.md 仅模板项目存在；新项目复制后该路径不存在 -> M02 永不触发，无害。
const PROTECTED_REGIONS = [
  '.opencode/quality-gate.js',
  'starter-template/AGENTS.md',
];

// === 检查逻辑 ===

const cwd = process.cwd();

function tryExec(cmd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    return null;
  }
}

function getStagedFiles() {
  const out = tryExec('git diff --cached --name-only');
  if (!out) return [];
  return out.trim().split('\n').filter(Boolean);
}

function getAllTrackedFiles() {
  const out = tryExec('git ls-files');
  if (!out) return [];
  return out.trim().split('\n').filter(Boolean);
}

function isGitRepo() {
  return tryExec('git rev-parse --git-dir') !== null;
}

function getFileContent(file) {
  try {
    return fs.readFileSync(path.join(cwd, file), 'utf8');
  } catch (e) {
    return '';
  }
}

// M01: 密钥扫描
function checkSecrets(files) {
  const secretPatterns = [
    /sk-[a-zA-Z0-9_-]{20,}/,           // API key (sk-xxx, 允许 - 和 _)
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/, // PEM private key
    /(?:api[_-]?key|password|secret|access[_-]?token|token)\s*"?\s*[:=]\s*["'][^"']{12,}["']/i, // key=value（12+字符降低误报；"? 兼容 JSON 键 `"access_token": "..."`）
  ];
  // 排除测试文件和 mock 文件
  const testFilePattern = /\.(test|spec)\.(js|ts|tsx|jsx)$|\/(mock|fixture|__mocks__)\//i;
  const issues = [];
  for (const file of files) {
    if (testFilePattern.test(file)) continue; // 跳过测试文件
    if (!/\.(js|ts|tsx|jsx|py|json|yaml|yml|env|cfg|conf|ini)$/.test(file) && !file.endsWith('.env')) continue;
    const content = getFileContent(file);
    for (const pattern of secretPatterns) {
      const match = content.match(pattern);
      if (match) {
        issues.push({ file, match: match[0].substring(0, 30) + '...' });
      }
    }
  }
  return issues;
}

// M02: Protected Region 修改（首次创建允许，后续修改阻断）
// 只检查暂存区有变更的文件（git diff --cached），不检查所有追踪文件
function checkProtectedRegion(stagedFiles) {
  const issues = [];
  for (const file of stagedFiles) {
    for (const pattern of PROTECTED_REGIONS) {
      // 转义正则特殊字符，只把 * 当通配符
      const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      const regex = new RegExp('^' + escaped + '$');
      if (regex.test(file)) {
        // 检查文件在 HEAD 是否存在（首次创建允许）
        const existsInHead = tryExec(`git cat-file -e "HEAD:${file.replace(/\\/g, '/')}"`) !== null;
        if (existsInHead) {
          issues.push({ file, pattern });
        }
      }
    }
  }
  return issues;
}

// M03/M10: 跨 feature import 检查
function checkCrossFeatureImport(files) {
  const issues = [];
  for (const file of files) {
    if (!/^src\/features\/[^/]+\//.test(file)) continue;
    const featureMatch = file.match(/^src\/features\/([^/]+)\//);
    if (!featureMatch) continue;
    const currentFeature = featureMatch[1];

    const content = getFileContent(file);
    const importLines = content.match(/^import\s+.*$/gm) || [];

    for (const line of importLines) {
      // 相对路径跨 feature: ../../<other-feature>/（需要至少两层 ../ 才算跨 feature）
      // ../domain/schema 是同 feature 内的 import，不算跨 feature
      const relMatch = line.match(/from\s+["'](\.\.\/){2,}([^/]+)\/[^"']*["']/);
      if (relMatch && relMatch[2] !== currentFeature && relMatch[2] !== 'shared') {
        issues.push({ file, line: line.trim(), target: relMatch[2], type: 'relative' });
      }

      // 显式路径跨 feature: @/features/<other-feature>/
      const absMatch = line.match(/from\s+["']@\/features\/([^/]+)\/[^"']*["']/);
      if (absMatch && absMatch[1] !== currentFeature) {
        issues.push({ file, line: line.trim(), target: absMatch[1], type: 'absolute' });
      }
    }
  }
  return issues;
}

// 测试框架白名单（不需要在库清单中声明的基础工具）
const FRAMEWORK_WHITELIST = ['vitest', 'jest', 'playwright', 'typescript', 'ts-node', '@types/node', 'tsx', 'esbuild'];

// M16: 库清单外库检测 + 自造轮子检测
function checkLibCompliance(files) {
  const issues = [];

  // 检查 package.json 中的依赖是否在库清单中
  const pkgContent = getFileContent('package.json');
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      const approvedNames = APPROVED_LIBS.map(l => l.name);
      for (const dep of Object.keys(deps)) {
        if (!approvedNames.includes(dep) && !FRAMEWORK_WHITELIST.includes(dep)) {
          issues.push({ type: 'unapproved-lib', lib: dep });
        }
      }
    } catch (e) {
      // package.json 解析失败：库清单检查失去依据，阻断并显式报告
      issues.push({ type: 'pkg-parse-error', file: 'package.json', reason: (e && e.message) || String(e) });
    }
  }

  // 检查 src/shared/lib/ 是否有库的等价功能（自造轮子）
  // 用 forbiddenPatterns（英文关键词）匹配，不受 CJK 分词影响
  const libsWithPatterns = APPROVED_LIBS.filter(l => l.forbiddenPatterns && l.forbiddenPatterns.length > 0);
  for (const file of files) {
    if (!file.startsWith('src/shared/lib/')) continue;
    const content = getFileContent(file).toLowerCase();
    const filename = path.basename(file, path.extname(file)).toLowerCase();
    for (const lib of libsWithPatterns) {
      for (const pattern of lib.forbiddenPatterns) {
        const p = pattern.toLowerCase();
        if (content.includes(p) || filename.includes(p)) {
          issues.push({ type: 'self-impl', file, lib: lib.name, pattern });
          break; // 同一文件同一库只报一次
        }
      }
    }
  }

  return issues;
}

// M17-M20: 测试检查
function checkTests(files, cwd) {
  const issues = [];

  // M20: 测试文件不在规定目录
  for (const file of files) {
    if (/\.test\.(js|ts|tsx)$/.test(file) && !file.startsWith(TEST_DIRS.unit) && !file.startsWith(TEST_DIRS.integration)) {
      issues.push({ code: 'M20', type: 'wrong-dir', file });
    }
    if (/\.spec\.(js|ts|tsx)$/.test(file) && !file.startsWith(TEST_DIRS.e2e)) {
      issues.push({ code: 'M20', type: 'wrong-dir', file });
    }
  }

  // M18: 有 UI 切片缺 E2E 测试
  // 检查是否有 UI 组件变更但 e2e/ 目录无对应 spec
  // UI 判定：目录段 ui/components/pages/views/screens，或 src/ 下前端组件扩展名；排除测试与 e2e 文件
  const isUiFile = (f) => {
    if (/\.(test|spec)\./.test(f) || f.startsWith(TEST_DIRS.e2e)) return false;
    return /\/(ui|components|pages|views|screens)\//.test(f) || (/^src\//.test(f) && /\.(tsx|jsx|vue|svelte)$/.test(f));
  };
  const hasUiChange = files.some(isUiFile);
  const hasE2e = files.some(f => f.startsWith(TEST_DIRS.e2e));
  if (hasUiChange && !hasE2e) {
    issues.push({ code: 'M18', type: 'missing-e2e', msg: '有 UI 变更但无 E2E 测试' });
  }

  // M19: spec 定义的测试文件是否已创建
  // 只对"进行中"或"待验收"的切片检查（"待开始"的切片还没写测试是正常的）
  const slicesDir = path.join(cwd, 'slices');
  const readmePath = path.join(cwd, 'slices', 'README.md');
  let activeSlices = new Set();
  if (fs.existsSync(readmePath)) {
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    // 解析切片列表，找状态为"进行中"或"待验收"的
    const lines = readmeContent.split('\n');
    for (const line of lines) {
      const match = line.match(/\|\s*(\d+)\s*\|[^|]*\|[^|]*\|\s*(进行中|待验收)\s*\|/);
      if (match) activeSlices.add(match[1]);
    }
  }
  if (fs.existsSync(slicesDir)) {
    const specDirs = fs.readdirSync(slicesDir).filter(d => fs.statSync(path.join(slicesDir, d)).isDirectory());
    for (const dir of specDirs) {
      // 提取编号（如 "001-base" -> "001"）
      const sliceId = dir.match(/^(\d+)/);
      if (!sliceId) continue;
      // 只检查活跃切片
      if (!activeSlices.has(sliceId[1])) continue;

      const specPath = path.join(slicesDir, dir, 'spec.md');
      if (!fs.existsSync(specPath)) continue;
      const specContent = fs.readFileSync(specPath, 'utf8');
      // 提取 spec 中提到的测试文件路径
      const testFileMatches = specContent.matchAll(/`(tests\/[^`]+|e2e\/[^`]+)`/g);
      for (const m of testFileMatches) {
        const testFile = m[1];
        const fullPath = path.join(cwd, testFile);
        if (!fs.existsSync(fullPath)) {
          issues.push({ code: 'M19', type: 'missing-test-file', file: testFile, slice: dir });
        }
      }
    }
  }

  return issues;
}

// M17: 覆盖率检查
// 项目 package.json 声明了 coverage 脚本（键名含 coverage）时运行；非零退出即阻断。
// 阈值由项目自身在 coverage 工具配置（如 c8 --check-coverage / istanbul thresholds）中
// 设定，本闸门只负责执行并判定退出码，不做脆弱的输出解析。
function runCoverageCheck() {
  const pkgContent = getFileContent('package.json');
  if (!pkgContent) {
    return { skipped: true, reason: 'no package.json', failures: [] };
  }
  let pkg;
  try {
    pkg = JSON.parse(pkgContent);
  } catch (e) {
    return { skipped: true, reason: 'package.json 解析失败', failures: [] };
  }
  const scripts = (pkg && pkg.scripts) || {};
  const scriptNames = Object.keys(scripts).filter(k => /coverage/i.test(k));
  if (scriptNames.length === 0) {
    return { skipped: true, reason: '未配置 coverage 脚本', failures: [] };
  }

  const failures = [];
  for (const name of scriptNames) {
    let ok = true;
    let out = '';
    try {
      out = execSync(`npm run ${name}`, {
        cwd,
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000, // 5 分钟上限，超时视为失败
      });
    } catch (e) {
      ok = false;
      out = (e.stdout || e.stderr || e.message || '').toString();
    }
    if (!ok) {
      const tail = out.split('\n').filter(Boolean).slice(-15).join('\n');
      failures.push({ script: name, output: tail });
    }
  }
  return { skipped: false, failures, scripts: scriptNames };
}

// G05: 架构完备性检查（vibe 工作流项目）
// 采用 vibe 工作流（存在 docs/01-PRD.md 或 docs/02-ARCHITECTURE.md）时强制：
//   - NFR 已量化（PRD §3.1 或 ARCHITECTURE 含 规模/SLO/并发/数据量/RTO·RPO）
//   - 十维度选型表存在且十维均有答案（允许显式"不适用"）
//   - ADR 决策记录存在
// 反臃肿原则：校验"有答案"而非"有内容"；非 vibe 项目（无 PRD/ARCH）跳过。
function checkArchitectureCompleteness() {
  const arch = getFileContent('docs/02-ARCHITECTURE.md');
  const prd = getFileContent('docs/01-PRD.md');

  // 非 vibe 项目（如纯 C 嵌入式/未采用工作流）→ 跳过，不误伤
  if (!arch && !prd) return { skipped: true, issues: [] };
  if (!arch) {
    return { skipped: false, issues: [{ type: 'missing-arch', msg: 'docs/02-ARCHITECTURE.md 不存在（vibe 项目须产出架构文档）' }] };
  }

  const issues = [];

  // G05.1: NFR 量化（PRD §3.1 或 ARCHITECTURE）
  const nfrPattern = /可用性|SLO|并发|数据量|RTO|RPO|NFR|规模/;
  if (!nfrPattern.test(prd) && !nfrPattern.test(arch)) {
    issues.push({ type: 'missing-nfr', msg: '缺少 NFR 量化（规模/SLO/并发/数据量/RTO·RPO 至少一项）' });
  }

  // G05.2: 十维度选型表（§9 段落或等价表头）
  const sectionMatch = arch.match(/##\s*9[.、][^\n]*\n([\s\S]*?)(?=\n##\s|$)/);
  if (!sectionMatch && !/\| 维度 \| 选型 \|/.test(arch)) {
    issues.push({ type: 'missing-selection-table', msg: '缺少十维度选型表（docs/02-ARCHITECTURE.md §9）' });
  }

  // G05.3: 十维度每维必须有答案（选型 或 显式"不适用"），限定 §9 段落内检查
  const section = sectionMatch ? sectionMatch[1] : arch;
  const topics = [
    { key: '架构风格', label: 'D1 架构风格' },
    { key: '前端|客户端', label: 'D2 前端/客户端' },
    { key: '后端', label: 'D3 后端' },
    { key: '数据库', label: 'D4 数据库' },
    { key: '内存|缓存', label: 'D5 内存/缓存' },
    { key: '并发', label: 'D6 高并发' },
    { key: '事务', label: 'D7 事务和锁' },
    { key: 'CICD|CI', label: 'D8 CICD' },
    { key: '灾备|备份', label: 'D9 灾备' },
    { key: '部署', label: 'D10 部署' },
  ];
  for (const t of topics) {
    if (!new RegExp(t.key, 'i').test(section)) {
      issues.push({ type: 'missing-topic', topic: t.label, msg: `十维度选型表缺 ${t.label}（可标注"不适用(理由)"）` });
    }
  }

  // G05.4: ADR 决策记录
  const decisions = getFileContent('docs/05-DECISIONS.md');
  if (!decisions || !/ADR-\d+/.test(decisions)) {
    issues.push({ type: 'missing-adr', msg: '缺少 ADR 决策记录（docs/05-DECISIONS.md，须含 ADR-NNN 条目）' });
  }

  return { skipped: false, issues };
}

// === 主流程 ===

function main() {
  // M07: SKIP_VIBE_GATE
  if (process.env.SKIP_VIBE_GATE === '1') {
    console.log('⏭️  SKIP_VIBE_GATE=1，跳过质量门禁');
    console.log('通过: 0\n警告: 0\n阻断: 0');
    process.exit(0);
  }

  const checks = {
    pass: 0,
    warn: 0,
    block: 0,
  };

  const blockers = [];
  const warnings = [];

  // M08: 无 git 仓库降级
  if (!isGitRepo()) {
    console.log('⚠️  非 git 仓库，跳过 git 相关检查');
    console.log('通过: 0\n警告: 0\n阻断: 0');
    process.exit(0);
  }

  // 获取变更文件
  let files = getStagedFiles();
  if (files.length === 0) {
    files = getAllTrackedFiles(); // 无暂存文件时检查所有追踪文件
  }

  // M06: 空仓库
  if (files.length === 0) {
    console.log('✅ 空仓库，所有检查通过');
    console.log('通过: 0\n警告: 0\n阻断: 0');
    process.exit(0);
  }

  // M01: 密钥扫描
  const secretIssues = checkSecrets(files);
  if (secretIssues.length > 0) {
    checks.block++;
    blockers.push({
      code: 'M01',
      name: '密钥泄露',
      issues: secretIssues,
    });
  } else {
    checks.pass++;
  }

  // M02: Protected Region（只检查暂存区有变更的文件）
  const stagedFiles = getStagedFiles();
  const prIssues = checkProtectedRegion(stagedFiles);
  if (prIssues.length > 0) {
    checks.block++;
    blockers.push({
      code: 'M02',
      name: 'Protected Region 文件被修改',
      issues: prIssues,
    });
  } else {
    checks.pass++;
  }

  // M03/M10: 跨 feature import
  const importIssues = checkCrossFeatureImport(files);
  if (importIssues.length > 0) {
    checks.block++;
    blockers.push({
      code: 'M10',
      name: '跨 feature import',
      issues: importIssues,
    });
  } else {
    checks.pass++;
  }

  // M16: 库清单
  const libIssues = checkLibCompliance(files);
  if (libIssues.length > 0) {
    checks.block++;
    blockers.push({
      code: 'M16',
      name: '库清单违规（未批准的库或自造轮子）',
      issues: libIssues,
    });
  } else {
    checks.pass++;
  }

  // M17: 测试覆盖率（项目配置了 coverage 脚本才执行）
  const cov = runCoverageCheck();
  if (cov.skipped) {
    checks.pass++; // 未配置 coverage -> 无强制依据，跳过
  } else if (cov.failures.length > 0) {
    checks.block++;
    blockers.push({
      code: 'M17',
      name: '测试覆盖率未达标（coverage 脚本非零退出）',
      issues: cov.failures,
    });
  } else {
    checks.pass++;
  }

  // M20: 测试目录 + M18/M19 测试存在性
  const testIssues = checkTests(files, cwd);
  if (testIssues.length > 0) {
    // M18/M19 是阻断项，M20 是警告项
    const testBlockers = testIssues.filter(i => i.code === 'M18' || i.code === 'M19');
    const testWarnings = testIssues.filter(i => i.code === 'M20');
    if (testBlockers.length > 0) {
      checks.block++;
      blockers.push({
        code: 'M18/M19',
        name: '测试缺失（E2E 或 spec 定义的测试文件未创建）',
        issues: testBlockers,
      });
    }
    if (testWarnings.length > 0) {
      checks.warn++;
      warnings.push({
        code: 'M20',
        name: '测试文件不在规定目录',
        issues: testWarnings,
      });
    }
  } else {
    checks.pass++;
  }

  // M14/M15: 未实现，已从检查项移除（避免假安全感 —— 同 M09 先例）

  // G05: 架构完备性（vibe 项目强制，非 vibe 项目跳过）
  const archCheck = checkArchitectureCompleteness();
  if (archCheck.skipped) {
    checks.pass++; // 非 vibe 项目，无架构检查依据
  } else if (archCheck.issues.length > 0) {
    checks.block++;
    blockers.push({
      code: 'G05',
      name: '架构完备性（NFR/十维度选型/ADR 缺失）',
      issues: archCheck.issues,
    });
  } else {
    checks.pass++;
  }

  // === 输出报告 ===

  console.log('═══════════════════════════════════════');
  console.log('  质量闸门报告');
  console.log('═══════════════════════════════════════\n');

  if (blockers.length > 0) {
    console.log('❌ 阻断项：');
    for (const b of blockers) {
      console.log(`  [${b.code}] ${b.name}`);
      for (const issue of b.issues) {
        console.log(`    - ${JSON.stringify(issue)}`);
      }
    }
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  警告项：');
    for (const w of warnings) {
      console.log(`  [${w.code}] ${w.name}`);
      for (const issue of w.issues) {
        console.log(`    - ${JSON.stringify(issue)}`);
      }
    }
    console.log('');
  }

  console.log(`通过: ${checks.pass}`);
  console.log(`警告: ${checks.warn}`);
  console.log(`阻断: ${checks.block}`);

  if (checks.block > 0) {
    console.log('\n❌ 质量闸门未通过，请修复阻断项后重新运行');
    process.exit(1);
  } else {
    console.log('\n✅ 质量闸门通过');
    process.exit(0);
  }
}

main();
