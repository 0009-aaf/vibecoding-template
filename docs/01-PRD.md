# PRD: Vibecoding 开发架构模板

> 需求与验收标准（含 §3.1 NFR）。/vibe-plan 阶段2 生成；需求变更走 §4 变更记录并同步切片。
> 本文档须遵守 `docs/00-DOC-STANDARD.md`。

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

### 五个全局 Skill（~/.config/opencode/skills/）
- 功能描述：prd-generator、architecture-designer、architecture-selection、slice-spec-writer、e2e-verifier 五个 Skill，全局可用
- 验收标准：
  - 成功路径：任何项目可加载全局 Skill
  - 失败路径：Skill 加载后无法执行指定步骤
  - 边界条件：触发词在 description 中明确定义
- 优先级：P0

### 浏览器 E2E 验证（e2e-verifier）
- 功能描述：浏览器实际操控 + 功能断言 + 截图 + doubao 视觉核对，验证切片功能与 UI
- 验收标准：
  - 成功路径：按验收标准走成功/失败/边界路径，输出 PASS/FAIL + 截图证据
  - 失败路径：验证未通过 → 报告未通过项供修复
  - 边界条件：应用启动命令自动探测
- 优先级：P0

### 全局命令（~/.config/opencode/commands/）
- 功能描述：vibe-plan、vibe-spec、vibe-audit、vibe-implement、vibe-status、vibe-clean、vault-sync 七个命令
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

## 3.1 非功能需求（NFR）— 模板项目范例
| 维度 | 值 | 备注 |
|------|-----|------|
| 预期规模（用户/数据/QPS） | 单用户，<100KB 文档 | 纯配置/Markdown 项目 |
| 可用性 SLO | 不适用（本地模板，无在线服务） | |
| 峰值并发 | 不适用（单用户本地） | |
| 一致性要求 | 不适用（无数据存储） | |
| 合规要求 | 不适用（无用户数据） | |
| 灾备 RTO / RPO | 不适用（Git 即灾备：仓库多副本可回滚） | |
| 部署环境 | 本地 | 无服务部署 |
| 团队技能栈 | Node.js（quality-gate 运行时） | |

> 范例说明：小型本地工具多数维度显式"不适用(理由)"即可——G05 门禁校验"有答案"而非"有内容"。

## 4. 变更记录
| 日期 | 变更内容 | 原因 |
|------|----------|------|
| 2026-08-05 | 初始创建 | 架构落地 |
| 2026-08-05 | 重构：Skill/命令移入全局 | 全局优先 |