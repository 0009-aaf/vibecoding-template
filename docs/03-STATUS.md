# 项目状态

> 项目状态与上下文摘要（编号 03）。各 vibe 命令收尾时更新；跨会话恢复先读本文件。变更历史由 git 承载（00-DOC-STANDARD S4 例外）。

## 当前阶段
- [x] 定图纸
- [x] 打地基
- [x] 立规矩
- [x] 开发中（已落地）

## 上下文摘要
- 上次做了什么：**优化第一批落地（O3/O11/O6，注意力与成本）**——①O3 vibe-implement 执行锚加第 7 条"文档读取纪律"（只读任务点名章节、单文件 ≤80 行、超出用 grep/指针定位——防长上下文注意力稀释、保 V4 上下文缓存命中）；②O11 vibe-spec 阶段3 新增"并行命令清单"（依赖图确定后输出无依赖切片组的并行启动命令，利用模型高并发，仍用户手动多窗口）；③O6 RUNBOOK 新增 §4.1 缓存友好约定（V4 上下文缓存前缀命中：稳定真源批改省钱、易变文件放注入末尾、避免无效改动致缓存失效）。机器校验全绿：quality-gate 9/0/0、check-sync S1-S8 零漂移零警告、checks.py C1-C5 PASS；已 sync-global.ps1 部署。第二批（O8 登记脚本 + O9 逃生阀留痕）待评估
- 实体口径：19 个 Skill（5 方法 + 3 设计/前端：frontend-design/ui-ux-pro-max/web-artifacts-builder + coding-standards 族 11）｜7 个 vibe 命令（6 vibe-* + vault-sync）+ 5 个 Agent Team 命令 + vibe-README 导航｜10 模板（9 md + 1 js）｜5 插件
- 关键决策：ADR-004 文档规范 00 元层 + S6 强制；ADR-005 09-DESIGN/宪法/错误码注册表引入；本轮安全/对齐修复走全量审查报告（docs/reports/ 后续归档）
- 下一步：项目完成，可复制 starter-template/ 到新项目使用；仓库变更合入后运行 scripts/sync-global.ps1 部署全局
- ⚠️ 重要提示：使用前确保全局 skills 和 commands 已就位（`~/.config/opencode/`，可从仓库 `global/` 用 `scripts/sync-global.ps1` 同步），复制 starter-template/ 到新项目根目录，修改 AGENTS.md