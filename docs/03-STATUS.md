# 项目状态

## 当前阶段
- [x] 定图纸
- [x] 打地基
- [x] 立规矩
- [x] 开发中（已落地）

## 上下文摘要
- 上次做了什么：第二轮全量审查修复——术语统一十维度（§9 表 10 行 + G05 升级为 §9 段内十维检查，D1/D2/D3/D10 不再漏检）+ M18 UI 判定扩展 + M02 路径加引号 + 孤儿模板清理（删 PRD-template/decision-log，ARCH-template 对齐 skill 真源 §1–§10）+ 机器路径可移植化（blackboard → `~/.claude/harness/`，vault 路径改读 opencode.json 配置）+ audit 报告路径统一 `docs/reports/` + sync-global 修复 `-Exclude` 递归失效
- 关键决策：5 个 Skill、7 个 vibe 命令移入全局 `~/.config/opencode/`；仓库新增 `global/` 真源镜像 + `scripts/sync-global.ps1` 支持从仓库恢复完整工作流；项目只保留双份 `quality-gate.js`（根 + starter-template，MD5 必须一致）；guard 误报/漏报矩阵落盘 `global/plugins/guard/guard-matrix.mjs`（DoD 防御必测）；模板权威清单 5→3（checks.py AUTHORITATIVE_TEMPLATES 同步）；选型口径与 ZCode 插件版（zcode-vibe-plugin v1.1.0）统一为十维度
- 下一步：项目完成，可复制 starter-template/ 到新项目使用
- ⚠️ 重要提示：使用前确保全局 skills 和 commands 已就位（`~/.config/opencode/`，可从仓库 `global/` 用 `scripts/sync-global.ps1` 同步），复制 starter-template/ 到新项目根目录，修改 AGENTS.md