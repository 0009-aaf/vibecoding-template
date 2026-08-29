# 项目状态

> 项目状态与上下文摘要（编号 03）。各 vibe 命令收尾时更新；跨会话恢复先读本文件。变更历史由 git 承载（00-DOC-STANDARD S4 例外）。

## 当前阶段
- [x] 定图纸
- [x] 打地基
- [x] 立规矩
- [x] 开发中（已落地）

## 上下文摘要
- 上次做了什么：**优化第二批落地（O8 + O9 降级）**——①O8 新增 `scripts/gen-status.mjs`（从 `.vibecoding/dense-track.md` + `converge-<编号>.md` 自动生成 STATUS/CHANGELOG/TECH-DEBT 三段草稿，含完成层提取/Converge 三态统计/--debt 技术债行；只出草稿不写盘，确认后贴入）；②O9 调研结论：vibe-gate 是 `tool.execute.before` 钩子，git commit 执行前 message 不可读（编辑器形式），阻断式留痕校验只能覆盖 `-m` 形式——降级为 check-sync.mjs SKIP 分支加"逃生阀已用——commit message 必须写明原因留痕"提醒（覆盖所有形式，零误伤）；③RUNBOOK §3 补 gen-status 用法。机器校验全绿：quality-gate 9/0/0、check-sync S1-S8 零漂移零警告、checks.py C1-C5 PASS。第三批（O4/O5 缓存注入顺序 + O7 reasoning_effort，涉及全局配置/opencode 能力验证）待单独评估
- 实体口径：19 个 Skill（5 方法 + 3 设计/前端：frontend-design/ui-ux-pro-max/web-artifacts-builder + coding-standards 族 11）｜7 个 vibe 命令（6 vibe-* + vault-sync）+ 5 个 Agent Team 命令 + vibe-README 导航｜10 模板（9 md + 1 js）｜5 插件
- 关键决策：ADR-004 文档规范 00 元层 + S6 强制；ADR-005 09-DESIGN/宪法/错误码注册表引入；本轮安全/对齐修复走全量审查报告（docs/reports/ 后续归档）
- 下一步：项目完成，可复制 starter-template/ 到新项目使用；仓库变更合入后运行 scripts/sync-global.ps1 部署全局
- ⚠️ 重要提示：使用前确保全局 skills 和 commands 已就位（`~/.config/opencode/`，可从仓库 `global/` 用 `scripts/sync-global.ps1` 同步），复制 starter-template/ 到新项目根目录，修改 AGENTS.md