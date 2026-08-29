# 项目状态

> 项目状态与上下文摘要（编号 03）。各 vibe 命令收尾时更新；跨会话恢复先读本文件。变更历史由 git 承载（00-DOC-STANDARD S4 例外）。

## 当前阶段
- [x] 定图纸
- [x] 打地基
- [x] 立规矩
- [x] 开发中（已落地）

## 上下文摘要
- 上次做了什么：**优化第四批落地（O10 空 catch 门禁）**——按宪法 C11 先矩阵后上线：①quality-gate 新增 M21 空 catch 扫描（JS/TS 家族源码，掩码法处理字符串/注释/正则防误报；模块级导出 findEmptyCatch 供矩阵单一真源回归）；②新增 `scripts/empty-catch-matrix.mjs` 误报/漏报矩阵（12 合法 + 7 违规全绿）；③上线即拦截仓库自身 6 处存量空 catch（clawd-bridge×3 / vision-bridge×2 / check-sync×1），已按 C3 修复（console.error 可观测 / debug 记录 / continue）；④三副本同步 + 部署。机器校验全绿：quality-gate 10/0/0（新增 M21）、矩阵 0/12+0/7、check-sync S1-S8 零漂移。O1-O11 全部收口
- 实体口径：19 个 Skill（5 方法 + 3 设计/前端：frontend-design/ui-ux-pro-max/web-artifacts-builder + coding-standards 族 11）｜7 个 vibe 命令（6 vibe-* + vault-sync）+ 5 个 Agent Team 命令 + vibe-README 导航｜10 模板（9 md + 1 js）｜5 插件
- 关键决策：ADR-004 文档规范 00 元层 + S6 强制；ADR-005 09-DESIGN/宪法/错误码注册表引入；本轮安全/对齐修复走全量审查报告（docs/reports/ 后续归档）
- 下一步：项目完成，可复制 starter-template/ 到新项目使用；仓库变更合入后运行 scripts/sync-global.ps1 部署全局
- ⚠️ 重要提示：使用前确保全局 skills 和 commands 已就位（`~/.config/opencode/`，可从仓库 `global/` 用 `scripts/sync-global.ps1` 同步），复制 starter-template/ 到新项目根目录，修改 AGENTS.md