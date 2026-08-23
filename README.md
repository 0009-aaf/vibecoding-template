# vibecoding-template

> **Vibe Coding 工作流模板仓库** — 为 AI Agent（opencode 等）提供可复制的项目脚手架、全局 Skill 镜像与质量门禁，让"边聊边写"有章法、可验证。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRD](https://img.shields.io/badge/vibe-plan-PRD%20NFR-blue)](#)
[![G05](https://img.shields.io/badge/gate-G05%20Architecture-green)](#)

## 为什么用这个模板

普通 vibe coding 的问题：**聊到哪写到哪、无需求基线、无架构决策、无验收门禁**。
本仓库把一条可复用的"定图纸 → 打地基 → 立规矩 → 切片开发"流水线固化成模板与全局镜像，每个新项目复制 `starter-template/` 即可开跑。

## 工作流（7 条命令）

| 命令 | 阶段 | 产出 |
|------|------|------|
| `/vibe-plan` | 定图纸 | PRD + NFR + 架构初稿（docs/01-PRD.md、02-ARCHITECTURE.md） |
| `/vibe-spec` | 立规矩 | 切片规格（docs/04-CONTRACTS.md + slices/<n>/spec.md） |
| `/vibe-implement` | 开发 | 切片实现 + 测试 + e2e 验证 |
| `/vibe-audit` | 收尾 | 全量审查（维度：质量/架构一致性/文档同步/安全） |
| `/vibe-status` | 查看 | 项目全貌：切片进度/活跃项/下一步 |
| `/vibe-clean` | 维护 | 清理孤儿 worktree/分支/临时文件 |
| `/vault-sync` | 同步 | 决策/教训写入 Obsidian Vault |

## 仓库结构

```
vibecoding-template/
├── starter-template/     # ★ 项目脚手架（复制到新项目）
│   ├── AGENTS.md         # AI 行为约束
│   ├── README.md
│   ├── docs/             # 01-PRD / 02-ARCH / 03-STATUS / 04-CONTRACTS / 05-DECISIONS / DoD
│   ├── slices/
│   └── .opencode/quality-gate.js  # G05 门禁（提交前校验）
├── global/               # ★ 全局镜像（同步到 ~/.config/opencode）
│   ├── skills/           # 5 Skill 真源：prd-generator / architecture-designer /
│   │                     #        architecture-selection / slice-spec-writer / e2e-verifier
│   ├── commands/         # 7 命令真源：vibe-plan … vault-sync
│   ├── templates/        # ARCH-template / DoD-template / quality-gate-template
│   └── sync-global.ps1   # 自动同步 global/ → ~/.config/opencode
└── docs/                 # 本仓库自身的 PRD / 架构 / 状态（Dogfood）
```

## 快速开始

```bash
# 1. 复制脚手架
cp -r starter-template/ /path/to/my-project
# 2. 改 AGENTS.md：项目名 + 一段话定位
# 3. （首次）同步全局：global/sync-global.ps1  → 确保 5 Skill + 7 命令就位
# 4. 进入项目跑第一个命令
opencode /vibe-plan
```

## 核心机制（值得看的三个点）

1. **成熟架构选择**：`architecture-selection` skill 内嵌 10 维选型目录（架构风格/前端/后端/数据库/缓存/高并发/事务/CI/CD/灾备/部署），每维带 ⭐ 推荐与优劣；`/vibe-plan` 强制加载 → 决策有据可查。
2. **G05 门禁**：`quality-gate.js` 在提交前校验 NFR 是否量化、选型是否落地、ADR 是否可溯源，防"写了就当有用"。
3. **Dogfooding**：本仓库自己就是按这套工作流跑的（docs/ 下即有 PRD + 架构 + 状态）。

## 关键词 / Topics

`vibe-coding` · `ai-agents` · `opencode` · `claude-code` · `ai-workflow` · `prompt-engineering` · `spec-driven-development` · `architecture` · `quality-gate` · `template` · `AGENTS.md` · `copilot` · `llm-coding` · `developer-tools`

## 兼容性

- 目标宿主：opencode（全局 skill/command 按 opencode 目录约定）
- 思路可移植：Claude Code / Cursor / Cline（把 Skill 换成对应 rules/记忆机制）
- 技术栈无关：模板不绑定具体语言/框架

## License

MIT