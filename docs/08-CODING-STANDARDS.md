# Coding Standards — vibecoding-template

> 项目级代码规范（按本仓库技术栈裁剪：JS 脚本 / Markdown 命令与文档 / PowerShell）。
> 全量规范见 `global/skills/coding-standards` skill 族（58 条 + 语言专项，已收编进本仓库），
> 冲突时以本文档为准。

## 1. 命名规范

| # | 规则 | 示例 |
|---|------|------|
| N1 | 变量/函数：可读性优先，禁止缩写（`id`/`url`/`req`/`res`/`ctx` 除外） | `getFileContent` 而非 `gtFContent` |
| N2 | 布尔值：`is`/`has`/`should` 前缀 | `isGitRepo` / `hasStagedFiles` |
| N3 | 常量：全大写 + 下划线 | `PROTECTED_REGIONS` / `SKIP_VIBE_GATE` |
| N4 | 函数：动词开头 | `checkSecrets` / `runQualityGate` |
| N5 | 检查项 ID：M\<两位\>（quality-gate 项）/ G\<两位\>（门禁完备性项），编号只增不改 | `M16` / `G05.5` |
| N6 | 文档编号：docs/NN-NAME.md，按 vibe-plan 生成顺序（01-PRD … 08-CODING-STANDARDS） | `docs/07-SECURITY.md` |

## 2. 文件命名与组织

| # | 规则 |
|---|------|
| F1 | 目录：kebab-case（`vibe-gate/`、`prd-generator/`） |
| F2 | 脚本文件：kebab-case（`quality-gate.js`、`check-sync.mjs`、`sync-global.ps1`） |
| F3 | skill 目录内只放一个 `SKILL.md`；命令文件与命令名一致（`/vibe-plan` → `vibe-plan.md`） |
| F4 | quality-gate 三份（模板 + 根副本 + starter 副本）检查项必须一致，由 `scripts/check-sync.mjs` 强制 |
| F5 | 模板文件以 `-template` 后缀放 `global/templates/`，命令文本引用模板而非内嵌结构 |

## 3. 技术栈专项（JS 脚本 + Markdown + PowerShell）

### 3.1 JS 脚本（quality-gate / 插件 / 检测脚本）

| # | 规则 | 来源 |
|---|------|------|
| S1 | 脚本入口判空：`process.argv`/环境变量/文件读取使用前判空，四种空值（null/undefined/[]/""）全覆盖 | coding-standards 元底线 |
| S2 | 文件读取统一走 `getFileContent()` 封装（存在性 + UTF-8），不裸 `fs.readFileSync` | quality-gate 既有约定 |
| S3 | `execSync` 必须捕获异常并降级（如非 git 仓库 → 跳过 git 检查），不允许异常直接崩脚本 | ND5 catch 必处理 |
| S4 | 退出码语义：0=通过，1=有阻断项；警告不改变退出码 | M 系列既有约定 |
| S5 | 检查函数返回 `{ skipped, issues }` 结构，由 main() 统一聚合计数 | quality-gate 既有约定 |
| S6 | 新增检查项必须同步三份文件 + 模板头部注释清单（防假安全感：未实现的声明显式移除并注释） | 2026-08-22 审计 C-01 |

### 3.2 Markdown（命令 / 模板 / 文档）

| # | 规则 |
|---|------|
| D1 | 命令文件 frontmatter 必须含 description（供命令选择决策表检索） |
| D2 | 命令文本中引用的文件路径必须真实存在（check-sync 检查 3 强制） |
| D3 | 文档章节编号稳定：新增插入用 x.y（如 G05.5），不重排既有编号 |
| D4 | 反合理化表 / 检查清单用 Markdown 表格，禁止折叠进正文段落 |

### 3.3 PowerShell（sync-global.ps1）

| # | 规则 |
|---|------|
| P1 | `$ErrorActionPreference = 'Stop'`；外部命令后检查 `$LASTEXITCODE` |
| P2 | 机器特定路径集中定义在脚本头部（便于新机器移植） |
| P3 | 入口判空：参数与源目录存在性检查先行，失败 `Write-Error` + `exit 1` |

## 4. 契约级约定（与 04-CONTRACTS.md 对齐）

- 本仓库无 API；"契约"= 文档编号体系 + 检查项 ID 体系 + 命令依赖链（vibe-README 地图）
- 检查项 ID 与文档编号一旦发布不回收复用（向后兼容：M04/M05/M09 显式移除而非重用）

## 5. Commit 规范（Conventional Commits）

- 格式：`<type>(<scope>): <subject>`，type ∈ `feat / fix / docs / refactor / test / chore`
- scope：命令名或模块名（如 `fix(vibe-plan): 补安全基线生成步骤`）
- 禁止裸 commit message，禁止 `wip` 提交到 main
- 需跳过门禁时显式 `SKIP_VIBE_GATE=1` 并在 message 中说明原因

## 6. 引用

| 需求 | 位置 |
|------|------|
| 全量通用规范（58 条） | `global/skills/coding-standards/SKILL.md` |
| 语言专项 | `global/skills/coding-standards-{ts,react,node,python,vue,c,api,html,shell,wx}/` |
| 经验教训 | vault `40_Knowledge/lessons-learned.md`（本机踩坑教训） |

## 变更记录

| 日期 | 变更 | 原因 |
|---|---|---|
| 2026-08-23 | 初版 | 文档生命周期补强（G06 门禁项） |
