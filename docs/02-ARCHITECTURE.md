# 架构方案: Vibecoding 开发架构模板

## 1. 技术栈
| 层级 | 选型 | 理由 |
|------|------|------|
| 模板语言 | Markdown | Skill / 命令 / 文档均用 Markdown |
| 脚本 | Node.js | quality-gate.js 需要运行时 |
| 版本控制 | Git | 每个 Change 独立 commit |

## 2. 目录分层
```
~/.config/opencode/              # 全局（一次配置，所有项目可用）
├── skills/                      # 4 个 Skill
│   ├── prd-generator/SKILL.md
│   ├── architecture-designer/SKILL.md
│   ├── slice-spec-writer/SKILL.md
│   └── e2e-verifier/SKILL.md    # 浏览器 E2E 验证
├── commands/
│   ├── vibe-plan.md             # 导需求→PRD→架构
│   ├── vibe-spec.md             # 拆切片
│   ├── vibe-implement.md        # 实现切片
│   ├── vibe-audit.md            # 提交前审计
│   └── vault-sync.md            # 同步 Obsidian
└── templates/
    ├── PRD-template.md
    ├── ARCH-template.md
    └── decision-log.md

vibecoding-template/             # 模板项目
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
│   └── quality-gate.js          # 本项目的质量闸门
├── docs/
│   ├── 01-PRD.md
│   ├── 02-ARCHITECTURE.md
│   └── 03-STATUS.md
├── AGENTS.md
└── .gitignore
```

## 3. 核心数据模型
N/A — 纯配置文件项目，无数据模型

## 4. 服务端边界
N/A — 纯本地模板项目，无服务端

## 5. Protected Region（AI 不可覆盖）
- `.opencode/quality-gate.js` — 质量闸门逻辑
- `starter-template/AGENTS.md` — AI 行为规范模板

## 6. 浏览器验证（E2E）
- `~/.config/opencode/skills/e2e-verifier/` - 浏览器实际操控 + 功能断言 + 截图 + doubao 视觉核对
- 端口冲突处理：探测已运行服务复用，无服务时动态端口启动
- 截图存储：
  - `references/design/reference/` - 定视觉时参考站截图
  - `references/design/verification/<slice>/` - 切片浏览器验证截图
- 触发点：
  - `/vibe-plan` 阶段4：浏览器访问参考站定视觉
  - `/vibe-implement` 阶段3.5：切片开发后浏览器功能验证
  - `/vibe-audit` 检查项4：UI/功能验证检查

## 7. 并行开发安全
- **切片依赖检查**：`/vibe-implement` 启动前检查前置依赖是否已完成
- **切片锁**：`slices/README.md` 的 `session-id` 列防止重复选取
- **git worktree 隔离**：每个切片用独立 worktree（`../<项目名>-slice-<编号>`），多会话真正并行不干扰
- **合并前 rebase main**：切片合并前先 `git rebase main`，拉取其他切片已合并的共享文件改动，手动解决冲突
- **共享文件**：spec.md 声明共享文件（router/config），追加式修改避免合并冲突
- **回滚流程**：切片失败时删 worktree + 删分支 + 释放锁 + 状态回退
- **状态查看**：`/vibe-status` 一键查看切片进度/活跃锁/worktree/建议下一步

## 8. 验证降级
- **浏览器可用**：e2e-verifier 走完整 Playwright 操控 + 截图 + 视觉核对
- **CLI 环境（浏览器不可用）**：自动降级为 HTTP curl 测试，纯 UI 项标记 SKIP 不阻断合并，人类验收时补充

## 9. 六主题选型（来自 architecture-selection 目录）
> 模板项目为纯配置/Markdown 项目，绝大多数维度显式"不适用"——这本身就是 fit-driven 的示范。
> 新项目必须对 NFR 适用的维度完成选型（调 `architecture-selection` skill，逐维弹选项），每维"有决策 或 显式不适用"。

| 维度 | 选型 | 理由 | ADR# |
|------|------|------|------|
| 架构风格 | 不适用（无应用代码，纯配置模板） | 模板自身无需架构风格 | - |
| 数据库 | 不适用（无数据存储） | 纯 Markdown/配置 | - |
| 缓存/内存 | 不适用（无运行时） | - | - |
| 高并发 | 不适用（单用户本地） | - | - |
| 事务和锁 | 不适用（无事务性写） | - | - |
| CICD | 不适用（本地模板，无流水线） | quality-gate 即门禁 | - |
| 灾备 | Git 即灾备 | 仓库多副本可回滚 | ADR-001 |
| 部署 | 不适用（本地） | 无服务部署 | - |

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