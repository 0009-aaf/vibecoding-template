---
description: 审计命令：commit 前检查密钥扫描、契约一致性、变更范围、文档同步、测试覆盖、安全基线对照、技术债对账、漂移检测。优先调用项目 .opencode/quality-gate.js，不存在则做基础检查。
---

## /vibe-audit - 提交前审计

### 会话隔离
生成 SID = `audit-{今日日期}-{4位随机}`。注册：`python ~/.claude/harness/blackboard.py register <SID> "vibe-audit (<审查摘要>)"`
> 会话异常中断时，需手动从 blackboard 清除本 SID：`python ~/.claude/harness/blackboard.py remove <SID>`

### 守卫
先检查项目根是否存在 `.opencode/quality-gate.js`：
- 存在 -> 调用 `node .opencode/quality-gate.js`，以它的输出为准
- 不存在 -> 执行下方基础检查

> **去重说明**：如果 `/vibe-implement` 阶段3 已跑过 quality-gate，且本次无新代码变更，
> 可跳过 quality-gate 重新运行。只有 rebase 后或代码有变更时才需要重跑。

确保 `docs/03-STATUS.md` 存在，不存在则创建空文件

### DoD 读取（独立于 quality-gate，无论是否存在 quality-gate.js 都执行）
- 读取 `docs/DoD.md`（项目级完成底线，由 /vibe-plan 生成）
- 不存在 -> 跳过 DoD 检查，在报告中标注"⚠️ 缺 docs/DoD.md，建议运行 /vibe-plan"（不阻断）
- 存在 -> 对当前变更逐项核对五段清单（Correctness / Quality / Integration / Documentation / Ship-readiness）：
  - **Correctness**：运行时验证证据（非仅编译通过）；新行为有红→绿测试
  - **Quality**：无死代码/调试输出；无顺手重构（超出任务范围）
  - **Integration**：迁移/配置/feature flag 已处理；API 变更向后兼容
  - **Documentation**：公共接口已文档化；决策已记录（ADR / STATUS）
  - **Ship-readiness**：安全影响已评审；存在回滚路径；人类已批准
- 任一未勾选 -> **阻断**，报告缺哪项（阻断结论独立计入，不受 quality-gate 结果覆盖）

### 安全基线对照（独立于 quality-gate，无论是否存在 quality-gate.js 都执行）
- 读取 `docs/07-SECURITY.md`（安全基线，由 /vibe-plan 阶段3 生成）
- 不存在 -> 跳过，报告标注"⚠️ 缺 docs/07-SECURITY.md（G05.5 门禁项），建议运行 /vibe-plan"（不阻断，quality-gate 的 G05.5 会拦）
- 存在 -> 对本次变更逐项对照：
  - 变更触及认证/授权/密钥/输入校验/CORS/依赖清单 -> 核对是否符合基线表
  - 引入新库 -> 是否在 ARCH §6 库清单内（对应 M16）
  - 基线冲突 -> **阻断**，报告冲突项与基线条目
  - 基线需要演进（如新增限流）-> 提示更新 07-SECURITY.md 并记 ADR

### 技术债对账（独立于 quality-gate）
- 扫描本次变更代码中的 `TODO` / `TBD` / `FIXME` / `XXX` 注释
- 读取 `docs/TECH-DEBT.md`（由 /vibe-implement 阶段4 维护）
- 代码中有标记但债务清单未登记 -> **警告**，列出未登记项（提示补登记，不阻断）
- `docs/TECH-DEBT.md` 不存在且代码中无标记 -> 通过
- 清单中有"建议处理时机"已到期未处理的项 -> 警告提醒

### 漂移检测（若仓库配置了 scripts/check-sync.mjs）
- 仓库根存在 `scripts/check-sync.mjs` -> 运行 `node scripts/check-sync.mjs`
- 退出码非零（检测到多副本/引用漂移）-> **阻断**，报告漂移明细（修复同步后再提交）
- 不存在 -> 跳过（该脚本为可选配置，vibecoding-template 类多副本仓库使用）

### 基础检查（无 quality-gate.js 时）

#### 1. 密钥扫描（阻断）
- 扫描 `git diff` 中新增的文本
- 正则匹配：`sk-`、`api_key`、`password`、`secret`、`token`、`private_key`
- 发现密钥 -> 阻断并报告位置

#### 2. 契约一致性检查（阻断，新增）
- 如果 `.opencode/quality-gate.js` 存在，它已包含 M16 库清单检查
- 手动检查实现代码的 API 端点是否匹配 `docs/04-CONTRACTS.md` 定义：
  - 读取 `docs/04-CONTRACTS.md` 中的 API 端点定义
  - 对比实现代码中的路由注册（如 `routes.ts`、`app.use()`、`@Controller`）
  - path、method 不一致 -> 阻断
  - 导出类型不一致 -> 阻断
- 如果 `docs/04-CONTRACTS.md` 不存在 -> 跳过（向后兼容）

#### 3. 变更范围检查（警告）
- 对比本次变更涉及的文件和任务指定的文件
- 超出范围 -> 警告并列出额外文件

#### 4. 文档同步检查（警告）
- 检查 `docs/01-PRD.md` 和 `docs/02-ARCHITECTURE.md` 是否需要更新
- 落地核对（不靠感觉，逐项比对）：
  - `AGENTS.md` 项目信息表（技术栈/数据库/部署） vs `docs/02-ARCHITECTURE.md` §1 选型
  - `docs/03-STATUS.md` 各切片状态 vs `slices/README.md` 状态列
  - 命令表中的命令数 vs 实际命令文件数（多副本仓库跑 `node scripts/check-sync.mjs`，见漂移检测）
  - 新增依赖是否已写入 ARCH §6 库清单
- 需求变更但文档未同步 -> 警告

#### 5. 测试覆盖检查（警告，新增）
- 有 API 变更 -> 检查 `tests/integration/` 是否有对应测试
- 有 UI 变更 -> 检查 `e2e/` 是否有对应测试
- 测试覆盖率低于架构 §8 目标 -> 警告
- spec 定义的测试用例是否全部实现 -> 缺失则警告

#### 6. UI/功能验证检查（可选）
- 有 UI 变更（`src/` 含页面/组件）-> 检查 `references/design/verification/<slice>/` 是否有验证截图
- 有代码变更但无验证截图 -> 警告"建议运行浏览器验证"
- 有验证截图 -> 确认 vision 分析结果 PASS（分析工具可选，不硬编码）

#### 7. 诊断痕迹核对（警告，新增）
- 若切片状态为"进行中/待验收"且 `.vibecoding/dense-track.md` 存在：
  - 有 `✗` 行但无对应"doubt 循环"记录 -> 警告"该失败是否已走 doubt 循环？"
  - 连续 2 轮失败但无 `失败诊断:` / `证据链:` 记录 -> 警告"修复循环缺少诊断携带"
- 属警告级，不阻断

### 产出
**报告聚合规则**：quality-gate.js 存在 -> 基础检查各行的结论以 quality-gate 输出为准，
DoD 行独立判定（不受 quality-gate 覆盖）；quality-gate.js 不存在 -> 基础检查各行按本文件检查项判定。
审计报告格式：
```
## 审计报告

### 密钥扫描: ✅ 通过 / ❌ 阻断
### 契约一致性: ✅ 通过 / ❌ 阻断
### 变更范围: ✅ 通过 / ⚠️ 警告
### 文档同步: ✅ 通过 / ⚠️ 警告
### 测试覆盖: ✅ 通过 / ⚠️ 警告
### UI/功能验证: ✅ 通过 / ⚠️ 建议
### 诊断痕迹: ✅ 通过 / ⚠️ 警告
### 安全基线对照: ✅ 通过 / ❌ 阻断 / ⏭️ 跳过（缺 07-SECURITY.md）
### 技术债对账: ✅ 通过 / ⚠️ 警告
### 漂移检测: ✅ 通过 / ❌ 阻断 / ⏭️ 跳过（未配置）
### Definition of Done: ✅ 通过 / ❌ 阻断

### 结论: ✅ 可提交（AC ∩ DoD 双闸门通过） / ❌ 需修复
```

### 报告持久化
- 审计完成后，将报告写入文件：`docs/reports/YYYY-MM-DD-HHMM.md`
  - 目录不存在则创建（`New-Item -ItemType Directory -Force` / `mkdir -p`）
  - 文件名用审计完成时间戳，避免覆盖
- 文件内容 = 对话中输出的完整审计报告（含密钥/契约/范围/文档/测试/UI/诊断痕迹/DoD 各项结论）
- 在对话中告知用户报告路径（"审计报告已保存到 docs/reports/..."）
- 阻断型审计（❌ 需修复）也保存报告，方便用户对照修复

### 审计通过后
- 如果本次变更有**架构决策/技术选型/PRD 变更**，运行 `/vault-sync` 同步到 Obsidian
- 如果 `docs/` 有变更（PRD/架构/契约），审计报告会提示运行 `/vault-sync --sync-docs`
- 如果只是代码实现（切片内无决策变更），不需要跑 vault-sync
- 从 blackboard 移除本会话：`python ~/.claude/harness/blackboard.py archive <SID>`
