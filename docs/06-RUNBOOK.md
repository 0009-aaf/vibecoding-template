# Runbook — vibecoding-template

> 运行指南：本仓库自身的同步、门禁与回归验证。vibe-plan 补生成（文档生命周期补强），随实现修正。

## 1. 环境要求

| 项 | 版本 | 说明 |
|---|---|---|
| Node.js | ≥18 | 运行 quality-gate / check-sync / 矩阵脚本 |
| PowerShell | 5.1+ / pwsh | 运行 sync-global.ps1 |
| Python | ≥3.10 | 可选：blackboard.py / checks.py 自检 |
| git | 任意现代版本 | worktree / 钩子依赖 |

## 2. 环境变量

本仓库无 `.env` 依赖。可用的逃生阀：

| 变量 | 用途 | 示例 |
|------|------|------|
| `SKIP_VIBE_GATE=1` | 跳过 quality-gate（仅限门禁自身变更，须在 commit message 说明） | |
| `OPENCODE_DISABLE_GUARD=1` | 禁用 guard 危险命令拦截（调试用） | |

> ⚠️ `~/.config/opencode/opencode.json` 含 provider 密钥，永不入库、永不同步。

## 3. 常用命令

```bash
# 1. 质量门禁（三份副本之一改动后必须各自实测）
node .opencode/quality-gate.js
node starter-template/.opencode/quality-gate.js

# 2. 漂移检测（多副本/引用一致性，commit 前必跑）
node scripts/check-sync.mjs

# 3. 防御机制回归矩阵（guard/secret 规则变更后必跑，矩阵不绿禁止发布）
node global/plugins/guard/guard-matrix.mjs
node scripts/secret-matrix.mjs

# 4. 真源 → 全局部署（global/ -> ~/.config/opencode/）
powershell -ExecutionPolicy Bypass -File scripts/sync-global.ps1

# 5. 文档同步草稿生成（从 dense-track/converge 自动生成 STATUS/CHANGELOG/TECH-DEBT 草稿，确认后贴入）
node scripts/gen-status.mjs <切片编号> "<一句话变更>" --debt "<文件:行>|<问题>|<影响>|<时机>"
```

## 4. 同步约定（谁同步谁、何时同步）

| 真源 | 副本 | 同步时机 | 校验 |
|---|---|---|---|
| `global/templates/quality-gate-template.js` | `.opencode/quality-gate.js` + `starter-template/.opencode/quality-gate.js` | 模板改动后立即 | check-sync 检查 1（检查项 ID 集合一致） |
| `global/`（commands/skills/templates/plugins） | `~/.config/opencode/` | 仓库变更合入后 | check-sync 检查 4 + sync-global.ps1 自检 |
| `global/skills/architecture-designer` | `global/templates/ARCH-template.md` | 任一侧改动后 | check-sync 检查 5（sync-hash 标记） |
| `global/commands/*` 引用的命令/文件 | 实际文件 | 引用增删后 | check-sync 检查 3 |
| `global/skills/coding-standards` 路由表 + 全仓引用的 skill 名 | 实际 skill 目录 | skill 增删/路由改动后 | check-sync 检查 7（路由双向比对 + 引用存在性） |

### 4.1 缓存友好约定（V4 上下文缓存）

DeepSeek V4 上下文缓存按**请求前缀**命中（缓存命中输入 ≈ 未命中的 1/30~1/60）。对 vibe 工作流的影响：

- **稳定真源（宪法/skill/命令/模板）是缓存命中的主体**：批改它们本身是"省钱操作"，改动后立即部署（sync-global.ps1）保持全局与仓库一致，缓存才不浪费
- **active-context 注入现状**：vault-sync 插件经 `chat.params` 钩子将其注入 messages **头部**（`[injected, ...messages]`）——理论上头部易变不利缓存，但 flash 极低价下缓存优化绝对收益≈0，**不改插件**（避免全局语义风险）；约定不承诺"放末尾"
- 避免为"顺手"加无关注释/空行改动稳定文件——一次无效改动 = 整段缓存前缀失效

## 5. 部署（新机器初始化）

1. 克隆本仓库
2. `powershell -ExecutionPolicy Bypass -File scripts/sync-global.ps1`
3. 自检通过 → vibe 命令在 opencode 全局可用
4. 新项目：复制 `starter-template/` 内容到项目根 → 运行 `/vibe-plan`

## 6. 回滚

- 全局配置被污染：删除 `~/.config/opencode/{skills,commands,templates,plugins}` 后重跑 sync-global.ps1
- 项目误用模板：starter-template 为纯文件复制，直接 git revert 项目仓库即可

## 7. 备份与恢复

- 仓库即备份（git）；`~/.config/opencode` 为可再生副本（由 global/ 重建）
- 黑盒外部依赖（`~/.claude/harness/`）不在本仓库备份范围，机器迁移需单独迁移

## 8. 已知运维注意

- quality-gate.js 自身在 Protected Region（M02）内：更新三份副本需 `SKIP_VIBE_GATE=1` 提交并在 message 说明
- `.opencode/node_modules/` 存在历史残留（zod），package.json 未声明——重装即可清理
- sync-global.ps1 的 checks.py 自检依赖本机 harness 路径，新机器用 `-SkipCheck` 跳过

## 变更记录

| 日期 | 变更 | 原因 |
|---|---|---|
| 2026-08-23 | 初版 | 文档生命周期补强（G06 门禁项） |
| 2026-08-29 | 补 §4.1 缓存友好约定（V4 上下文缓存前缀命中，稳定真源批改/易变文件后置） | 注意力与成本优化第一批（O6） |
| 2026-08-29 | §3 常用命令补 #5 gen-status.mjs 文档同步草稿生成用法 | 优化第二批（O8） |
| 2026-08-29 | §4.1 修正 active-context 注入现状（vault-sync 实际注入头部，flash 极低价下缓存优化收益≈0 不改插件） | 优化第三批（O4/O5 调研结论） |
