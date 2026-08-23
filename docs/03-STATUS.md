# 项目状态

## 当前阶段
- [x] 定图纸
- [x] 打地基
- [x] 立规矩
- [x] 开发中（已落地）

## 上下文摘要
- 上次做了什么：文档生命周期补强 + 防漂移机制——①G06 文档完备性门禁同步到两份 quality-gate 副本（修复实测漂移）并新增 G05.5 安全基线校验；②docs 编号重排：06-RUNBOOK / 07-SECURITY（新增，vibe-plan 阶段3 生成）/ 08-CODING-STANDARDS（原 06 改名）；③vibe-implement 阶段4 新增 CHANGELOG 追加 + TECH-DEBT 登记（NOTICED BUT NOT TOUCHING 有了落点）；④新增 scripts/check-sync.mjs 五项漂移检测（S1 双指标：强制注册 ID + 配置区剥离哈希），vibe-gate 插件 commit 前强制执行；⑤coding-standards skill 族 11 个从 ~/.claude/skills/ 收编进 global/skills/（原部署位置 opencode 读不到）；⑥vibe-audit 新增安全基线对照/技术债对账/漂移检测三个独立检查项；⑦vibe-README 决策表收口（plan-design/execution-plan 与 vibe-plan 边界 + 外部命令白名单标注）
- 关键决策：ADR-002 文档按生命周期分配（plan 产基线 / implement 增量维护）；ADR-003 防漂移机器校验（check-sync + vibe-gate 挂钩）。同步约定升级：quality-gate **三份一致**（模板源 + 根副本 + starter 副本，check-sync S1 强制），不再是"双份 MD5 人工约定"
- 下一步：项目完成，可复制 starter-template/ 到新项目使用；仓库变更合入后运行 scripts/sync-global.ps1 部署全局
- ⚠️ 重要提示：使用前确保全局 skills 和 commands 已就位（`~/.config/opencode/`，可从仓库 `global/` 用 `scripts/sync-global.ps1` 同步），复制 starter-template/ 到新项目根目录，修改 AGENTS.md