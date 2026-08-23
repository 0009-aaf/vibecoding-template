# Changelog

本仓库的变更记录（由 /vibe-implement 阶段6 维护，Keep a Changelog 格式，
按 Conventional Commits type 分组：feat→Added / fix→Fixed / refactor→Changed）。

## [Unreleased]

### Added
- `docs/07-SECURITY.md` 安全基线（vibe-plan 阶段3 产出，G05.5 门禁校验）与 SECURITY-template.md 模板
- `scripts/check-sync.mjs` 漂移检测器：S1 quality-gate 三份一致（强制注册 ID + 配置区剥离哈希）、S2 过期引用归零、S3 悬空命令引用、S4 全局部署滞后（警告）、S5 双源 sync-hash；vibe-gate 插件 commit 前强制执行
- `/vibe-implement` 阶段4：CHANGELOG 追加 + `docs/TECH-DEBT.md` 技术债登记（NOTICED BUT NOT TOUCHING 的落点）
- `/vibe-audit` 三个独立检查项：安全基线对照、技术债对账（TBD/FIXME 与 TECH-DEBT 对账）、漂移检测
- coding-standards skill 族 11 个收编进 `global/skills/`（原在 ~/.claude/skills/，opencode 读不到）
- vibe-README 决策表补充 plan-design/execution-plan 与 vibe-plan 的边界说明

### Fixed
- G06 文档完备性门禁从模板源同步到两份 quality-gate 副本（此前复制 starter-template 的新项目缺失该检查）
- docs 编号冲突：06-RUNBOOK 与 06-CODING-STANDARDS 同号 → CODING-STANDARDS 改为 08

### Changed
- 文档生命周期分配（ADR-002）：安全基线归 plan，CHANGELOG/技术债归 implement，API 文档由 04-CONTRACTS 既有机制覆盖
- quality-gate 同步约定从"双份 MD5 人工约定"升级为"三份一致 + check-sync 机器强制"（ADR-003）
