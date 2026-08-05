# 架构方案: Vibecoding 开发架构模板

## 1. 技术栈
| 层级 | 选型 | 理由 |
|------|------|------|
| 模板语言 | Markdown | Skill / 命令 / 文档均用 Markdown |
| 脚本 | Node.js | quality-gate.js 需要运行时 |
| 版本控制 | Git | 每个 Phase 独立 commit |

## 2. 目录分层
```
vibecoding-template/
├── starter-template/          # 项目脚手架（可复制）
├── .opencode/
│   ├── skills/                # 可复用 Skill（3 个）
│   └── commands/              # 自定义命令（4 个）
├── .vibecoding/
│   ├── templates/             # 文档模板（3 个）
│   ├── quality-gate.js        # 质量闸门
│   └── hooks/                 # Git hook 模板
├── docs/                      # 本架构自身文档
│   ├── 01-PRD.md
│   ├── 02-ARCHITECTURE.md
│   └── 03-STATUS.md
├── AGENTS.md                  # 根级 AI 规范
└── .gitignore
```

## 3. 核心数据模型
N/A — 纯配置文件项目，无数据模型

## 4. 服务端边界
N/A — 纯本地模板项目，无服务端

## 5. Protected Region（AI 不可覆盖）
- `.vibecoding/quality-gate.js` — 质量闸门逻辑
- `.vibecoding/templates/*.md` — 文档模板
- `starter-template/AGENTS.md` — AI 行为规范

## 6. 变更记录
| 日期 | 变更内容 | 原因 |
|------|----------|------|
| 2026-08-05 | 初始创建 | 架构落地 |