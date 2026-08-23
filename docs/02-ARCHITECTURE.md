# 架构方案: Vibecoding 开发架构模板

> 架构方案（含 §9 十维度选型）。/vibe-plan 阶段3 生成；选型变更须记 ADR（`docs/05-DECISIONS.md`）并更新本文档。
> 本文档须遵守 `docs/00-DOC-STANDARD.md`。

## 1. 技术栈
| 层级 | 选型 | 理由 |
|------|------|------|
| 模板语言 | Markdown | Skill / 命令 / 文档均用 Markdown |
| 脚本 | Node.js | quality-gate.js 需要运行时 |
| 版本控制 | Git | 每个 Change 独立 commit |

## 2. 目录分层
```
~/.config/opencode/              # 全局（一次配置，所有项目可用）
├── skills/                      # 16 个 Skill（5 方法 + coding-standards 族 11）
│   ├── prd-generator/SKILL.md
│   ├── architecture-designer/SKILL.md
│   ├── architecture-selection/SKILL.md  # 成熟架构目录（10 维选型）
│   ├── slice-spec-writer/SKILL.md
│   ├── e2e-verifier/SKILL.md    # 浏览器 E2E 验证
│   ├── coding-standards/SKILL.md        # 总纲：通用规则 + 语言路由表
│   └── coding-standards-{ts,react,vue,node,python,c,api,wx,shell,html}/
├── commands/                    # 7 个 vibe 命令 + 5 个 Agent Team 命令
│   ├── vibe-plan.md             # 导需求→PRD→架构
│   ├── vibe-spec.md             # 拆切片
│   ├── vibe-implement.md        # 实现切片
│   ├── vibe-audit.md            # 提交前审计
│   ├── vibe-status.md           # 项目全貌/残留
│   ├── vibe-clean.md            # 崩溃恢复清理
│   ├── vault-sync.md            # 同步 Obsidian
│   ├── vibe-README.md           # 工作流入口导航（非命令，文档）
│   └── ...（focus-* / execution-plan / plan-design）
├── templates/                   # 10 个模板（9 md + 1 js）
│   ├── ARCH-template.md         # 架构文档模板（与 architecture-designer skill 双源 sync-hash）
│   ├── CONSTITUTION-template.md / CONTRACTS-template.md / CODING-STANDARDS-template.md
│   ├── DESIGN-template.md / DOC-STANDARD-template.md / RUNBOOK-template.md / SECURITY-template.md
│   ├── DoD-template.md
│   └── quality-gate-template.js # quality-gate 生成源（三副本由 check-sync S1 校验）
├── plugins/                     # guard（危险命令）/ vibe-gate（commit 门禁）/
│                                # vault-sync / clawd-bridge / vision-bridge
└── （harness 位于 ~/.claude/harness/，git 追踪）
    └── blackboard.py 等脚本

vibecoding-template/             # 模板项目
├── global/                      # 全局实体的真源镜像（单向同步到 ~/.config/opencode）
│   ├── skills/                  # 16 Skill 真源
│   ├── commands/                # 13 命令文件真源（12 命令 + vibe-README 导航）
│   ├── templates/               # 10 模板真源
│   └── plugins/                 # 5 插件真源
├── scripts/
│   ├── sync-global.ps1          # 一键同步 global/ → 全局配置
│   ├── check-sync.mjs           # 漂移检测器（S1–S7，commit 前强制）
│   └── secret-matrix.mjs        # M01 密钥正则误报/漏报矩阵回归
├── starter-template/            # 可复制到新项目的脚手架
│   ├── AGENTS.md
│   ├── .gitignore
│   ├── README.md
│   ├── docs/
│   │   ├── 03-STATUS.md
│   │   ├── PROJECT.md
│   │   └── TASKS.md
│   └── .opencode/
│       └── quality-gate.js      # 项目级质量闸门（唯一需要复制的文件）
├── .opencode/
│   └── quality-gate.js          # 本项目的质量闸门（与模板逐字节一致）
├── docs/                        # dogfood：本仓库自身的全套工作流文档
│   ├── 00-DOC-STANDARD.md ～ 09-DESIGN.md（04-CONTRACTS/09-DESIGN 见 §11 说明）
│   ├── TECH-DEBT.md
│   └── reports/                 # /vibe-audit 产物
├── constitution.md              # 项目宪法（/vibe-plan 阶段5 生成）
├── AGENTS.md
├── CHANGELOG.md
└── .gitignore
```

## 3. 核心数据模型
N/A — 纯配置文件项目，无数据模型

## 4. 服务端边界
N/A — 纯本地模板项目，无服务端

## 5. Protected Region（AI 不可覆盖）
- `.opencode/quality-gate.js` — 质量闸门逻辑
- `starter-template/AGENTS.md` — AI 行为规范模板

## 6. 库清单（强制性）
> 新库先改本清单（记 ADR）再写代码；自造轮子信号词（forbiddenPatterns）由 /vibe-plan 写入 quality-gate 的 APPROVED_LIBS（M16 门禁）。

| 库 | 用途 | 备注 |
|----|------|------|
| （无第三方运行时依赖） | quality-gate.js / check-sync.mjs / secret-matrix.mjs 仅用 Node 内置模块（child_process/fs/path/crypto/url） | ADR 承诺零运行时依赖 |
| @opencode-ai/plugin | 插件 hook 类型包 | 仅 .opencode/ devDependency，运行时不加载 |

## 7. 命名约定
- 命令文件：`vibe-<动词>`（工作流）/ `focus-<动词>`（专注会话）/ `<域>-<动词>`（Agent Team：execution-plan / plan-design 等）
- Skill 目录：kebab-case（`coding-standards-<语言>`）
- 模板文件：`<NAME>-template.md`（大写缩写）+ `quality-gate-template.js`
- 文档编号：`NN-NAME.md`，编号只增不回收（见 00-DOC-STANDARD S3）

### 术语表
| 术语 | 含义 |
|------|------|
| 真源（source of truth） | global/ 目录——全局实体的唯一权威副本，单向同步到 ~/.config/opencode（sync-global.ps1） |
| dogfood | 本仓库自身按自家工作流运转（docs/ 即工作流产物实例） |
| sync-hash | 双源镜像一致性标记（当前唯一配对：ARCH-template ↔ architecture-designer skill） |
| Protected Region | AI 不可覆盖文件清单（§5，M02 门禁强制） |
| 切片（slice） | 可独立实现的最小垂直功能单元，路径 `slices/<编号>-<名称>/` |
| 矩阵回归 | 误报/漏报用例矩阵（guard-matrix / secret-matrix），安全规则改动必须跑绿 |

## 8. 测试策略
本模板为纯配置项目，"测试" = 防回归校验，全部本地可跑（命令见 `docs/06-RUNBOOK.md` §3）：

### 8.1 矩阵回归（安全规则）
- `scripts/secret-matrix.mjs`：M01 密钥正则的误报/漏报用例（import quality-gate 真源正则）
- `global/plugins/guard/guard-matrix.mjs`：危险命令拦截的误报/漏报用例
- 规则改动必须跑绿两矩阵（非零退出即失败）

### 8.2 一致性回归（防漂移）
- `scripts/check-sync.mjs`（S1–S7）：quality-gate 三副本、命令引用、双源 sync-hash、部署同步、文档结构、skill 路由完整性/引用存在性
- `.opencode/quality-gate.js`：commit 前自检（vibe-gate 插件强制调用）

### 8.3 浏览器验证（E2E）
- `~/.config/opencode/skills/e2e-verifier/` - 浏览器实际操控 + 功能断言 + 截图 + doubao 视觉核对
- 端口冲突处理：探测已运行服务复用，无服务时动态端口启动
- 截图存储：
  - `references/design/reference/` - 定视觉时参考站截图
  - `references/design/verification/<slice>/` - 切片浏览器验证截图
- 触发点：
  - `/vibe-plan` 阶段4：浏览器访问参考站定视觉
  - `/vibe-implement` 阶段3.5：切片开发后浏览器功能验证
  - `/vibe-audit` 检查项4：UI/功能验证检查

### 8.4 验证降级
- **浏览器可用**：e2e-verifier 走完整 Playwright 操控 + 截图 + 视觉核对
- **CLI 环境（浏览器不可用）**：自动降级为 HTTP curl 测试，纯 UI 项标记 SKIP 不阻断合并，人类验收时补充

### 8.5 并行开发安全
- **切片依赖检查**：`/vibe-implement` 启动前检查前置依赖是否已完成
- **切片锁**：`slices/README.md` 的 `session-id` 列防止重复选取
- **git worktree 隔离**：每个切片用独立 worktree（`../<项目名>-slice-<编号>`），多会话真正并行不干扰
- **合并前 rebase main**：切片合并前先 `git rebase main`，拉取其他切片已合并的共享文件改动，手动解决冲突
- **共享文件**：spec.md 声明共享文件（router/config），追加式修改避免合并冲突
- **回滚流程**：切片失败时删 worktree + 删分支 + 释放锁 + 状态回退
- **状态查看**：`/vibe-status` 一键查看切片进度/活跃锁/worktree/建议下一步

## 9. 十维度选型（D1–D10，来自 architecture-selection 目录）
> 模板项目为纯配置/Markdown 项目，绝大多数维度显式"不适用"——这本身就是 fit-driven 的示范。
> 新项目必须对 NFR 适用的维度完成选型（调 `architecture-selection` skill，逐维弹选项），每维"有决策 或 显式不适用"。

| 维度 | 选型 | 理由 | ADR# |
|------|------|------|------|
| D1 架构风格 | 不适用（无应用代码，纯配置模板） | 模板自身无需架构风格 | - |
| D2 前端客户端 | 不适用（纯配置模板，无前端） | - | - |
| D3 后端 | 不适用（纯配置模板，无后端） | - | - |
| D4 数据库 | 不适用（无数据存储） | 纯 Markdown/配置 | - |
| D5 缓存/内存 | 不适用（无运行时） | - | - |
| D6 高并发 | 不适用（单用户本地） | - | - |
| D7 事务和锁 | 不适用（无事务性写） | - | - |
| D8 CICD | 不适用（本地模板，无流水线） | quality-gate 即门禁 | - |
| D9 灾备 | Git 即灾备 | 仓库多副本可回滚 | ADR-001 |
| D10 部署 | 不适用（本地） | 无服务部署 | - |

## 10. ADR 决策记录
- 详见 `docs/05-DECISIONS.md`（每决策：Context/Decision/Alternatives/Consequences/Verification）

## 11. 变更记录
| 日期 | 变更内容 | 原因 |
|------|----------|------|
| 2026-08-05 | 初始创建 | 架构落地 |
| 2026-08-05 | 重构：Skill/命令移入全局，项目只留 quality-gate | 全局优先 |
| 2026-08-07 | 嵌入浏览器 E2E 验证（e2e-verifier skill + 三命令优化） | 补齐功能/UI验证 |
| 2026-08-07 | 补齐并行安全：依赖检查 + 共享文件 + 回滚 + vibe-status + 端口管理 | 实战踩坑预防 |
| 2026-08-09 | 分支策略改用 git worktree，解决多会话并行工作区冲突 | 实战踩坑修复 |
| 2026-08-09 | 合并前 rebase main + CLI 降级验证（浏览器不可用时 HTTP 测试） | 实战踩坑修复 |
| 2026-08-18 | 加入成熟架构选择机制（architecture-selection skill + NFR + 六主题选型 + ADR + G05 门禁） | 从"现场发明"改为"目录选择" |
| 2026-08-22 | 文档实体清单统一（5 skill/7 命令/5 模板）+ 新增 global/ 真源镜像与 sync-global.ps1 | 修复文档漂移与自举断裂 |
| 2026-08-23 | 术语统一十维度（§9 表 10 行）+ G05 升级为 §9 段内十维检查 + 孤儿模板清理（PRD/decision-log 删除）+ 路径可移植化 + 与 ZCode 插件版口径对齐 | 全量审查修复（N-01~N-07/D-02/C-04） |
| 2026-08-23 | §2 目录树刷新为实际结构（16 Skill/10 模板/13 命令文件）；§6/§7/§8 重排对齐 ARCH-template（库清单/命名约定含术语表/测试策略，原浏览器验证/并行安全/降级收编为 §8 子节） | 全量审查 A1/A2：章节引用悬空（constitution C6/X3/vibe-implement §6/§8）+ 实体计数三方不一致 |