# [Project Name]

> 一句话描述项目

## 前置条件

确保全局 opencode 配置已就位：
- `~/.config/opencode/skills/` — 5 个 Skill（prd-generator / architecture-designer / architecture-selection / slice-spec-writer / e2e-verifier）
- `~/.config/opencode/commands/` - 7 个命令（vibe-plan / vibe-spec / vibe-implement / vibe-audit / vibe-status / vibe-clean / vault-sync）

如缺少，从 `vibecoding-template` 仓库运行 `scripts/sync-global.ps1`（把仓库 `global/` 目录同步到全局配置）。

## 快速开始

```bash
# 1. 复制本目录到新项目根目录
# 2. 修改 AGENTS.md 填写项目信息
# 3. 运行 /vibe-plan 开始规划
```

## 可用命令

| 命令 | 用途 |
|------|------|
| `/vibe-plan` | 导需求 → 生成 PRD → 设计架构 + 参考站截图 |
| `/vibe-spec` | 拆切片 |
| `/vibe-implement` | 按切片实现 + 浏览器功能验证 |
| `/vibe-audit` | 提交前审计 |
| `/vibe-status` | 查看项目全貌（切片进度/活跃锁/建议下一步） |
| `/vibe-clean` | 崩溃恢复：清理 worktree/分支/锁残留 |
| `/vault-sync` | 同步决策到 Obsidian |

## 项目结构

```
project/
├── docs/              # 核心文档
│   ├── 01-PRD.md      # 需求 + 验收 + NFR
│   ├── 02-ARCHITECTURE.md  # 架构 + 六主题选型
│   ├── 03-STATUS.md   # 项目状态
│   └── 05-DECISIONS.md # ADR 决策记录
├── slices/            # 切片开发
├── src/               # 最终代码
├── tests/             # 测试
├── references/
│   └── design/        # 参考站截图 + 浏览器验证截图
└── .opencode/
    └── quality-gate.js # 含 G05 架构完备性门禁
```

## 架构选型说明

- `/vibe-plan` 阶段3 加载 `architecture-selection` skill，对 NFR 适用的维度弹选项（⭐推荐 + 优劣）
- 每个选型必须来自成熟目录（不现场发明）；每维"有决策 或 显式不适用"
- 每个非平凡选型写 ADR 到 `docs/05-DECISIONS.md`；G05 门禁校验 NFR/选型/ADR 齐备

## 开发流程

1. Phase 1: 定图纸 — 写 PRD，定视觉
2. Phase 2: 打地基 — 定架构，锁技术栈
3. Phase 3: 立规矩 — 三份文档，开发规范
4. 开发：按切片迭代

## 参考

- AGENTS.md — AI 行为约定
- docs/PROJECT.md — 项目详情
- docs/TASKS.md — 任务跟踪