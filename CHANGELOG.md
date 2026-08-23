# Changelog

本仓库的变更记录（由 /vibe-implement 阶段6 维护，Keep a Changelog 格式，
按 Conventional Commits type 分组：feat→Added / fix→Fixed / refactor→Changed）。

## [Unreleased]

### Added
- **文档规范体系**（ADR-004）：`docs/00-DOC-STANDARD.md`（编号白名单/必备四件/内容规范/反臃肿）+ 模板；check-sync 新增 S6 文档结构校验（野编号/四件缺失即阻断，实测拦截）
- **项目宪法** `constitution.md`（ADR-005）：13 条不可协商条款自既有约定提炼；starter AGENTS 顶部引用 + vibe-plan/spec/implement/audit 四命令守卫注入"违背即否决"；变更须 ADR
- **界面设计文档体系**（ADR-005）：DESIGN-template（设计令牌/页面清单/组件复用/交互五态/响应式/无障碍基线 8 章）→ vibe-plan 阶段4 生成 `docs/09-DESIGN.md`；G05.6 门禁（判定与 M18 共用 isUiFile）；audit 视觉走查清单；UI 切片 spec 强制引用 09-DESIGN 条目
- **04-CONTRACTS 独立模板**：补结构性欠账（此前结构仅内嵌命令文本）；含全局错误码注册表（`<域>-<三位数>`，禁私造/禁复用语义）+ 端点契约含错误码与性能预算
- **数据库迁移规范**（architecture-designer Step 3 + ARCH-template，双源 sync-hash 3→4）：命名/可回滚/destructive 须 ADR+备份先行
- **RUNBOOK §9 日志与追踪**（可观测性：日志格式/级别/requestId 贯穿/健康检查）+ **§10 环境晋升与灰度**
- **feature flag 规范**（CODING-STANDARDS §4：命名/登记 TECH-DEBT/禁遮蔽契约变更）
- **D5 缓存失效策略必答**（architecture-designer Step 9 + ARCH §9 注）
- vibe-plan 阶段5 新增生成 00-DOC-STANDARD 与 constitution（均增量保护）

### Fixed
- 存量文档合规整改：01-PRD/02-ARCHITECTURE 补引言 blockquote、03-STATUS 补引言、06-RUNBOOK/08-CODING-STANDARDS 补变更记录、RUNBOOK/CODING-STANDARDS 模板补变更记录占位（S6 上线即发现）

### Changed
- vibe-plan 阶段4 定视觉产出升级：从"写入 PRD §2"改为生成 09-DESIGN.md（PRD §2 收敛为方向 + 指向）
- quality-gate G05 增 G05.6 界面设计存在性（isUiFile 提升为模块级，M18/G05.6 同口径）

## [2026-08-23] 文档生命周期补强 + 防漂移机器校验

### Added（首批）
- `docs/07-SECURITY.md` 安全基线（vibe-plan 阶段3 产出，G05.5 门禁校验）与 SECURITY-template.md 模板
- `scripts/check-sync.mjs` 漂移检测器：S1 quality-gate 三份一致（强制注册 ID + 配置区剥离哈希）、S2 过期引用归零、S3 悬空命令引用、S4 全局部署滞后（警告）、S5 双源 sync-hash；vibe-gate 插件 commit 前强制执行
- `/vibe-implement` 阶段4：CHANGELOG 追加 + `docs/TECH-DEBT.md` 技术债登记（NOTICED BUT NOT TOUCHING 的落点）
- `/vibe-audit` 三个独立检查项：安全基线对照、技术债对账（TBD/FIXME 与 TECH-DEBT 对账）、漂移检测
- coding-standards skill 族 11 个收编进 `global/skills/`（原在 ~/.claude/skills/，opencode 读不到）
- vibe-README 决策表补充 plan-design/execution-plan 与 vibe-plan 的边界说明

### Fixed（首批）
- G06 文档完备性门禁从模板源同步到两份 quality-gate 副本（此前复制 starter-template 的新项目缺失该检查）
- docs 编号冲突：06-RUNBOOK 与 06-CODING-STANDARDS 同号 → CODING-STANDARDS 改为 08

### Changed（首批）
- 文档生命周期分配（ADR-002）：安全基线归 plan，CHANGELOG/技术债归 implement，API 文档由 04-CONTRACTS 既有机制覆盖
- quality-gate 同步约定从"双份 MD5 人工约定"升级为"三份一致 + check-sync 机器强制"（ADR-003）
