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
├── skills/                      # 3 个 Skill
│   ├── prd-generator/SKILL.md
│   ├── architecture-designer/SKILL.md
│   └── slice-spec-writer/SKILL.md
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

## 6. 变更记录
| 日期 | 变更内容 | 原因 |
|------|----------|------|
| 2026-08-05 | 初始创建 | 架构落地 |
| 2026-08-05 | 重构：Skill/命令移入全局，项目只留 quality-gate | 全局优先 |