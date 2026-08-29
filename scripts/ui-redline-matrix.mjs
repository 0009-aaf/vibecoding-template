/**
 * ui-redline-matrix.mjs — G05.7 UI 素材红线扫描器误报/漏报矩阵
 *
 * 防御机制必测纪律（AGENTS 编码底线第 6 条）：合法不误伤、违规不漏网，全绿才算 G05.7 落地。
 * 单一真源：直接 import .opencode/quality-gate.js 导出的 scanUiRedlines（三副本 MD5 锁一致，
 * 测其一即测全部；scripts/check-sync.mjs 保证副本漂移不可能长期存在）。
 *
 * 实现要点：gate 顶层 `const cwd = process.cwd()` 在模块加载时固化，而 CJS 经 ESM interop
 * 的动态 import 无法可靠产出独立实例。因此矩阵采用最直接的真实路径：把用例 HTML 短暂写入
 * 本仓库 references/design/preview-matrix.html -> 调用静态 gate 实例扫描（其 cwd 即仓库根）->
 * finally 无条件删除，全程端到端覆盖真实文件读取；任何中途崩溃都不会留下残留文件。
 *
 * 运行：node scripts/ui-redline-matrix.mjs   （exit 0 = 全绿）
 *
 * 饱和线（2026-08-29 机制审计）：覆盖已见 + 高频写法即停，不追未来/极端写法；
 * 新增用例前先判断是否真实事故（被漏拦过）再补，禁止"每次审查加用例"式无限膨胀。
 */

import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const GATE_PATH = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ''), '.opencode', 'quality-gate.js');
const REPO_ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ''));
const PREVIEW_REL = 'references/design/preview-matrix.html';

// 静态加载一次：仅校验导出契约（矩阵执行体用每用例独立实例）
const probeRequire = createRequire(import.meta.url);
const probe = probeRequire(GATE_PATH);
if (!probe || typeof probe.scanUiRedlines !== 'function') {
  console.error('[ui-redline-matrix] quality-gate 未导出 scanUiRedlines——G05.7 未落地或导出被移除');
  process.exit(1);
}

const TPL = (body) => `<!doctype html><html><head><meta charset="utf-8"><title>t</title></head><body>\n${body}\n</body></html>`;

// ---- 合法用例（期待 0 命中）：10 个 ----
const LEGAL = [
  { name: 'L1 内联 SVG 图标（stroke=currentColor）', html: TPL('<button type="button"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 12h16" stroke="currentColor" stroke-width="2"/></svg>保存更改</button>') },
  { name: 'L2 CSS 渐变背景（非位图 url）', html: TPL('<div class="hero" style="background:linear-gradient(135deg,#0f172a,#2563eb)">标题</div>') },
  { name: 'L3 data URI 内嵌 SVG 矢量', html: TPL('<span style="background-image:url(&quot;data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27/%3E&quot;)"></span>') },
  { name: 'L4 照片位灰阶占位盒 + TODO(asset)', html: TPL('<!-- TODO(asset): 首页主视觉图待用户提供 -->\n<div class="asset-placeholder" style="background:#e5e7eb;color:#6b7280">素材占位 TODO(asset)</div>') },
  { name: 'L5 中英混排与长破折号排版字符', html: TPL('<h1>L 团队 —— 设计交付清单</h1><p>vibe 工作流 · 2026 版</p>') },
  { name: 'L6 文本对勾 U+2713（非 emoji）', html: TPL('<ul><li>✓ 支持键盘焦点</li><li>✓ 对比度达标</li></ul>') },
  { name: 'L7 页脚版权行 ©®™ 减除白名单', html: TPL('<footer>© 2026 Example Studio · ® 商标 · ™ 标识</footer>') },
  { name: 'L8 Google Fonts link 外链字体', html: TPL('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"><p>字体加载</p>') },
  { name: 'L9 CSS 几何形卡片分隔线', html: TPL('<div style="width:48px;height:3px;background:#dc2626"></div>') },
  {
    name: 'L10 非 HTML 输入被忽略（verification 截图/null/数字 入口防御）',
    direct: () => probe.scanUiRedlines(['references/design/verification/slice-001/login-success.png', null, 42]),
  },
];

// ---- 违规用例（期待命中指定类型）：10 个 ----
const VIOLATION = [
  { name: 'V1 <img> 本地位图', types: ['img-tag'], html: TPL('<img src="./assets/hero.png" alt="主视觉">') },
  { name: 'V2 <img> 外链位图', types: ['img-tag'], html: TPL('<img src="https://cdn.example.com/photo.jpg" alt="示例">') },
  { name: 'V3 SVG 内嵌 <image>', types: ['svg-image'], html: TPL('<svg viewBox="0 0 24 24"><image href="./logo.png" width="24" height="24"/></svg>') },
  { name: 'V4 background-image 指向 webp', types: ['bg-bitmap'], html: TPL('<div style="background-image:url(bg.webp)"></div>') },
  { name: 'V5 background-image 引号 jpeg 变体', types: ['bg-bitmap'], html: TPL("<div style=\"background-image:url('art.jpeg')\"></div>") },
  { name: 'V6 base64 位图内嵌', types: ['img-tag', 'base64-bitmap'], html: TPL('<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" alt="">') },
  { name: 'V7 按钮文案 emoji', types: ['emoji'], html: TPL('<button type="button">🚀 一键部署</button>') },
  { name: 'V8 空状态 emoji + VS16 变体选择符', types: ['emoji'], html: TPL('<div class="empty">📦 暂无数据</div><p>⚠️ 请先保存</p>') },
  { name: 'V9 CSS 简写 background:url() 指位图（漏报边界回归）', types: ['bg-bitmap'], html: TPL('<div style="background:url(banner.png) center/cover no-repeat"></div>') },
  { name: 'V10 简写前置值/逗号分隔形态（background:#fff url(...)）', types: ['bg-bitmap'], html: TPL('<div style="background:#fff url(hero.jpg) center/cover no-repeat;background: linear-gradient(#000,#111), url(bg.webp)"></div>') },
];

// 在本仓库内落地用例文件 -> 静态 gate 实例扫描 -> finally 删除（真实 IO 全路径覆盖）
function scanInRepo(html) {
  const absFile = resolve(REPO_ROOT, PREVIEW_REL);
  mkdirSync(dirname(absFile), { recursive: true });
  // 只删除本次写入的固定名文件；若执行前同名文件已存在（异常环境），保留原件不销毁他人数据
  const existedBefore = existsSync(absFile);
  writeFileSync(absFile, html, 'utf8');
  try {
    return probe.scanUiRedlines([PREVIEW_REL]);
  } finally {
    if (!existedBefore) rmSync(absFile, { force: true });
  }
}

let legalOk = 0;
let badOk = 0;
let failCases = [];

for (const [idx, c] of [...LEGAL.map(c => ({ ...c, kind: '合法' })), ...VIOLATION.map(c => ({ ...c, kind: '违规' }))].entries()) {
  let ok = false;
  let detail = '';
  try {
    if (typeof c.direct === 'function') {
      const issues = c.direct();
      ok = issues.length === 0;
      detail = `issues=${JSON.stringify(issues).slice(0, 200)}`;
    } else if (c.kind === '合法') {
      const hitTypes = [...new Set(scanInRepo(c.html).map(i => i.type))];
      ok = hitTypes.length === 0;
      detail = `误伤类型 ${hitTypes.join(',')}`;
    } else {
      const hitTypes = [...new Set(scanInRepo(c.html).map(i => i.type))];
      const missing = c.types.filter(t => !hitTypes.includes(t));
      ok = missing.length === 0 && hitTypes.length > 0;
      detail = missing.length ? `漏检类型 ${missing.join(',')}（实际命中 ${hitTypes.join(',') || '无'}）` : `命中 ${hitTypes.join(',')} ✓`;
    }
  } catch (e) {
    detail = `异常 ${(e && e.message) || e}`;
  }
  if (c.kind === '合法') { if (ok) legalOk++; } else { if (ok) badOk++; }
  if (!ok) failCases.push(`[${c.kind}] ${c.name} -> ${detail}`);
  console.log(`${ok ? '✅' : '❌'} [${c.kind}] ${c.name}${ok || !detail ? '' : `\n     ${detail}`}`);
}

console.log('\n─────────────────────────────');
if (failCases.length > 0) {
  console.log(`合法误伤 ${(LEGAL.length - legalOk)}/${LEGAL.length}、违规漏检 ${(VIOLATION.length - badOk)}/${VIOLATION.length}`);
  for (const f of failCases) console.log(`  - ${f}`);
  console.log('\n❌ 矩阵未全绿，G05.7 不算落地');
  process.exit(1);
}
console.log(`✅ 合法误伤 0/${LEGAL.length}、违规漏检 0/${VIOLATION.length} —— G05.7 防御矩阵全绿`);
