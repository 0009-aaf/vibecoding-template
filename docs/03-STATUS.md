# 项目状态

> 项目状态与上下文摘要（编号 03）。各 vibe 命令收尾时更新；跨会话恢复先读本文件。变更历史由 git 承载（00-DOC-STANDARD S4 例外）。

## 当前阶段
- [x] 定图纸
- [x] 打地基
- [x] 立规矩
- [x] 开发中（已落地）

## 上下文摘要
- 上次做了什么：**优化第三批落地（O7 模型档位 + O4/O5 调研结论）**——①O7 调研确认本地 opencode.json 已有推理档位变体（`deepseek-v4-flash`=low / `flash-high`=high / `flash-fast`=非思考 / `pro`=high，经 extra_body 透传 thinking.type + reasoning_effort），机制就绪 → 在 vibe-implement/vibe-spec/vibe-audit 三命令执行锚各加"模型档位"条（深度推理→flash-high、常规→flash、fast/solo→flash-fast；用户手动切换，Agent 不自动切）；②O4/O5 调研：vault-sync 经 chat.params 将 active-context 注入 messages 头部，flash 极低价下缓存优化绝对收益≈0 → 不改全局插件，修正 RUNBOOK §4.1 与实际一致（撤销"放末尾"错误表述）。机器校验全绿：quality-gate 9/0/0、check-sync S1-S8 零漂移零警告、checks.py C1-C5 PASS；已 sync-global.ps1 部署。四批优化（O1-O11 评估）已全部收口：落地 7 项 + 调研降级 3 项 + 不做 1 项
- 实体口径：19 个 Skill（5 方法 + 3 设计/前端：frontend-design/ui-ux-pro-max/web-artifacts-builder + coding-standards 族 11）｜7 个 vibe 命令（6 vibe-* + vault-sync）+ 5 个 Agent Team 命令 + vibe-README 导航｜10 模板（9 md + 1 js）｜5 插件
- 关键决策：ADR-004 文档规范 00 元层 + S6 强制；ADR-005 09-DESIGN/宪法/错误码注册表引入；本轮安全/对齐修复走全量审查报告（docs/reports/ 后续归档）
- 下一步：项目完成，可复制 starter-template/ 到新项目使用；仓库变更合入后运行 scripts/sync-global.ps1 部署全局
- ⚠️ 重要提示：使用前确保全局 skills 和 commands 已就位（`~/.config/opencode/`，可从仓库 `global/` 用 `scripts/sync-global.ps1` 同步），复制 starter-template/ 到新项目根目录，修改 AGENTS.md