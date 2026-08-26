# AGENTS.md — AI 行为约定

> 本项目是 Vibecoding 开发架构的模板仓库，用于生成新项目的脚手架和 Skill。
> **最高约束：项目根 `constitution.md`**（13 条不可协商条款）——任何产出违背其条款即否决重做。

## 核心文档
- `docs/00-DOC-STANDARD.md` — 文档链元规范（编号白名单 / 必备结构 / 缺席规则），生成任何 docs/ 文档须遵守
- `docs/01-PRD.md` — 本架构的 PRD
- `docs/02-ARCHITECTURE.md` — 架构说明（含 §9 十维度选型）
- `docs/03-STATUS.md` — 项目状态
- `docs/05-DECISIONS.md` — ADR 决策记录（ADR-001 起）
- `docs/06-RUNBOOK.md` / `docs/07-SECURITY.md` / `docs/08-CODING-STANDARDS.md` / `docs/09-DESIGN.md` — 运行手册 / 安全基线 / 代码规范 / 界面设计体系
- `docs/REVISION-PLAN.md` — 架构现代化整改方案；`docs/reports/` — 审计报告存档
- `docs/TECH-DEBT.md` — 技术债登记簿（代码中 TODO/TBD/FIXME/XXX 必须在此登记）
- `docs/04-CONTRACTS.md`：本仓库是多副本真源仓，不直接持有项目级契约文件；契约模板在 `global/templates/CONTRACTS-template.md`，新项目由 `/vibe-spec` 阶段2 生成实体

## 编码规范（六条底线）
1. 入口判空：API 响应/用户输入/文件读取/环境变量，覆盖 null/undefined/[]/"" 四种空值
2. 精准修改：只改需要的代码，不顺手改邻居
3. catch 必处理：禁止空 catch，要么处理要么显式 re-throw
4. 异常不吞：每个错误路径必须追溯到处理或传播
5. 遇 bug 先定位根因再动手修复
6. 防御机制必测：新增安全/拦截/守卫类机制必须先用误报/漏报矩阵实测

## 密钥
密钥不进前端、不进仓库，用环境变量。`opencode.json` 含本地明文 provider 配置，禁止提交仓库或共享。

## 禁止事项
- 不得修改未点名的文件
- 不得覆盖 Protected Region 标记的代码（`.opencode/quality-gate.js` 三副本哈希锁一致、`starter-template/AGENTS.md`）
- 触碰 quality-gate / 命令 / skill 真源后必须同步全部副本并运行 `node scripts/check-sync.mjs` 验证零漂移
- 不得在代码中硬编码密钥

## 工作流
- 本仓库切片路径口径：`slices/<编号>-<名称>/spec.md`（与 `/vibe-spec` 产出一致）
- 多步骤任务禁止静默连跑：每阶段/检查项先输出一行播报再继续
- 每完成一个切片：跑测试 → 过 lint → 运行 `node .opencode/quality-gate.js` → 浏览器验证（有 UI 变更时）→ git commit → 更新 `docs/03-STATUS.md`
- 提交消息遵循 CM11：subject 与 Body 都是文件功能描述（Body 列出全部变更文件）

## UI 红线（预览与正式实现同等生效）
零 emoji、零位图图片；图标一律内联 SVG 或 CSS 几何形（SVG 内禁嵌位图）；照片/Logo 位用灰阶占位盒 + `TODO(asset)` 注释，待用户提供真实素材后替换。机器校验 = quality-gate **G05.7**（扫描 `references/design/*.html`），回归矩阵 = `scripts/ui-redline-matrix.mjs`。
