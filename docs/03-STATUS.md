# 项目状态

> 项目状态与上下文摘要（编号 03）。各 vibe 命令收尾时更新；跨会话恢复先读本文件。变更历史由 git 承载（00-DOC-STANDARD S4 例外）。

## 当前阶段
- [x] 定图纸
- [x] 打地基
- [x] 立规矩
- [x] 开发中（已落地）

## 上下文摘要
- 上次做了什么：文档规范体系 + 前端设计文档 + 项目宪法（ADR-004/005）——①00-DOC-STANDARD 元规范（编号白名单 00-09 + 无编号白名单 + 必备四件）+ check-sync S6 机器校验（上线即抓 03-STATUS 缺引言等 4 处真实问题，野编号实测拦截）；②constitution.md 项目宪法（13 条提炼自既有约定，4 命令守卫注入，变更须 ADR）；③09-DESIGN 界面设计体系（8 章模板：设计令牌/页面/组件/五态/响应式/无障碍，vibe-plan 阶段4 生成，G05.6 门禁与 M18 同口径，audit 视觉走查，UI 切片 spec 强制引用）；④04-CONTRACTS 独立模板 + 全局错误码注册表（治跨切片错误码冲突）；⑤迁移规范（双源 sync-hash 3→4）+ RUNBOOK §9 可观测性 §10 环境晋升 + feature flag 规范 + D5 缓存失效必答；⑥存量 10 份文档全量合规整改（补引言/变更记录）
- 关键决策：ADR-004 文档规范 00 元层 + S6 强制；ADR-005 09-DESIGN/宪法/错误码注册表引入（参照 Kiro design.md 与 Spec Kit constitution 实践）
- 下一步：项目完成，可复制 starter-template/ 到新项目使用；仓库变更合入后运行 scripts/sync-global.ps1 部署全局
- ⚠️ 重要提示：使用前确保全局 skills 和 commands 已就位（`~/.config/opencode/`，可从仓库 `global/` 用 `scripts/sync-global.ps1` 同步），复制 starter-template/ 到新项目根目录，修改 AGENTS.md