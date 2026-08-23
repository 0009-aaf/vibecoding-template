# 项目状态

> 项目状态与上下文摘要（编号 03）。各 vibe 命令收尾时更新；跨会话恢复先读本文件。变更历史由 git 承载（00-DOC-STANDARD S4 例外）。

## 当前阶段
- [x] 定图纸
- [x] 打地基
- [x] 立规矩
- [x] 开发中（已落地）

## 上下文摘要
- 上次做了什么：多维度全量架构审查 + 修复（评分 7/10）——①安全 P1 修复：quality-gate M02/M17 命令注入（execFileSync 参数数组化，三副本同步）、clawd-bridge 权限 token 先发后验证（verify-before-send）、guard 补 rm 分写/长选项/sudo 前缀/format 变体漏拦（矩阵扩容 16+22）；②文档对齐：02-ARCHITECTURE §2 目录树刷新 + §6/§7/§8 重排对齐 ARCH-template（库清单/命名约定/测试策略）、00-DOC-STANDARD 补 04/DoD 缺席规则、README 快速开始路径修正；③命令/skill 对齐：vibe-implement 清 M14/M15 悬空引用、coding-standards 路由表补 shell/html + 计数修正（总纲 80 编号）、架构 skill 触发词互斥；④check-sync 新增 S7（skill 路由完整性双向比对 + 引用存在性，注入自测通过），S4 改 os.homedir()，vibe-gate 加超时与输出回显，secret-matrix/guard-matrix 改 import 单一真源
- 实体口径：16 个 Skill（5 方法 + coding-standards 族 11）｜7 个 vibe 命令（6 vibe-* + vault-sync）+ 5 个 Agent Team 命令 + vibe-README 导航｜10 模板（9 md + 1 js）｜5 插件
- 关键决策：ADR-004 文档规范 00 元层 + S6 强制；ADR-005 09-DESIGN/宪法/错误码注册表引入；本轮安全/对齐修复走全量审查报告（docs/reports/ 后续归档）
- 下一步：项目完成，可复制 starter-template/ 到新项目使用；仓库变更合入后运行 scripts/sync-global.ps1 部署全局
- ⚠️ 重要提示：使用前确保全局 skills 和 commands 已就位（`~/.config/opencode/`，可从仓库 `global/` 用 `scripts/sync-global.ps1` 同步），复制 starter-template/ 到新项目根目录，修改 AGENTS.md