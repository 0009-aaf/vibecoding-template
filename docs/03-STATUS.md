# 项目状态

> 项目状态与上下文摘要（编号 03）。各 vibe 命令收尾时更新；跨会话恢复先读本文件。变更历史由 git 承载（00-DOC-STANDARD S4 例外）。

## 当前阶段
- [x] 定图纸
- [x] 打地基
- [x] 立规矩
- [x] 开发中（已落地）

## 上下文摘要
- 上次做了什么：**vibe-implement 注意力优化试点**（结合 V4-Flash 真实模型状况评估后的第一批落地）——①执行锚（RECENCY ANCHOR）从文末前置到文件头部 frontmatter 后（prompt sandwich：最高约束首屏可见，治长命令中段规则遗忘）；②文末"失败处理"段上移合并到阶段3 修复策略前（消除约 180 行注意力跳跃 + 与"停止条件"去重）；③反合理化表下沉受 `vibe-command-structure/checks.py` C4 机制检查约束（4 个"反合理化表"标题必须保留在文件内），故 O2 试点范围收敛为"执行锚前置 + 重复段落合并"，未动 C4 锚点。机器校验全绿：quality-gate 9/0/0、check-sync S1-S8 零漂移零警告、checks.py C1-C5 PASS；已跑 sync-global.ps1 部署全局生效。后续优化（O3-O11：读文档预算/缓存注入顺序/reasoning_effort 分级/登记脚本等）待评估后分批落地
- 实体口径：19 个 Skill（5 方法 + 3 设计/前端：frontend-design/ui-ux-pro-max/web-artifacts-builder + coding-standards 族 11）｜7 个 vibe 命令（6 vibe-* + vault-sync）+ 5 个 Agent Team 命令 + vibe-README 导航｜10 模板（9 md + 1 js）｜5 插件
- 关键决策：ADR-004 文档规范 00 元层 + S6 强制；ADR-005 09-DESIGN/宪法/错误码注册表引入；本轮安全/对齐修复走全量审查报告（docs/reports/ 后续归档）
- 下一步：项目完成，可复制 starter-template/ 到新项目使用；仓库变更合入后运行 scripts/sync-global.ps1 部署全局
- ⚠️ 重要提示：使用前确保全局 skills 和 commands 已就位（`~/.config/opencode/`，可从仓库 `global/` 用 `scripts/sync-global.ps1` 同步），复制 starter-template/ 到新项目根目录，修改 AGENTS.md