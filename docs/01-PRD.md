# PRD: Vibecoding 开发架构模板

## 1. 需求清单

### 项目脚手架（starter-template/）
- 功能描述：提供可复制的项目初始化模板，包含 AGENTS.md、PROJECT.md、TASKS.md、.gitignore、README.md、quality-gate.js
- 验收标准：
  - 成功路径：复制 starter-template/ 到新项目后，修改 AGENTS.md 即可开始开发
  - 失败路径：N/A
  - 边界条件：模板内容保持通用，不绑定具体技术栈
- 优先级：P0

### 三份核心文档（docs/）
- 功能描述：PRD、架构、项目状态三份文档，作为 AI 的全局上下文
- 验收标准：
  - 成功路径：vibe-plan 输出 PRD + ARCH，vibe-spec 更新 STATUS
  - 失败路径：N/A
  - 边界条件：文档模板与 Skill 输出格式一致
- 优先级：P0

### 三个全局 Skill（~/.config/opencode/skills/）
- 功能描述：prd-generator、architecture-designer、slice-spec-writer 三个 Skill，全局可用
- 验收标准：
  - 成功路径：任何项目可加载全局 Skill
  - 失败路径：Skill 加载后无法执行指定步骤
  - 边界条件：触发词在 description 中明确定义
- 优先级：P0

### 全局命令（~/.config/opencode/commands/）
- 功能描述：vibe-plan、vibe-spec、vibe-audit、vibe-implement、vault-sync 五个命令
- 验收标准：
  - 成功路径：命令可被 opencode 识别并执行
  - 失败路径：命令格式与 opencode 不兼容
  - 边界条件：命令之间可串联调用
- 优先级：P1

### 质量闸门（.opencode/quality-gate.js）
- 功能描述：提交前自动检查密钥扫描、Protected Region、变更范围、文档同步
- 验收标准：
  - 成功路径：`node .opencode/quality-gate.js` 运行并输出审计报告
  - 失败路径：发现密钥或 Protected Region 被修改时阻断提交
- 优先级：P1

## 2. 视觉/页面框架
- 参考：N/A（该项目是 CLI 模板，无 UI）
- 风格方向：纯 CLI / Markdown 风格
- 避免 AI 味：✓

## 3. 项目边界
- [x] 本地自用（模板项目，不上线公开）
- [x] 无用户数据、支付、隐私合规需求
- [x] 无性能和成本上限

## 4. 变更记录
| 日期 | 变更内容 | 原因 |
|------|----------|------|
| 2026-08-05 | 初始创建 | 架构落地 |
| 2026-08-05 | 重构：Skill/命令移入全局 | 全局优先 |