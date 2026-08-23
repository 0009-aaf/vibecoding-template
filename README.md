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
| `/vibe-plan` | 定图纸 | PRD + NFR + 架构 + 安全基线（01-PRD / 02-ARCH / 07-SECURITY） |
| `/vibe-spec` | 立规矩 | 切片规格（docs/04-CONTRACTS.md + slices/<n>/spec.md） |
| `/vibe-implement` | 开发 | 切片实现 + 测试 + e2e 验证 + CHANGELOG/技术债登记 |
| `/vibe-audit` | 收尾 | 全量审查（质量/架构一致性/文档同步/安全基线/技术债/漂移检测） |
| `/vibe-status` | 查看 | 项目全貌：切片进度/活跃项/下一步 |
| `/vibe-clean` | 维护 | 清理孤儿 worktree/分支/临时文件 |
| `/vault-sync` | 同步 | 决策/教训写入 Obsidian Vault |

## 仓库结构

```
vibecoding-template/
├── constitution.md       # ★ 项目宪法（13 条不可协商条款，违背即否决）
├── starter-template/     # ★ 项目脚手架（复制到新项目）
│   ├── AGENTS.md         # AI 行为约束（顶部引用宪法）
│   ├── README.md
│   ├── docs/             # 00-DOC-STANDARD / 01-PRD / 02-ARCH / 03-STATUS / 04-CONTRACTS /
│   │                     # 05-DECISIONS / 06-RUNBOOK / 07-SECURITY / 08-CODING-STANDARDS /
│   │                     # 09-DESIGN / DoD / TECH-DEBT
│   ├── slices/
│   └── .opencode/quality-gate.js  # G05/G06 门禁（提交前校验）
├── global/               # ★ 全局镜像（同步到 ~/.config/opencode）
│   ├── skills/           # 16 Skill 真源：5 方法 skill + coding-standards 族 ×11
│   ├── commands/         # 7 命令真源：vibe-plan … vault-sync（+5 Agent Team 命令）
│   ├── templates/        # DOC-STANDARD / ARCH / DoD / SECURITY / DESIGN / CONTRACTS /
│   │                     # RUNBOOK / CODING-STANDARDS / CONSTITUTION / quality-gate 模板
│   └── plugins/          # vibe-gate（commit 前门禁 + 漂移检测）等插件
├── scripts/
│   ├── sync-global.ps1   # 自动同步 global/ → ~/.config/opencode
│   └── check-sync.mjs    # 漂移检测器（S1-S7：多副本/引用/双源/文档结构/skill 路由，commit 前强制）
└── docs/                 # 本仓库自身的全套文档（Dogfood）
```

## 快速开始

```bash
# 1. 复制脚手架
cp -r starter-template/ /path/to/my-project
# 2. 改 AGENTS.md：项目名 + 一段话定位
# 3. （首次）同步全局：scripts/sync-global.ps1  → 确保 16 Skill + 7 命令就位
# 4. 进入项目跑第一个命令
opencode /vibe-plan
```

## 核心机制（值得看的三个点）

1. **成熟架构选择**：`architecture-selection` skill 内嵌 10 维选型目录（架构风格/前端/后端/数据库/缓存/高并发/事务/CI/CD/灾备/部署），每维带 ⭐ 推荐与优劣；`/vibe-plan` 强制加载 → 决策有据可查。
2. **G05/G06 门禁**：`quality-gate.js` 在提交前校验 NFR 是否量化、选型是否落地、ADR 是否可溯源、安全基线与规范文档是否生成，防"写了就当有用"。
3. **防漂移机器校验**：`check-sync.mjs` 在 commit 前校验三份 quality-gate 一致、命令引用真实存在、双源模板 sync-hash 相等——同步约定不再靠自觉（ADR-003）。
4. **Dogfooding**：本仓库自己就是按这套工作流跑的（docs/ 下即有 PRD / 架构 / 安全基线 / 状态 / 技术债登记）。

## 关键词 / Topics

`vibe-coding` · `ai-agents` · `opencode` · `claude-code` · `ai-workflow` · `prompt-engineering` · `spec-driven-development` · `architecture` · `quality-gate` · `template` · `AGENTS.md` · `copilot` · `llm-coding` · `developer-tools`

## 兼容性

- 目标宿主：opencode（全局 skill/command 按 opencode 目录约定）
- 思路可移植：Claude Code / Cursor / Cline（把 Skill 换成对应 rules/记忆机制）
- 技术栈无关：模板不绑定具体语言/框架

## License

MIT