# 项目状态

## 当前阶段
- [x] 定图纸（Phase 1）
- [x] 打地基（Phase 2）
- [x] 立规矩（Phase 3）
- [x] 开发中（已落地）

## 上下文摘要
- 上次做了什么：架构审查 + 修正——文档实体清单统一 + 全局实体纳入版本控制 + 自举闭环
- 关键决策：5 个 Skill、7 个 vibe 命令移入全局 `~/.config/opencode/`；仓库新增 `global/` 真源镜像 + `scripts/sync-global.ps1` 支持从仓库恢复完整工作流；项目只保留双份 `quality-gate.js`（根 + starter-template）
- 下一步：项目完成，可复制 starter-template/ 到新项目使用
- ⚠️ 重要提示：使用前确保全局 skills 和 commands 已就位（`~/.config/opencode/`，可从仓库 `global/` 用 `scripts/sync-global.ps1` 同步），复制 starter-template/ 到新项目根目录，修改 AGENTS.md