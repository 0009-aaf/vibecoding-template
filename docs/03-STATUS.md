# 项目状态

> 项目状态与上下文摘要（编号 03）。各 vibe 命令收尾时更新；跨会话恢复先读本文件。变更历史由 git 承载（00-DOC-STANDARD S4 例外）。

## 当前阶段
- [x] 定图纸
- [x] 打地基
- [x] 立规矩
- [x] 开发中（已落地）

## 上下文摘要
- 上次做了什么：**优化第五批落地（审查驱动：M21 掩码漏报加固 + S9 新鲜度校验）**——①审查 6 批优化全绿后实测发现 M21 掩码法漏报：单行除法 `a / b; try{}catch(e){} c / d` 被误当正则区间吞掉真实空 catch（矩阵补 V8 违规用例，修复前放行）；②`maskNonCode` 正则字面量掩码改前置字符判定（正则合法前缀 `( = : [ , ! & | ? { ;` 或行首才掩，标识符/数字/闭括号=除法不掩），三副本同步，矩阵扩容 0/14 + 0/8 全绿；③check-sync 新增 S9 active-context 新鲜度（警告级：更新日期落后 HEAD >3 天即提示刷新/归档，缺失跳过）——上线即检出 active-context 落后 4 天并已刷新；④部署 sync-global 消除 S4 滞后。机器校验：quality-gate 10/0/0、矩阵 0/14+0/8、check-sync S1-S9 阻断 0 警告 0
- 实体口径：19 个 Skill（5 方法 + 3 设计/前端：frontend-design/ui-ux-pro-max/web-artifacts-builder + coding-standards 族 11）｜7 个 vibe 命令（6 vibe-* + vault-sync）+ 5 个 Agent Team 命令 + vibe-README 导航｜10 模板（9 md + 1 js）｜5 插件
- 关键决策：ADR-004 文档规范 00 元层 + S6 强制；ADR-005 09-DESIGN/宪法/错误码注册表引入；本轮安全/对齐修复走全量审查报告（docs/reports/ 后续归档）；M21 掩码前置字符判定（防除法误吞）+ S9 新鲜度校验（警告级不阻断）；M21 残余误报风险（`return /catch {}/`）登记 TECH-DEBT
- 下一步：项目完成，可复制 starter-template/ 到新项目使用；仓库变更合入后运行 scripts/sync-global.ps1 部署全局（本轮已部署）
- ⚠️ 重要提示：使用前确保全局 skills 和 commands 已就位（`~/.config/opencode/`，可从仓库 `global/` 用 `scripts/sync-global.ps1` 同步），复制 starter-template/ 到新项目根目录，修改 AGENTS.md