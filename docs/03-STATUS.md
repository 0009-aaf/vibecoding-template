# 项目状态

> 项目状态与上下文摘要（编号 03）。各 vibe 命令收尾时更新；跨会话恢复先读本文件。变更历史由 git 承载（00-DOC-STANDARD S4 例外）。

## 当前阶段
- [x] 定图纸
- [x] 打地基
- [x] 立规矩
- [x] 开发中（已落地）

## 上下文摘要
- 上次做了什么：工作流多维度审查（复查上次 9 项 Minor 修复 + 新变更回归）+ 修复——①审查结论 Minor：上次 P0/P1/P2 全部落实（guard 矩阵 0/0、quality-gate 假通过清除、vault-sync 读配置、PROTECTED_REGIONS 落地）；新发现 3 项：ui-ux-pro-max 测试套件入库不完整（2 收集崩溃 + phosphor 快照哈希失配）、ARCH Skill 计数漂移（16 vs 19）、vibe-plan 新增硬编码 Git bash 路径；②本轮修复：.gitattributes 强制 data/*.sh eol=lf 治本（根因 = autocrlf 漂移，validate_data.py 哈希改为 LF 归一化）、两个依赖上游脚本的测试加 SkipTest 防护（130 passed + 2 skipped + 7923 subtests 全绿）、ARCH §2 目录树 16→19 补 3 设计 skill、vibe-README skills 清单补设计类 + harness 路径说明、README badge 锚点修正、vibe-plan 阶段4 bash 路径语义化（Get-Command 探测）、检查报告审查报告中临时目录名误触发 S3 后已清理，check-sync 全绿 + sync-global.ps1 已同步部署；③新增 .gitattributes（ui-ux-pro-max data + web-artifacts-builder scripts 强制 LF，T-02 CRLF 一并修复）
- 实体口径：19 个 Skill（5 方法 + 3 设计/前端：frontend-design/ui-ux-pro-max/web-artifacts-builder + coding-standards 族 11）｜7 个 vibe 命令（6 vibe-* + vault-sync）+ 5 个 Agent Team 命令 + vibe-README 导航｜10 模板（9 md + 1 js）｜5 插件
- 关键决策：ADR-004 文档规范 00 元层 + S6 强制；ADR-005 09-DESIGN/宪法/错误码注册表引入；本轮安全/对齐修复走全量审查报告（docs/reports/ 后续归档）
- 下一步：项目完成，可复制 starter-template/ 到新项目使用；仓库变更合入后运行 scripts/sync-global.ps1 部署全局
- ⚠️ 重要提示：使用前确保全局 skills 和 commands 已就位（`~/.config/opencode/`，可从仓库 `global/` 用 `scripts/sync-global.ps1` 同步），复制 starter-template/ 到新项目根目录，修改 AGENTS.md