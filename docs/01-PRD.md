# PRD: Vibecoding 开发架构模板

## 1. 需求清单

### 项目脚手架（starter-template/）
- 功能描述：提供可复制的项目初始化模板，包含 AGENTS.md、PROJECT.md、TASKS.md、.gitignore、README.md
- 验收标准：
  - 成功路径：复制 starter-template/ 到新项目后，修改 AGENTS.md 即可开始开发
  - 失败路径：N/A
  - 边界条件：模板内容保持通用，不绑定具体技术栈
- 优先级：P0

### 三份核心文档模板（docs/）
- 功能描述：PRD、架构、项目状态三份文档模板，作为 AI 的全局上下文
- 验收标准：
  - 成功路径：每个文档模板包含完整章节和填空占位
  - 失败路径：N/A
  - 边界条件：文档模板必须与 Skill 的输出格式一致
- 优先级：P0

### 三个 Skill（.opencode/skills/）
- 功能描述：prd-generator、architecture-designer、slice-spec-writer 三个 Skill
- 验收标准：
  - 成功路径：每个 Skill 包含 frontmatter + 工作步骤 + 输出模板
  - 失败路径：Skill 加载后无法执行指定步骤
  - 边界条件：触发词在 description 中明确定义
- 优先级：P0

### 四个自定义命令（.opencode/commands/）
- 功能描述：plan、spec、implement、audit 四个命令
- 验收标准：
  - 成功路径：命令可被 opencode 识别并执行
  - 失败路径：命令格式与 opencode 不兼容
  - 边界条件：命令之间可串联调用
- 优先级：P1

### 质量闸门（.vibecoding/quality-gate.js）
- 功能描述：提交前自动检查密钥扫描、Protected Region、变更范围、文档同步
- 验收标准：
  - 成功路径：`node .vibecoding/quality-gate.js` 运行并输出审计报告
  - 失败路径：发现密钥或 Protected Region 被修改时阻断提交
- 优先级：P1

## 2. 视觉/页面框架
- 参考：N/A（该项目是 CLI 模板，无 UI）
- 风格方向：纯 CLI / Markdown 风格
- 避免 AI 味：✓

## 3. 项目边界
- [x] 本地自用（模板项目，不上线公开）
- [ ] 无用户数据、支付、隐私合规需求
- [ ] 无性能和成本上限

## 4. 变更记录
| 日期 | 变更内容 | 原因 |
|------|----------|------|
| 2026-08-05 | 初始创建 | 架构落地 |