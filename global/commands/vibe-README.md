---
name: vibe-README
description: vibe 工作流的入口地图：7 个命令的职责与调用时机、依赖链、机制触发点。不知道用哪个命令 / 忘了某机制在哪触发时先看这里。（导航文档，非执行命令）
---

# Vibe 工作流 — 总览与导航

> 本文件是 vibe 工作流的**入口地图**：7 个命令的职责与调用时机、依赖链、机制触发点、与周边组件的关系。
> 不知道用哪个命令 / 忘了某机制在哪触发 → 先看这里。

## 7 个命令总览

| 命令 | 一句话职责 | 调用时机（When to Use） | 前置要求 |
|---|---|---|---|
| `/vibe-plan <需求>` | 项目启动：导需求 → PRD → 架构 → 安全基线 → 界面设计 → 契约 → DoD → 宪法/规范 → quality-gate | **新项目 / 大功能**，还没有 docs/ 时 | 无（问答式收集需求） |
| `/vibe-spec` | 拆切片：PRD+架构 → 垂直切片 + 依赖图 + 每切片 spec | plan 完成后，要开始实现前 | `docs/01-PRD.md` + `docs/02-ARCHITECTURE.md` |
| `/vibe-implement <编号> [--fast\|--full\|--loop]` | 实现一个切片：测试 → 实现 → 闸门 → CHANGELOG/技术债登记 → 验收 → 合并 | **切片就绪后**（依赖已完成） | spec.md + CONTRACTS.md + quality-gate.js |
| `/vibe-audit` | 提交前审计：密钥/契约/范围/文档/测试/UI/诊断痕迹/安全基线/技术债对账/漂移 + **DoD 双闸门** | **合并前**，或 rebase 后 | 至少一个切片处于待验收 |
| `/vibe-status` | 一键看全貌：切片进度、活跃锁、稠密轨（渐进披露）、残留 | **随时**，尤其中断恢复前 | 无 |
| `/vibe-clean [--force\|--scan-only\|--fix-status]` | 崩溃恢复：清 worktree/分支/锁/blackboard 残留 | status 提示有残留时 | 无 |
| `/vault-sync [--sync-docs]` | 同步 Obsidian：决策 → 30_Decisions/，文档 → 20_Projects/，日报 | 有架构/PRD/技术选型决策时（非每次切片） | `opencode.json` 配 `references.vault.path` |

> 口径：**7 个命令 = 6 个 `vibe-*` 前缀命令 + `vault-sync`**（后者的 vault 同步职责独立于切片流水线，故前缀不同）。

## 依赖链（必须按序）

```
/vibe-plan ──> /vibe-spec ──> /vibe-implement ──> /vibe-audit
                  │                │
                  └──> /vibe-status（随时，旁路）
                              │
                         有残留 └──> /vibe-clean
```

- **严禁跳序**：没跑 plan 直接 spec → 报错"缺架构文档"；没跑 spec 直接 implement → 报错"缺切片"
- **implement 依赖**：前置切片必须 `已完成`（依赖检查拒绝启动）
- **audit 是 final gate**：`AC ∩ DoD` 双闸门，缺一即阻断

## 实现档位门控（/vibe-implement）

| 档位 | 适用 | 跳过 | 仍执行（不减验证强度） |
|---|---|---|---|
| `--loop`（默认） | 多阶段/多文件/长任务 | 无 | 完整 7 阶段 |
| `--full` | 多步但有界 | 阶段3.5 浏览器验证可降级 | 其余全部 |
| `--fast` | 单文件/无新行为的改动 | worktree/锁/合并流程 | quality-gate + DoD |

**自动探测兜底**：改动 ≤2 文件且非 API 核心 → 提示可用 `--fast`。
**强制回退**：想 fast 但引入新行为 → 回退 `--full`/`--loop`（需写测试满足 DoD 红→绿）。

## 机制触发点地图

| 机制 | 来源 | 在哪个命令/阶段触发 | 你要注意什么 |
|---|---|---|---|
| 模式门控 fast/full/loop | J-Space | implement 入口 | 选错会被强制回退 |
| 稠密轨 `✓/?/✗` 落盘 | J-Space | implement 阶段2b | `.vibecoding/dense-track.md` 已 git 追踪 |
| 诊断携带重试 | J-Space | implement 阶段3 | 失败先写 `失败诊断:`，第 2 轮起写 `证据链:` |
| doubt 循环（五步） | addyosmani | implement 阶段3 卡壳时 | 同一失败 2 轮无定论才触发；只传工件不给结论 |
| 反合理化表 ×4 | addyosmani | implement 阶段2a/2b/3/5 | 防"跳过步骤"的最后防线 |
| DoD 双闸门 | addyosmani | implement 阶段5 + audit | DoD 定稿后不重谈 |
| 渐进披露 | claude-mem | status 稠密轨 | 只显索引行，回复"展开 <层> 详情"读详情 |
| 项目宪法 constitution.md | Spec Kit | vibe-plan 阶段5 生成 + 4 命令守卫 | 13 条不可协商，违背即否决；变更须 ADR（C13） |
| 文档结构规范（00-DOC-STANDARD） | — | check-sync S6（commit 前） | 编号白名单/H1/引言/变更记录四件 |
| 质量闸门强制 | — | **git commit 前**（vibe-gate hook） | 非 vibe 项目放行；`SKIP_VIBE_GATE=1` 逃生阀 |

## 周边组件关系

```
┌─ commands/vibe-*.md        6 个 vibe-* 命令 + vault-sync（共 7 个，本总览所在层）
│                            另有 5 个 Agent Team 命令（focus-* / plan-design / execution-plan）
├─ skills/                   方法 skill（prd-generator / architecture-designer / slice-spec-writer /
│                            architecture-selection / e2e-verifier）+ 设计 skill（frontend-design /
│                            ui-ux-pro-max / web-artifacts-builder）+ coding-standards 族 ×11（共 19）
├─ templates/                DOC-STANDARD / ARCH / DoD / SECURITY / DESIGN / CONTRACTS /
│                            RUNBOOK / CODING-STANDARDS / CONSTITUTION / quality-gate 模板
│                            （/vibe-plan 复制生成；ARCH 与 skill 双源由 sync-hash 校验）
├─ plugins/vibe-gate/        commit 前强制 quality-gate 的 hook plugin（+ check-sync 漂移检测）
├─ scripts/check-sync.mjs    多副本/引用漂移检测（commit 前 + /vibe-audit）
└─ ~/.claude/harness/tasks/vibe-command-structure/
                             命令本身的结构回归（checks.py 确定性校验）
```

## 验证与回归

```powershell
# 命令结构回归（改了命令文件后跑）
# 注：以下为本机示例路径；实测路径以 `python ~/.claude/harness/tasks/vibe-command-structure/checks.py` 等效为准（PowerShell 需写全路径或用 $HOME 展开）
python "C:\Users\fms\.claude\harness\tasks\vibe-command-structure\checks.py"

# 查看 eval 基线（含 vibe-command-structure）
python "C:\Users\fms\.claude\harness\gate.py" --show
```

## 快速上手（最小路径）

```powershell
/vibe-plan 做一个待办事项 Web 应用，React + Node
/vibe-spec
/vibe-implement 001          # API 切片，完整流程
/vibe-implement 002 --fast   # 样式微调，轻量路径
/vibe-audit                  # 提交前双闸门
/vibe-status                 # 随时查看
```

## 命令选择决策表（与其他工作流的分工）

vibe 不是唯一的工作流，避免命令混用：

| 你的意图 | 用哪个 | 为什么 |
|---|---|---|
| 完整项目开发（PRD→架构→切片→实现→审计） | `/vibe-*` 系列 | 本项目切片流水线，强契约+闸门 |
| 设计探索（头脑风暴→原型→spec→计划，superpowers 风格） | `/project-design` | 对话式门控，适合不确定需求 |
| 单任务深度执行（含自纠回环、一次确认） | `/goal` | 不拆切片，单 agent 深做 |
| 修 bug（轻量：developer→reviewer→tester） | `/fix-bug` | 跳过 architect，最快 |
| 代码审查（多 reviewer 投票） | `/code-review` / `/adversarial-review` | 审查独立于开发 |
| 技术调研 | `/tech-research` | researcher→architect 两段式 |
| 只出方案不动代码（READ-ONLY 调研 + 风险矩阵） | `/plan-design`（本仓库） | 无 PRD/架构文档时的轻量方案设计，输出到 Obsidian |
| 把既有方案排批次并行派发 | `/execution-plan`（本仓库） | 冲突分析 + 批次执行，配合 agent-team |
| 纯专注会话（防上下文污染） | `/focus-start` / `/focus-done`（本仓库） | 单任务焦点 + 记忆卸载 |

**两套规划体系的边界**（vibe-plan vs plan-design/execution-plan）：

| 场景 | 选择 | 理由 |
|---|---|---|
| 新项目 / 要落 docs/ 文档链（PRD→ARCH→CONTRACTS） | `/vibe-plan` | 产出被 G05/G06 门禁消费，进切片流水线 |
| 已有项目出一次性技术方案 / 不想生成全套文档 | `/plan-design` | 轻量、READ-ONLY、输出 Obsidian 供人读 |
| 方案已定、要排执行批次 | `/execution-plan` | 只管派发不管规划 |
| 拿不准 | 先 `/vibe-plan` | 文档链 + 门禁的长线收益大于一次性方案 |

边界规则：**vibe 是项目开发流水线，project-design 是设计前置，goal 是单任务执行**。
同一个需求不要既跑 vibe-plan 又跑 project-design；切片内的小改动走 `/vibe-implement --fast`，
不另起 goal。

> 注：`/project-design`、`/goal`、`/fix-bug`、`/code-review`、`/adversarial-review`、`/tech-research`
> 属于外部 agent-team 命令集（`~/.claude/harness/` 部署），**不在本仓库 global/commands/ 内**——
> check-sync 的外部命令白名单与此处保持一致。

## 多窗口并行操作规范（CLI 多会话）

vibe 支持**用户手动多窗口**并行：每个终端窗口跑一个 `/vibe-implement <编号>`，
靠 worktree + OS 文件锁 + `slices/README.md` session-id 保证不冲突。注意：

1. **每个切片一个独立 worktree**，不要在同一目录开两个窗口跑同一切片。
2. **主 blackboard 写操作只经脚本**（`python ~/.claude/harness/blackboard.py`），
   禁止手改 `_Team/blackboard.md`——多窗口并发写会丢更新（见 blackboard-protocol.md）。
3. **opencode 多实例 session 共享风险**：同一项目目录开两个 `opencode` 实例会共享
   SQLite 会话状态（官方 issue #31307/#28249），编辑/快照会互相覆盖。规避方式：
   - 不同切片 → 各进各的 worktree 目录再开 opencode（推荐）
   - 必须在同一目录开第二个实例时，隔离 session 数据库：
     ```powershell
     $env:OPENCODE_DB = "C:\Users\fms\.local\share\opencode\opencode-$(Get-Random).db"; opencode
     ```
   - 或第二个实例用 `opencode --fork --session <别的会话>` 另起会话
4. **合并锁是串行门**：同一时刻只允许一个切片合并（`.merge-lock-<编号>`），
   其余窗口合并会等待/提示重试——这是设计，不要跳过。
5. **中断恢复**：`/vibe-status` 看残留，`/vibe-clean` 清理后重跑 `/vibe-implement <编号>`。
