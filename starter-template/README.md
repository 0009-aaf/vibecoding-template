# [Project Name]

> 一句话描述项目

## 前置条件

确保全局 opencode 配置已就位：
- `~/.config/opencode/skills/` — 3 个 Skill（prd-generator / architecture-designer / slice-spec-writer）
- `~/.config/opencode/commands/` — 5 个命令（vibe-plan / vibe-spec / vibe-audit / vibe-implement / vault-sync）

如缺少，复制 `vibecoding-template` 项目中的对应目录到全局配置。

## 快速开始

```bash
# 1. 复制本目录到新项目根目录
# 2. 修改 AGENTS.md 填写项目信息
# 3. 运行 /vibe-plan 开始规划
```

## 可用命令

| 命令 | 用途 |
|------|------|
| `/vibe-plan` | 导需求 → 生成 PRD → 设计架构 |
| `/vibe-spec` | 拆切片 |
| `/vibe-implement` | 按切片实现代码 |
| `/vibe-audit` | 提交前审计 |
| `/vault-sync` | 同步决策到 Obsidian |

## 项目结构

```
project/
├── docs/              # 三份核心文档
│   ├── 01-PRD.md
│   ├── 02-ARCHITECTURE.md
│   └── 03-STATUS.md
├── slices/            # 切片开发
├── src/               # 最终代码
├── tests/             # 测试
└── .opencode/
    └── quality-gate.js
```

## 开发流程

1. Phase 1: 定图纸 — 写 PRD，定视觉
2. Phase 2: 打地基 — 定架构，锁技术栈
3. Phase 3: 立规矩 — 三份文档，开发规范
4. 开发：按切片迭代

## 参考

- AGENTS.md — AI 行为约定
- docs/PROJECT.md — 项目详情
- docs/TASKS.md — 任务跟踪